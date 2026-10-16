# EF Core 增删改查完全指南——运行机制、实战与避坑

> 适用版本:EF Core 6 ~ 8(示例以 SQL Server 为准,其他数据库同理,差异处已标注)。
> 建议精读第二章"运行机制"——理解了 ChangeTracker 和两条管线(查询管线 / 保存管线),后面 90% 的坑你都能自己推理出来。

## 目录

- 一、全局认知:EF Core 到底是什么
- 二、核心运行机制(重点)
  - 2.1 DbContext——与数据库打交道的大门
  - 2.2 ChangeTracker 与实体状态——整份文档的核心
  - 2.3 查询管线:一行 LINQ 如何变成 SQL
  - 2.4 SaveChanges 管线:账本如何变成 SQL
  - 2.5 跟踪查询 vs 非跟踪查询
- 三、准备工作:实体与 DbContext
- 四、增(Create)
- 五、查(Read)
- 六、改(Update)
- 七、删(Delete)
- 八、SaveChanges 深入:事务与审计
- 九、高频坑位 Top 15
- 十、性能优化清单
- 十一、完整可运行示例
- 十二、常见异常速查表
- 附录:DbContext API 速查表

---

## 一、全局认知:EF Core 到底是什么

EF Core 是 .NET 官方的 ORM(Object-Relational Mapping,对象关系映射)框架,负责把"对象世界"和"关系数据库世界"互相翻译:

| 翻译任务 | 对象世界 | 数据库世界 |
|---|---|---|
| 结构映射 | C# 类 / 属性 / 导航属性 | 表 / 列 / 外键关系 |
| 行为映射 | LINQ 查询 | SELECT / JOIN / WHERE |
| 行为映射 | 对象图的增删改 | INSERT / UPDATE / DELETE |
| 结果映射 | 实体对象(DataReader 逐行"物化") | 结果集行 |

EF Core 在你的程序里同时扮演两个角色:

1. **翻译官(查询)**:把 LINQ 表达式树翻译成 SQL,把结果集物化成对象。这一步是**无状态**的,查完即走。
2. **工作单元(Unit of Work,增删改)**:用 ChangeTracker(变更跟踪器)像记账一样记住你"改了什么",在 `SaveChanges()` 时一次性、按正确顺序、包在一个事务里写回数据库。这一步是**有状态**的,所有行为围绕"账本"展开。

一句话记忆:**查是"无状态翻译",增删改是"有状态记账"。** 增删改的所有怪现象(为什么没更新?为什么更新了没生效?为什么多插了一条?)根源都在这本账上。

### 一次典型请求的全流程

```text
你的代码                          EF Core 内部                        数据库
────────                        ──────────                        ──────
var b = await db.Blogs.First() → 表达式树 → 翻译 SQL → SELECT ... →  行数据
                                ← 物化成 Blog 对象 ←────────────────┘
                                → 记入 ChangeTracker(状态 Unchanged)

b.Title = "新标题"               (暂存内存,EF 暂时不知道)

await db.SaveChangesAsync()     → DetectChanges 比对快照,标 Modified
                                → 生成 UPDATE(只含变化的列) →  执行
                                → 事务提交 → 状态改回 Unchanged
```

---

## 二、核心运行机制(重点)

### 2.1 DbContext——与数据库打交道的大门

`DbContext` 是你与数据库之间唯一的入口,它同时承载:

- **连接与配置**(`DbContextOptions`:连接串、提供程序、日志等)
- **ChangeTracker**:变更跟踪器,增删改的"账本"
- **`DbSet<T>`**:每个实体类型的查询/操作入口(`db.Blogs`)
- **模型元数据(IModel)**:描述所有实体、关系、列映射的"地图"

三条生命周期铁律:

1. **一个 DbContext 实例不是线程安全的**。同一实例上并发跑两个操作会直接抛异常(`A second operation was started on this context instance...`)。
2. **短生命周期**:一次业务操作(一个 Web 请求、一个命令)= 一个上下文实例,用完即弃(`using`/`await using`)。上下文很便宜,创建它不是性能问题。
3. **模型构建有成本,但只发生一次**:EF 第一次使用某模型时要构建全部元数据(很贵),之后按"模型形状"全局缓存。所以正确姿势是"常建常丢",而不是new 一个上下文用一年。

各宿主中的注册方式:

```csharp
// ASP.NET Core:注册为 Scoped,每个请求一个实例,请求结束自动 Dispose
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// 高并发 Web / 控制台工具:上下文池(实例复用,省去重复初始化)
builder.Services.AddDbContextPool<AppDbContext>(o =>
    o.UseSqlServer(connString));
// 注意:池化实例会被复用,不要在派生上下文中保存"每个请求"的状态字段

// 桌面程序(WPF/WinForms):每次操作 new 一个,或注入工厂
builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseSqlServer(connString));
```

### 2.2 ChangeTracker 与实体状态——整份文档的核心

ChangeTracker 是 DbContext 内部的"账本",它做三件事:

1. 记录每个被跟踪实体的**当前值**和**原始值快照**(查询时数据库里的值);
2. 你改属性时它不动声色,`SaveChanges` 时拿"当前值 vs 原始值"对比,算出**哪些列**变了;
3. 同一主键的实体**只有一份实例**(身份解析 Identity Resolution)——所以两次查询同一行,拿到的是同一个对象。

#### 五种实体状态(EntityState)

| 状态 | 含义 | SaveChanges 时的动作 |
|---|---|---|
| `Detached` | 不在账本上,EF 不认识它 | 无 |
| `Unchanged` | 与数据库一致 | 无 |
| `Added` | 新实体 | INSERT,完成后回填自增主键 |
| `Modified` | 有属性被改动 | UPDATE(**只更新被改的列**) |
| `Deleted` | 待删除 | DELETE,完成后变回 Detached |

关键认知:状态只对"被跟踪"的实体有意义。查询(跟踪模式)回来的实体自动是 `Unchanged`;你 `new` 出来的实体默认 `Detached`。

#### 状态转换表(当前状态 → 调用的方法 → 结果)

| 当前状态 | `Add()` | `Update()` | `Attach()` | `Remove()` |
|---|---|---|---|---|
| Detached | Added | 键有值→Modified / 键无值→Added | 键有值→Unchanged / 键无值→Added | 先 Attach,再 Deleted |
| Unchanged | Added | Modified | Unchanged | Deleted |
| Added | Added | Modified | Unchanged | **Detached**(等于撤销新增) |
| Modified | Added | Modified | Unchanged | Deleted |
| Deleted | Added | Modified | Unchanged | Deleted |

> 注:上表针对根实体。通过导航属性可达的关联实体会按同样规则**整图处理**(详见 4.2、6.3)。
> "键无值"指数据库生成的键(自增、Guid 等)尚未赋值(默认值 0 / Guid.Empty)。

#### DetectChanges:账本是怎么发现你改了东西的?

EF 跟踪的是普通 POCO 类,**没有魔法拦截你的属性赋值**。它靠"快照比对":

- 当你调用 `SaveChanges`、`Entry()`、`ChangeTracker.Entries` 等操作时,EF 会先自动执行一次 **DetectChanges**:遍历所有被跟踪实体,用当前值对比原始值快照——发现标量属性变了就把 `Unchanged` 改成 `Modified`;发现导航关系变了(集合里加/删了子实体)就同步修正外键和实体状态。
- 这也是"查询回来直接改属性,SaveChanges 就能更新"的原理:**你从没调用过任何"标记修改"的方法,是 DetectChanges 替你发现的**。
- 跟踪上万实体时 DetectChanges 本身有开销 → 可设 `ChangeTracker.AutoDetectChangesEnabled = false` 自己手动调用(高级优化)。
- `ChangeTracker.Clear()`:清空账本。长生命周期上下文(Blazor、后台任务)防止内存越滚越大的救命稻草。

### 2.3 查询管线:一行 LINQ 是如何变成 SQL 的

```csharp
db.Blogs.Where(b => b.Id > 5).OrderBy(b => b.Id).Take(10)
```

这行代码的完整旅程:

```text
① C# 源码编译期
   它只是构建了一棵"表达式树"(Expression Tree),描述"想做什么",不含 SQL

② QueryCompiler(查询编译)
   按"表达式形状"查编译缓存:常量被提取为参数,形状相同即命中缓存
   未命中 → 翻译器遍历表达式树,把每个方法/属性映射为 SQL 元素

③ SQL 生成(按数据库方言)
   SELECT TOP(@__p_1) [b].[Id], [b].[Title], [b].[CreatedAt]
   FROM [Blogs] AS [b]
   WHERE [b].[Id] > @__p_0
   ORDER BY [b].[Id]

④ ADO.NET 执行:打开连接、传参数、执行命令(防注入 + 缓存友好)

⑤ 物化(Materialization):DataReader 逐行读取
   每行 new 一个 Blog 对象并赋值
   跟踪查询:顺手记入 ChangeTracker(状态 Unchanged)

⑥ 你拿到 List<Blog>
```

四个直接推论(面试高频、踩坑高频):

1. **查询是延迟执行的**。`Where/OrderBy/Take` 只是搭"描述",直到 `ToList/First/Count/Any/foreach` 才真正连数据库。拼接条件、组装通用分页都靠这一点。
2. **表达式树里只能写"能翻译的东西"**。数据库不认识你的 C# 方法:`b.Title.Trim() == x` 可以(有对应 SQL 函数),`MyUtil.Foo(b)` 不行。EF Core 3.0 起不再自动回退到"先查全表再内存过滤",直接抛 `could not be translated`。
3. **常量会变成 SQL 参数**。`b.Id > 5` 与 `b.Id > 某变量` 生成的 SQL 形状相同(仅参数不同),因此编译缓存能命中——这也是"查询形状尽量稳定"的原因。
4. **`IQueryable` 与 `IEnumerable` 是分水岭**。在 `IQueryable` 上拼接,翻译发生在数据库端;一旦 `AsEnumerable()/ToList()` 之后,后续操作全部转到你的内存里(详见 5.2)。

调试利器:不想执行又想看 SQL,用 `query.ToQueryString()`(EF Core 5+)。

### 2.4 SaveChanges 管线:账本如何变成 SQL

调用 `SaveChangesAsync()` 时,EF 按固定步骤执行:

1. **DetectChanges**(若开启自动检测):比对快照,确定每个实体的最终状态和被修改的列。
2. **计算命令集**:按状态生成 INSERT / UPDATE / DELETE 命令,并按外键依赖**排序**——先删子表再删父表;先插父表拿到自增 Id,再插子表。
3. **处理数据库生成值**:执行 INSERT 拿回自增 Id / 默认值,并把 Id **传播**到同一批里子实体的外键属性上。
4. **开启事务**(当前没有环境事务时):本批所有命令包进一个事务。
5. **分批执行**:受数据库参数上限约束(如 SQL Server 单批约 2100 个参数),EF 自动把大量命令拆成多个批次,但仍在同一事务内。
6. **校验影响行数**:预期影响 1 行、实际 0 行 → 抛 `DbUpdateConcurrencyException`(典型场景:并发令牌不匹配、记录已被删除)。
7. **AcceptAllChanges**:更新原始值快照;`Added → Unchanged`(主键已回填);`Deleted → Detached`;`Modified → Unchanged`。

三个直接推论:

- **一次 SaveChanges = 一个原子事务**。多实体的增删改放进同一次 SaveChanges,天然"要么全成、要么全败"。
- **调两次 SaveChanges = 两个事务**,第二次失败不会回滚第一次。需要原子性就合并成一次,或用显式事务(第八章)。
- 级联、顺序、外键传播都是自动的,所以"先 Save 主表拿 Id,再 Save 子表"通常是**多余**的。

### 2.5 跟踪查询 vs 非跟踪查询

| 对比项 | 跟踪查询(默认) | 非跟踪查询(`AsNoTracking()`) |
|---|---|---|
| 实体进 ChangeTracker | 是(Unchanged) | 否 |
| 改属性后 SaveChanges 生效 | 是 | **否(改了也白改)** |
| 同一行查两次 | 返回同一实例(身份解析) | 两个不同实例 |
| 内存 / 速度 | 慢(建快照、查账本) | 明显更快、更省内存 |
| 适用场景 | 查出来就要改 | 纯展示 / 报表 / 导出 / 只读接口 |

补充三点:

- 变体 `AsNoTrackingWithIdentityResolution()`(EF Core 5+):不建账本,但同一行仍复用同一实例,适合自连接、多 Include 场景下的去重。
- **投影查询(`Select` 出 DTO / 匿名类型)永远不跟踪**,写不写 `AsNoTracking` 都一样,天然轻量。
- 黄金法则:**只读查询一律 `AsNoTracking()`**;整个项目都是"读多写少"时,可全局设为默认非跟踪:
  ```csharp
  o.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
  ```

---

## 三、准备工作:实体与 DbContext

### 3.1 NuGet 包

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer      # SQL Server 提供程序
# dotnet add package Pomelo.EntityFrameworkCore.MySql           # MySQL(社区主流)
# dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL      # PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design          # 迁移设计时组件
dotnet tool install --global dotnet-ef                           # 命令行迁移工具
```

### 3.2 实体定义

```csharp
public class Blog
{
    public int Id { get; set; }                  // 主键:名为 Id / BlogId 的属性自动识别
    public string Title { get; set; } = null!;   // 非 null 引用类型 → NOT NULL
    public string? Summary { get; set; }         // 可空引用类型 → 允许 NULL
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }          // 软删除标记(7.4 用到)

    // 导航属性:一个 Blog 有多篇文章(集合导航)
    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public bool IsPublished { get; set; }

    public int BlogId { get; set; }              // 外键列(约定:导航属性名 + Id)
    public Blog Blog { get; set; } = null!;      // 引用导航
}
```

> 约定优先:满足"主键命名(Id/BlogId)、字符串属性非空即 NOT NULL"等约定时,EF 自动建表;约定不满足时才需要显式配置。

### 3.3 DbContext 定义

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Blog>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.HasIndex(x => x.CreatedAt);                        // 常用于排序的列建索引

            b.HasMany(x => x.Posts).WithOne(p => p.Blog)         // 一对多
             .HasForeignKey(p => p.BlogId)
             .OnDelete(DeleteBehavior.Cascade);                  // 删 Blog 级联删 Post
        });

        modelBuilder.Entity<Post>(p =>
        {
            p.Property(x => x.Title).HasMaxLength(200).IsRequired();
        });
    }
}
```

### 3.4 两种配置方式

| | Data Annotations(特性) | Fluent API(OnModelCreating) |
|---|---|---|
| 写法 | `[Key]`、`[Required]`、`[MaxLength(200)]`、`[Table("Blogs")]`、`[Timestamp]` 等 | `HasKey / Property / HasIndex / HasOne / HasMany / HasForeignKey / OnDelete` 等 |
| 能力 | 覆盖常用配置 | **全量能力** |
| 侵入性 | 实体类被 EF 特性污染 | 实体保持纯净 POCO |
| 复合主键 | 不支持 | 支持(`HasKey(x => new { x.A, x.B })`) |
| 建议 | 简单标注 | **团队项目首选**,复杂关系必用 |

### 3.5 迁移三连

```bash
dotnet ef migrations add Init      # ① 根据模型差异生成迁移文件(快照比对)
dotnet ef database update          # ② 把迁移应用到数据库
dotnet ef migrations script        # ③ 生成完整 SQL 脚本(生产环境 DBA 审核用)
```

---

## 四、增(Create)

### 4.1 基本用法

```csharp
using var db = new AppDbContext();

var blog = new Blog { Title = "EF Core 入门" };
db.Blogs.Add(blog);              // ① 只是把实体(及其新导航)标记为 Added,不发 SQL
await db.SaveChangesAsync();     // ② 此刻才真正执行 INSERT
Console.WriteLine(blog.Id);      // ③ 自增主键已回填到实体上
```

机制细节:

- `Add()` **不访问数据库**,只是把实体标为 `Added` 并记账;
- **`SaveChangesAsync()` 才执行 INSERT**,并把数据库生成的 Id 回填到实体上——所以必须在**同一个上下文**里、Save 之后才能拿到 Id;
- `Add` 会沿导航属性**整图处理**:`blog.Posts` 里挂着的 Post 也会一起标记 `Added`。

批量:

```csharp
db.Blogs.AddRange(b1, b2, b3);   // 或传入集合
await db.SaveChangesAsync();     // EF 自动分批(见 2.4 第 5 步),无需手动 SaveChanges
```

### 4.2 关联插入:一次保存整棵对象图

```csharp
var blog = new Blog
{
    Title = "新博客",
    Posts =
    {
        new Post { Title = "文章1" },
        new Post { Title = "文章2" }
    }
};
db.Add(blog);                    // 任意实体类型都可 db.Add(实体)
await db.SaveChangesAsync();
```

EF 自动完成的正确顺序(全部在一个事务内):

1. INSERT `Blogs` → 拿回自增 `Id`(比如 7);
2. 把 7 写入两个 Post 的 `BlogId`(外键传播);
3. INSERT 两条 `Posts`。

实践要点:

- **不要**手动给子表 `BlogId` 赋值再插——让 EF 传播,少一次出错机会;
- **不要**父子各调一次 `SaveChangesAsync()`——把一个事务拆成两个,中途失败会留脏数据。

### 4.3 主键生成策略

| 策略 | 配置 | 特点与注意 |
|---|---|---|
| 自增 Identity(默认) | int 主键默认 | 插入后回填;Save 之前拿不到 Id |
| Guid(默认) | `public Guid Id` | SQL Server 提供程序**客户端生成顺序 Guid**(对聚集索引友好),`Add` 后立即有值 |
| HiLo | `UseHiLo()` | 客户端批量取号段,批量插入友好;只有这种策略 `AddAsync` 才有意义 |
| 无生成(自然键) | `ValueGeneratedNever()` | 必须自己赋值,如字典表 Code、外部系统编号 |
| 字符串主键 | 默认即无生成 | **必须先赋值**(如 `Guid.NewGuid().ToString()`),否则 Save 时报主键为空 |

### 4.4 AddAsync 的真相

`AddAsync` 只在使用 **HiLo 等需要访问数据库的值生成器**时才有区别(要异步取号段);普通自增 / Guid 场景下它与 `Add` 完全等价,官方也推荐直接用同步的 `Add`。

### 4.5 增的注意事项清单

- 忘记 `SaveChangesAsync()`(数据"凭空消失"第一名)、忘记 `await`;
- 自增主键不要手动赋值再 `Add`(赋的值会被带进 INSERT 导致冲突;要插显式自增值需专门配置);
- 字符串主键 / 自然键必须先赋值;
- 一次业务操作全部 Add 完,**只调一次 SaveChanges**(自动成一个事务);
- 大批量导入(数十万行)用 SqlBulkCopy 或分批 SaveChanges,别一次性 Add 百万条(见第十章)。

---

## 五、查(Read)

查询是日常占比最大、坑也最多的部分,本章最长。

### 5.1 基础语法

```csharp
// 条件查询
var blogs = await db.Blogs.Where(b => b.CreatedAt >= start).ToListAsync();

// 排序 + 分页(第 2 页,每页 20)
var page = await db.Blogs
    .OrderByDescending(b => b.CreatedAt)   // Skip/Take 前必须 OrderBy!
    .Skip(20).Take(20)
    .ToListAsync();

// 投影:只取需要的列(列表页首选)
var list = await db.Blogs
    .Where(b => !b.IsDeleted)
    .Select(b => new BlogDto
    {
        Id = b.Id,
        Title = b.Title,
        PostCount = b.Posts.Count          // 子集合计数可直接翻译成子查询
    })
    .ToListAsync();

// 聚合 / 存在性判断
int total   = await db.Blogs.CountAsync();
bool exists = await db.Blogs.AnyAsync(b => b.Title == "x");   // 比 Count() > 0 高效
var latest  = await db.Blogs.MaxAsync(b => b.CreatedAt);

// 分组统计
var stat = await db.Posts
    .GroupBy(p => p.BlogId)
    .Select(g => new { BlogId = g.Key, Cnt = g.Count() })
    .ToListAsync();

// 模糊匹配(两者都翻译成 LIKE)
var like = await db.Blogs.Where(b => EF.Functions.Like(b.Title, "%EF%")).ToListAsync();
var cts  = await db.Blogs.Where(b => b.Title.Contains("EF")).ToListAsync();
```

### 5.2 延迟执行:最重要的一个概念

```csharp
var query = db.Blogs.Where(b => b.Id > 5);                  // ① 还没连数据库!
if (onlyHot)
    query = query.Where(b => b.Posts.Count > 10);           // ② 继续拼接,还是没连
if (!string.IsNullOrEmpty(keyword))
    query = query.Where(b => b.Title.Contains(keyword));    // ③ 动态条件,依然没连
var list = await query.ToListAsync();                       // ④ 这一刻才执行,且只有一条 SQL
```

- `IQueryable<T>` 是"查询描述",可以自由拼接、复用——通用分页/筛选基类全靠这个特性;
- 触发执行的时机:`ToList / First / Count / Any / Max / foreach`(及对应的 Async 版本);
- **闭包变量在执行时才取值**:

```csharp
var filter = "A";
var q = db.Blogs.Where(b => b.Title.StartsWith(filter));
filter = "B";
await q.ToListAsync();     // 实际按 "B" 查询!(执行时才读变量)
```

- **变量类型是分水岭**(经典错误):

```csharp
// 坏:声明成 IEnumerable,后续 Where 编译期绑定到 LINQ-to-Objects
// 效果 = 先把整张表拉回内存,再内存过滤
IEnumerable<Blog> q1 = db.Blogs;
var r1 = q1.Where(b => b.Id > 5).ToList();

// 好:保持 IQueryable,Where 被翻译进 SQL
IQueryable<Blog> q2 = db.Blogs;
var r2 = await q2.Where(b => b.Id > 5).ToListAsync();
```

### 5.3 关联数据加载(最容易踩坑的一节)

**导航属性默认永远是空的**(除非开启延迟加载),需要你主动"装"数据。四种方式:

#### ① 预加载 Include / ThenInclude(最常用)

```csharp
var blogs = await db.Blogs
    .Include(b => b.Posts)
        .ThenInclude(p => p.Comments)          // 孙级:Post 下的 Comments
    .Where(b => b.Id == 1)
    .ToListAsync();
```

- 多个 `Include` 默认生成**一条大 SQL(JOIN 连乘)**:包含关系一多,行数按笛卡尔积放大、列数爆炸 → 加 `AsSplitQuery()` 拆成多条小 SQL:

```csharp
var blogs = await db.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Owner)
    .AsSplitQuery()                             // EF Core 5+
    .ToListAsync();
```

- EF Core 5+ 支持**过滤 Include**:

```csharp
.Include(b => b.Posts.Where(p => p.IsPublished))
```

#### ② 投影 Select(性能最好,推荐)

```csharp
var blogs = await db.Blogs
    .Select(b => new
    {
        b.Id,
        b.Title,
        Posts = b.Posts.Select(p => new { p.Id, p.Title }).ToList()
    })
    .ToListAsync();
```

不需要 Include,EF 自动按投影生成 JOIN;且**投影结果永不跟踪**,天然轻量。列表页、API 返回 DTO 的场景一律优先用这个。

#### ③ 显式加载(按需补货)

```csharp
var blog = await db.Blogs.FirstAsync(b => b.Id == 1);
await db.Entry(blog).Collection(b => b.Posts).LoadAsync();    // 集合导航
await db.Entry(blog).Reference(b => b.Owner).LoadAsync();     // 引用导航
```

#### ④ 延迟加载(默认关闭,谨慎开启)

- 开启方式一:代理模式——安装 `Microsoft.EntityFrameworkCore.Proxies` 包,导航属性加 `virtual`;
- 开启方式二:实体注入 `ILazyLoader`;
- 代价:首次访问导航属性时自动发一条 SQL——**写在循环里就是 N+1**;JSON 序列化时访问导航 → 级联触发查询甚至死循环;
- 建议:Web 项目尽量不开,用 ①② 代替。

#### N+1 问题(反面教材)

```csharp
var blogs = await db.Blogs.ToListAsync();    // 1 条 SQL
foreach (var b in blogs)
{
    Console.WriteLine(b.Posts.Count);        // 每个 blog 各发 1 条 SQL → 共 N+1 条!
}
```

修正:预加载、投影、或拆分查询。识别方法:开日志看 SQL 条数(第十章)。

### 5.4 原生 SQL

```csharp
// 插值版:自动参数化,防注入(推荐)
var b1 = await db.Blogs
    .FromSqlInterpolated($"SELECT * FROM Blogs WHERE Title = {title}")
    .ToListAsync();

// 拼接版:字符串拼接,自己防注入(谨慎)
var b2 = await db.Blogs
    .FromSqlRaw("SELECT * FROM Blogs WHERE Title = {0}", title)
    .ToListAsync();

// EF Core 8+:查询任意类型 / 标量(结果列必须别名 Value)
var dt = await db.Database
    .SqlQuery<DateTime>($"SELECT MAX(CreatedAt) AS [Value] FROM Blogs")
    .FirstAsync();

// 非查询语句
int n = await db.Database
    .ExecuteSqlInterpolatedAsync($"DELETE FROM Posts WHERE BlogId = {id}");
```

规则:`FromSql...` 必须返回该实体类型的**所有映射列**;之后可以继续拼 LINQ(`Where` 会变成子查询包在外面);存储过程等不可组合的场景用 `AsEnumerable()/ToListAsync()` 兜底结束。

### 5.5 单行查询方法怎么选

| 方法 | 0 行时 | 多行时 | 生成的 SQL | 典型用途 |
|---|---|---|---|---|
| `FirstAsync` | 抛异常 | 取第一行 | `TOP(1)` | 确定存在,想让它报错 |
| `FirstOrDefaultAsync` | 返回 null | 取第一行 | `TOP(1)` | **最常用** |
| `SingleAsync` | 抛异常 | **抛异常** | `TOP(2)` | 业务上必须唯一 |
| `SingleOrDefaultAsync` | 返回 null | **抛异常** | `TOP(2)` | 唯一键查询 |
| `FindAsync` | 返回 null | — | 按需 | **先查本地 ChangeTracker,再查库**(主键查找) |

`FindAsync` 彩蛋:先查内存账本再查数据库,适合"可能刚加载过"的场景,省一次往返。

### 5.6 异步与并发纪律

- 查询一律用异步版本:`ToListAsync / FirstAsync / AnyAsync / SaveChangesAsync` …;
- **禁止** `.Result` / `.Wait()`(死锁风险),异步要贯穿整条调用链到顶;
- **同一个 DbContext 实例禁止并发操作**:两条查询同时 `await` 会抛
  `A second operation was started on this context instance before a previous operation completed`。需要并行就每个任务开自己的上下文。

### 5.7 查询注意事项清单

1. `Skip/Take` 不带 `OrderBy` → SQL Server 直接报错(要求 ORDER BY);即使不报错,顺序也不稳定,分页会丢数据/重复;
2. `Where` 里调用自定义方法、不支持的函数 → `could not be translated`;先在客户端算成变量,再进表达式;
3. 字符串大小写取决于数据库排序规则(SQL Server 默认不区分大小写,PostgreSQL 区分,MySQL 看列排序规则);需要精确控制用 `EF.Functions.Collate`;
4. 时间统一存 UTC(`DateTime.UtcNow`),展示层再转时区;需要带时区语义用 `DateTimeOffset`;
5. 深分页 `Skip(100000)` 性能差(数据库要扫过前 10 万行)→ 用键集分页:`Where(b => b.Id > lastId).OrderBy(b => b.Id).Take(20)`;
6. 全局查询过滤器(`HasQueryFilter`,软删除常用)会**静默**参与所有查询,排查"为什么查不到这条数据"时先想到它,临时放开用 `IgnoreQueryFilters()`;
7. 想提前看 SQL 不执行:`query.ToQueryString()`;
8. 枚举等值比较可直接翻译;但给属性配了自定义 `ValueConverter` 后,部分复杂运算可能翻译失败。

---

## 六、改(Update)

四种方式,按推荐程度排列。核心差异:**哪些列会被 UPDATE**。

### 6.1 方式一:查询 → 改属性 → SaveChanges(首选)

```csharp
var blog = await db.Blogs.FirstAsync(b => b.Id == 1);  // 已被跟踪,状态 Unchanged
blog.Title = "新标题";                                  // 只改内存,EF 暂时不知道
await db.SaveChangesAsync();                            // UPDATE 只含 Title 列
```

底层流程(对照 2.2 / 2.4):SaveChanges 触发 DetectChanges → 比对快照发现只有 Title 变了 → 标记 Modified → 生成 `UPDATE Blogs SET Title=@p WHERE Id=1`。

- 优点:只更新变化的列;可配合并发令牌;逻辑清晰、能校验存在性;
- 缺点:多一次 SELECT 往返。

### 6.2 方式二:Attach + 局部属性(已知 Id、不想先查)

```csharp
var stub = new Blog { Id = 1 };
db.Attach(stub);               // 键有值 → 标记 Unchanged(建立原始值快照)
stub.Title = "新标题";         // 之后改动会被 DetectChanges 发现
await db.SaveChangesAsync();   // 只 UPDATE Title
```

或者精确指定"只更新某列":

```csharp
var entry = db.Entry(new Blog { Id = 1 });
entry.State = EntityState.Unchanged;                 // 挂上账本
entry.Property(x => x.Title).IsModified = true;      // 指定列 Modified
entry.Entity.Title = "新标题";
await db.SaveChangesAsync();                         // 只 UPDATE Title
```

适合字段少、验证简单的内部操作;注意要自己保证这个 Id 确实存在(不存在则影响 0 行抛并发异常)。

### 6.3 方式三:Update() 全字段更新(慎用!)

```csharp
var dto = new Blog { Id = 1, Title = "只有标题有值" };   // 其他属性是默认值
db.Update(dto);                 // 整个实体被标记 Modified
await db.SaveChangesAsync();    // UPDATE 所有列!Summary=null、CreatedAt=0001-01-01 覆盖数据库!
```

**危险点**:断开场景下用 `Update()` 图省事,没赋值的列会全部被 null / 0 / 0001-01-01 覆盖,数据无声丢失。`Update()` 的正确定位:你手上**确实有完整实体**(例如查出来发给客户端、客户端原样传回)时才用它。另外 `Update` 也会沿导航整图标记 `Modified`,关联实体全被全字段更新。

### 6.4 Web API 断开场景怎么改(实战对比)

Web 请求之间上下文早已销毁,实体都是"断开"状态。四种方案:

| 方案 | 数据库往返 | 安全性 | 说明 |
|---|---|---|---|
| A. 查实体 → 拷贝字段 → Save | 2 次 | 高 | **默认推荐**:能校验存在性,只更新白名单字段 |
| B. Attach + 标记属性 | 1 次写 | 中 | 快,但要自己保证键有效、字段正确 |
| C. `Update(整实体)` | 1 次写 | **低** | 全列覆盖,null 灭数据 |
| D. 方案 A + RowVersion 并发检查 | 2 次 | 最高 | 多人同时编辑场景必备(见 6.6) |

方案 A 示例(DTO → 实体):

```csharp
var blog = await db.Blogs.FindAsync(id)
    ?? throw new InvalidOperationException("博客不存在");

blog.Title   = dto.Title;      // 只拷贝允许修改的字段(白名单思维)
blog.Summary = dto.Summary;
await db.SaveChangesAsync();
```

### 6.5 批量更新 ExecuteUpdate(EF Core 7+)

```csharp
// 生成一条 SQL:UPDATE Posts SET IsTop=1, UpdatedTime=@p WHERE BlogId=5
await db.Posts
    .Where(p => p.BlogId == 5)
    .ExecuteUpdateAsync(s => s
        .SetProperty(p => p.IsTop, true)
        .SetProperty(p => p.UpdatedTime, DateTime.UtcNow));
```

- **立即执行**,不经过 ChangeTracker,不加载任何实体到内存;
- **不走** SaveChanges / 拦截器 / 审计重写逻辑(8.3 的审计代码对它无效),批处理要自己补审计字段;
- 适合后台批处理、状态批量翻转等场景。

### 6.6 并发控制(乐观并发)

两个用户同时编辑同一条记录,后保存的会覆盖先保存的(丢失更新)。解决方案是**乐观并发**:

```csharp
public class Blog
{
    public int Id { get; set; }

    [Timestamp]                              // → SQL Server rowversion 列
    public byte[] RowVersion { get; set; } = null!;
}
```

- 带并发令牌的 UPDATE 自动变成:`UPDATE Blogs SET ... WHERE Id=1 AND RowVersion=@原值`;
- 期间被别人改过 → 匹配不到行 → 影响 0 行 → **抛 `DbUpdateConcurrencyException`**;
- 处理策略:捕获异常后重试(重新读、重新改),或提示用户"数据已被他人修改,请刷新";
- 也可以用 `[ConcurrencyCheck]` 把任意列(如 `UpdatedAt`)设为并发令牌;
- 单用户桌面程序可以不做;Web 多人编辑、后台任务与用户操作并存的场景建议加。

---

## 七、删(Delete)

### 7.1 三种常见写法

```csharp
// ① 先查后删(最常见,最稳)
var post = await db.Posts.FindAsync(3);
if (post is not null)
{
    db.Posts.Remove(post);
    await db.SaveChangesAsync();
}

// ② 只有 Id:用占位实体(EF 自动 Attach 成 Unchanged 再标 Deleted)
db.Posts.Remove(new Post { Id = 3 });
await db.SaveChangesAsync();

// ③ 批量
db.Posts.RemoveRange(posts);     // posts 是已查出的实体列表
await db.SaveChangesAsync();
```

`Remove` 的机制(对照 2.2 状态转换表):

- 已跟踪实体(Unchanged / Modified)→ 标记 `Deleted`;
- `Added` 状态(还没插库)→ 直接变 **Detached**,等于撤销新增;
- `Detached` 实体(如 ② 的占位实体)→ 先 Attach 成 Unchanged,再标 `Deleted`;
- SaveChanges 执行 `DELETE FROM Posts WHERE Id=3`,完成后实体变回 `Detached` 并移出账本。

### 7.2 级联删除

删除主表时,子表数据怎么办由 `OnDelete` 配置决定:

| DeleteBehavior | 行为 |
|---|---|
| `Cascade` | 删主表,数据库自动级联删子表(SQL 层,高效) |
| `ClientCascade`(EF Core 7+) | 数据库不开级联,由 EF 对**已跟踪**的子实体逐条删 |
| `Restrict` | 存在子数据则删除报错(外键约束) |
| `SetNull` | 子表外键置 NULL(要求外键可空) |
| `ClientSetNull` | 可选关系的默认值:EF 把已跟踪子实体的外键在内存置 NULL |

默认行为:**必选关系 → `Cascade`;可选关系 → `ClientSetNull`**。

实践要点:

- 想要"删 Blog 连带删 Posts"且高效:显式 `.OnDelete(DeleteBehavior.Cascade)` 并**记得生成迁移**(这是数据库层面的约束,不是 C# 逻辑);
- 子实体已被跟踪时,EF 也会在内存里做级联修正(即使数据库没有级联);
- 生产数据库慎用多级 Cascade(误删主表 = 雪崩);常见取舍:强从属关系(订单→订单明细)用 Cascade,弱关联用 Restrict + 业务校验。

### 7.3 批量删除 ExecuteDelete(EF Core 7+)

```csharp
// 生成一条 SQL:DELETE FROM Posts WHERE BlogId=5,不加载任何实体
await db.Posts.Where(p => p.BlogId == 5).ExecuteDeleteAsync();
```

十万级清理、定时任务首选。同样**绕过** ChangeTracker 和 SaveChanges 审计逻辑。

### 7.4 软删除(业务上更常用)

物理删除不可恢复,业务系统更常用"标记删除":

```csharp
// OnModelCreating 中配置全局查询过滤器
modelBuilder.Entity<Blog>().HasQueryFilter(b => !b.IsDeleted);

// "删除" = 改标记
blog.IsDeleted = true;
await db.SaveChangesAsync();     // 实际是一条 UPDATE

// 之后所有对该实体的查询自动追加 WHERE NOT IsDeleted
var visible = await db.Blogs.ToListAsync();

// 确实要查已删数据时:
var all = await db.Blogs.IgnoreQueryFilters().ToListAsync();
```

注意:全局过滤器会参与**所有**查询,包括 `Include` 加载的关联实体(即已删 Blog 的 Posts 也可能被过滤),排查"为什么查不到"时先想到它。

### 7.5 删的注意事项

- `Remove + SaveChanges` 删不存在的行:预期影响 1 行、实际 0 行 → 抛 `DbUpdateConcurrencyException`;而 `ExecuteDeleteAsync` 删 0 行是静默成功的——两者语义不同,按需选择;
- 配了并发令牌的删除同样会检查令牌;
- 级联方向提前想清楚,并且**一定要生成迁移验证真实 DDL**;
- 大批量删除优先 `ExecuteDeleteAsync`(或 `ExecuteSqlInterpolatedAsync`),避免把几十万实体加载进内存再逐条删。

---

## 八、SaveChanges 深入:事务与审计

### 8.1 自动事务(默认就有)

一次 `SaveChanges` 内的所有命令自动包在一个事务里(2.4 已讲)。**多实体的增删改放进同一次 SaveChanges,就是最简单、最常用的事务**。

### 8.2 显式事务(跨多次 SaveChanges / 混合原生 SQL)

```csharp
await using var tx = await db.Database.BeginTransactionAsync();
try
{
    db.Add(entityA);
    await db.SaveChangesAsync();                          // 事务点 1

    await db.Database.ExecuteSqlInterpolatedAsync(
        $"UPDATE Blogs SET Views = Views + 1 WHERE Id = {id}");   // 原生 SQL 也进同一事务

    db.AddRange(entityB, entityC);
    await db.SaveChangesAsync();                          // 事务点 2

    await tx.CommitAsync();                               // 全部成功才提交
}
catch
{
    throw;    // 不 Commit,await using 释放时自动回滚
}
```

**重试策略与手动事务的配合**(易踩坑):配置了 `EnableRetryOnFailure`(连接瞬断自动重试)后,直接包手动事务会报错(重试无法重放事务)。必须把事务包进执行策略:

```csharp
o.UseSqlServer(conn, opt => opt.EnableRetryOnFailure());   // 重试策略

var strategy = db.Database.CreateExecutionStrategy();
await strategy.ExecuteAsync(async () =>
{
    await using var tx = await db.Database.BeginTransactionAsync();
    // ... 所有操作 + SaveChanges
    await tx.CommitAsync();
});
```

`TransactionScope` 写法(异步必须显式开启流):

```csharp
using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
// ... 多个上下文/多次操作
scope.Complete();
```

### 8.3 重写 SaveChanges 自动填充审计字段

```csharp
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

public class AppDbContext : DbContext
{
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }

        return base.SaveChangesAsync(ct);
    }
}
```

⚠️ 提醒:`ExecuteUpdateAsync` / `ExecuteDeleteAsync` **不经过** SaveChanges,这段审计逻辑对它们不生效——批处理代码要自己补审计字段。

---

## 九、高频坑位 Top 15

每条按"现象 → 根因 → 修正"给出。

**1. 同一个 DbContext 被并发使用**
现象:`A second operation was started on this context instance before a previous operation completed`。
根因:上下文不是线程安全;常见于漏了 `await`(方法没等完就继续)、`Task.WhenAll` 里共用一个上下文、单例服务里注入了 Scoped 上下文。
修正:每个并发任务独立上下文(或 `IDbContextFactory`);后台任务用 `IServiceScopeFactory` 造作用域取上下文。

**2. 忘记 `SaveChanges` 或 `await`**
现象:程序不报错,但数据"消失"。
根因:Add/Remove/改属性都只是内存操作;不 Save 等于白做;返回 `Task` 不 await = 没执行。
修正:养成"操作完必 Save、异步必 await"的肌肉记忆;`await using var db = ...`。

**3. 纯读查询忘加 `AsNoTracking`(或加了还想改)**
现象:列表查询又慢又吃内存;或者反过来,加了 NoTracking 后改属性 Save 不生效。
根因:跟踪查询要建快照、查账本;NoTracking 的实体不在账本上。
修正:只读一律 NoTracking;要改的查询保持默认跟踪;全局只读场景设 `QueryTrackingBehavior.NoTracking`。

**4. N+1 查询**
现象:列表页一条 SQL 变成 N+1 条,接口慢。
根因:循环里访问未加载的导航属性(或开了延迟加载)。
修正:预加载 Include / 投影 Select / AsSplitQuery;开日志数 SQL 条数。

**5. 分页没排序**
现象:SQL Server 报"`ORDER BY` 子句..."错误;或不报错但翻页出现重复/丢行。
根因:`Skip/Take` 需要 `ORDER BY` 才有确定顺序。
修正:`Skip/Take` 前必须 `OrderBy`(建议排序列加索引)。

**6. LINQ 翻译失败**
现象:`The LINQ expression ... could not be translated`。
根因:表达式树里出现了数据库不认识的东西——自定义方法、`string.Format`、部分 `ToString()`、无法翻译的集合运算等。
修正:把无法翻译的部分移到查询外先算成变量;或改写成可翻译形式(`Contains`、`EF.Functions.Like` 等);万不得已 `AsEnumerable()` 后内存处理(注意数据量)。

**7. 变量声明成 `IEnumerable` 导致内存过滤**
现象:明明写了 `Where` 却全表加载。
根因:`IEnumerable<Blog> q = db.Blogs;` 之后,`q.Where` 编译期绑定到 LINQ-to-Objects。
修正:保持 `IQueryable<T>` 类型直到 `ToListAsync`。

**8. `Update()` 全字段覆盖**
现象:只改了一个字段,但其他字段变成 null / 0 / 0001-01-01。
根因:`Update` 把整个实体标 Modified,所有列都进 UPDATE。
修正:断开场景用"查实体 → 拷贝白名单字段 → Save"(6.4 方案 A);确有完整实体才用 `Update`。

**9. 同键跟踪冲突**
现象:`The instance of entity type 'Blog' cannot be tracked because another instance with the same key value ... is already being tracked`。
根因:同一上下文里,同一主键出现了两个实例(比如先 `FindAsync` 又 `Add` 同 Id 的对象,或 Attach 与查询结果并存)。
修正:先查再改,别 new 同键实体;确实要重挂就先 `ChangeTracker.Clear()`;长流程及时 Clear 账本。

**10. 长生命周期上下文 + ChangeTracker 膨胀**
现象:WPF/Blazor 常驻页面越用越卡、内存涨。
根因:上下文活很久,每次查询都往账本里塞实体,永不释放。
修正:操作粒度使用短上下文(`using`);常驻场景在批次间 `ChangeTracker.Clear()`;Blazor 用 `AddDbContextFactory`。

**11. 延迟加载引发的 N+1 与序列化死循环**
现象:JSON 序列化时接口超时/栈溢出;或循环里每轮一条 SQL。
根因:代理延迟加载在属性首次访问时发 SQL,序列化器会"顺藤摸瓜"访问所有导航。
修正:Web 项目关闭延迟加载;返回 DTO 投影;实体不直接序列化给前端。

**12. 深分页性能**
现象:`Skip(100000).Take(20)` 越翻越慢。
根因:数据库要扫过并丢弃前 10 万行。
修正:键集分页 `Where(b => b.Id > lastId).OrderBy(b => b.Id).Take(20)`;或限制最大页深。

**13. 事务被拆散**
现象:两次 `SaveChanges`,第二次失败后第一次已落库,数据不一致。
根因:每次 SaveChanges 是独立事务。
修正:合并成一次 SaveChanges;或显式事务(8.2);配了重试策略记得用执行策略包住事务。

**14. `ExecuteUpdate/ExecuteDelete` 绕过审计**
现象:批量操作后 `UpdatedAt` 没变、拦截器没触发。
根因:这两个 API 直接发 SQL,不经过 SaveChanges 管线。
修正:批处理代码里自己补审计字段;或改回"查出 → 改 → Save"。

**15. 并发修改丢更新**
现象:两个用户先后保存,后者静默覆盖前者的修改。
根因:没有并发控制,后写者胜。
修正:加 `RowVersion` / `[ConcurrencyCheck]`,捕获 `DbUpdateConcurrencyException` 处理(6.6)。

---

## 十、性能优化清单(按性价比排序)

1. **只读查询一律 `AsNoTracking()`**(或全局 NoTracking)——改动最小、收益立竿见影;
2. **投影 `Select`**,别动不动查整行、整对象图;
3. 列表页不要 `Include` 整个对象图,只取要展示的列;
4. 多 `Include` 大 JOIN → `AsSplitQuery()`;
5. 批量改 / 删用 `ExecuteUpdateAsync` / `ExecuteDeleteAsync`;
6. 存在性判断用 `AnyAsync`,别 `CountAsync() > 0`;
7. 分页必排序;深分页用键集分页;
8. 高频热点查询用**编译查询**(启动时编译一次,之后免翻译):
   ```csharp
   private static readonly Func<AppDbContext, int, Task<Blog?>> GetBlogById =
       EF.CompileAsyncQuery((AppDbContext db, int id) =>
           db.Blogs.FirstOrDefault(b => b.Id == id));
   // 用法:await GetBlogById(db, 1);
   ```
9. 高并发 Web 用 `AddDbContextPool`(注意上下文里不能存每请求状态);
10. 大批量导入:SQL Server 用 `SqlBulkCopy` 最快;其次分批 Add + Save(每批几千条);
11. 给 `Where / OrderBy / 外键` 列建索引(模型里 `HasIndex` + 迁移落库);
12. 开发期看 SQL 三件套:`ToQueryString()`、`.LogTo(Console.WriteLine, LogLevel.Information)`、`EnableDetailedErrors()`;`EnableSensitiveDataLogging()` 只在开发环境开;
13. 跟踪数万实体时,`ChangeTracker.AutoDetectChangesEnabled = false` + 批次间手动 `DetectChanges() / Clear()`。

---

## 十一、完整可运行示例

一个控制台程序,把增删改查一条龙跑通(建库 → 增 → 查 → 改 → 删)。控制台程序用 `OnConfiguring` 配置最简单:

```csharp
using Microsoft.EntityFrameworkCore;

// ===================== 实体 =====================
public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;

    public int BlogId { get; set; }
    public Blog Blog { get; set; } = null!;
}

// ===================== 上下文 =====================
public class AppDbContext : DbContext
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options
            .UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=EfCrudDemo;Trusted_Connection=True;")
            // 换成本地轻量测试:安装 Microsoft.EntityFrameworkCore.Sqlite 后
            // .UseSqlite("Data Source=efcrud.db")
            .LogTo(Console.WriteLine, LogLevel.Information);   // 打印 SQL,学习神器

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Blog>(b =>
        {
            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.HasQueryFilter(x => !x.IsDeleted);               // 软删除全局过滤
        });
        mb.Entity<Post>(p => p.Property(x => x.Title).HasMaxLength(200).IsRequired());
        mb.Entity<Blog>().HasMany(x => x.Posts).WithOne(p => p.Blog)
            .HasForeignKey(p => p.BlogId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

// ===================== 主程序 =====================
public static class Program
{
    public static async Task Main()
    {
        await using var db = new AppDbContext();
        await db.Database.EnsureCreated();        // 演示用;正式项目用 db.Database.Migrate()

        // ---- 增:一次保存整棵对象图 ----
        var blog = new Blog
        {
            Title = "EF Core 指南",
            CreatedAt = DateTime.UtcNow,
            Posts = { new Post { Title = "第一章:机制" }, new Post { Title = "第二章:实战" } }
        };
        db.Add(blog);
        await db.SaveChangesAsync();
        Console.WriteLine($"新增完成:Blog Id={blog.Id}(自增键已回填)");

        // ---- 查:非跟踪投影 + 分页 ----
        var list = await db.Blogs.AsNoTracking()
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new { b.Id, b.Title, PostCount = b.Posts.Count })
            .ToListAsync();
        Console.WriteLine($"查询到 {list.Count} 篇,第一篇有 {list[0].PostCount} 个章节");

        // ---- 改:跟踪修改,只更新变化列 ----
        var tracked = await db.Blogs.FirstAsync(b => b.Id == blog.Id);
        tracked.Title = "EF Core 指南(修订版)";
        await db.SaveChangesAsync();

        // ---- 删:主表一条 DELETE,子表数据库级联 ----
        db.Blogs.Remove(tracked);
        await db.SaveChangesAsync();
        Console.WriteLine("删除完成,级联清空了章节");
    }
}
```

跑起来后对照 `LogTo` 打印的 SQL,把第二章的机制逐条对号入座,效果最好。

---

## 十二、常见异常速查表

| 异常信息(关键词) | 根因 | 处理 |
|---|---|---|
| `A second operation was started on this context instance` | 同一上下文被并发使用 | 每并发任务独立上下文;检查漏掉的 `await`;后台任务用作用域工厂 |
| `The instance of entity type 'X' cannot be tracked because another instance with the same key value is already being tracked` | 同键两个实例同时挂账本 | 先查再改;必要时 `ChangeTracker.Clear()` |
| `Unable to translate ...` / `could not be translated` | 表达式里有翻译不了的成员 | 移出表达式先算成变量;改写为可翻译形式 |
| `Database operation expected to affect 1 row(s) but actually affected 0` | 并发令牌不匹配 / 行已不存在 | 捕获 `DbUpdateConcurrencyException`;检查软删除过滤器 |
| `Sequence contains no elements` | `First/Single/Max` 没查到数据 | 用 `FirstOrDefault/SingleOrDefault/FirstOrDefaultAsync` |
| `SqlException: The DELETE statement conflicted with the REFERENCE constraint` | 有子数据但没配级联 | 配 `Cascade`(加迁移)或先删子表 |
| `Cannot insert explicit value for identity column` | 手动给自增键赋值又插入 | 自增键别赋值;确需插显式值要专门配置 |
| `The entity type 'X' requires a primary key to be defined` | 模型识别不出主键 | `HasKey` 或按约定命名 Id |
| `The LINQ expression could not be translated... (client evaluation)` | EF Core 3.0 起禁止隐式客户端求值 | 同"翻译失败";显式 `AsEnumerable()` 划定内存边界 |
| `Unable to cast object of type ...` in query | 投影类型与接收类型不匹配 | 检查 Select 出的类型与 ToList 的泛型参数 |
| `SaveChanges` 后导航属性还是 null | 导航不会自动加载 | Include / 投影 / 显式加载(5.3) |
| 数据改了但没生效 | 实体是 NoTracking / 忘了 SaveChanges | 确认查询跟踪模式;确认调用并 await 了 SaveChanges |

---

## 附录:DbContext 常用 API 速查表

| API | 作用 |
|---|---|
| `db.Add / AddRange(实体)` | 标记新增(整图) |
| `db.Attach / AttachRange(实体)` | 挂上账本不标记修改(键有值→Unchanged) |
| `db.Update / UpdateRange(实体)` | 全字段更新(整图 Modified) |
| `db.Remove / RemoveRange(实体)` | 标记删除 |
| `db.Entry(实体)` | 拿到实体账目:状态、单个属性 `IsModified`、`Reload()` 重读 |
| `db.FindAsync<T>(键)` | 主键查找,先查本地账本再查库 |
| `db.Set<T>()` | 拿到任意实体类型的 DbSet(未声明属性时用) |
| `db.SaveChanges(Async)` | 把账本落库(自动事务) |
| `db.Blogs.FromSqlInterpolated(...)` | 实体上的原生 SQL 起手式 |
| `db.Database.ExecuteSql(Interpolated)Async` | 执行非查询 SQL |
| `query.ExecuteUpdate/ExecuteDeleteAsync` | 批量改/删,直接发 SQL(EF Core 7+) |
| `query.ToQueryString()` | 不执行,打印将生成的 SQL |
| `db.Database.BeginTransactionAsync` | 显式事务 |
| `db.Database.CreateExecutionStrategy` | 重试策略下包手动事务用 |
| `db.Database.Migrate()` | 应用所有待处理迁移(启动时) |
| `db.Database.EnsureCreated()` | 建库建表(仅演示/测试,不兼容迁移) |
| `db.ChangeTracker.Clear()` | 清空账本(长生命周期上下文必备) |
| `db.ChangeTracker.Entries()` | 列出当前所有被跟踪实体及状态(调试利器) |
| `db.Entry(实体).Reload()` | 从数据库重读覆盖本地值(并发冲突后常用) |

---

### 一句话总结

- **查**是"翻译":表达式树 → SQL → 物化;能翻译就进数据库,不能翻译就报错;只读就 NoTracking。
- **增删改**是"记账":Add/Remove/改属性都只是改账本,**SaveChanges 才落库**;一次 Save = 一个事务,顺序、级联、主键回填全自动。
- 想清楚"实体现在处于哪个状态、哪些列会被 UPDATE",EF Core 的绝大多数"灵异现象"都能自己破案。
