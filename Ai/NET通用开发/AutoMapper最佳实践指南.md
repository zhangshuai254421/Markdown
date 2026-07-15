# AutoMapper 最佳实践指南

> AutoMapper 是 .NET 中最流行的对象映射库，通过配置规则自动将一个对象的属性值复制到另一个对象。

---

## 一、快速入门

### 安装

```bash
dotnet add package AutoMapper
```

### 基本使用

```csharp
// 1. 定义 Profile
public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<User, UserDto>();
    }
}

// 2. 注册（DI）
builder.Services.AddAutoMapper(typeof(UserProfile).Assembly);

// 3. 使用
public class UserService
{
    private readonly IMapper _mapper;
    public UserService(IMapper mapper) => _mapper = mapper;

    public UserDto GetUser(int id)
    {
        var user = _db.Users.Find(id);
        return _mapper.Map<UserDto>(user);
    }
}
```

---

## 二、Profile 组织最佳实践

### ❌ 错误：所有映射堆在一个 Profile

```csharp
public class MegaProfile : Profile
{
    public MegaProfile()
    {
        CreateMap<User, UserDto>();       // 用户相关
        CreateMap<Order, OrderDto>();      // 订单相关
        CreateMap<Product, ProductDto>();  // 产品相关
        CreateMap<Log, LogDto>();          // 日志相关
        // ... 100+ 条映射
    }
}
```

### ✅ 正确：按业务模块拆分

```csharp
// UserProfile.cs
public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<User, UserDto>();
        CreateMap<CreateUserRequest, User>();
    }
}

// OrderProfile.cs
public class OrderProfile : Profile
{
    public OrderProfile()
    {
        CreateMap<Order, OrderDto>();
        CreateMap<OrderItem, OrderItemDto>();
    }
}

// ProductProfile.cs
public class ProductProfile : Profile
{
    public ProductProfile()
    {
        CreateMap<Product, ProductDto>();
    }
}
```

### ✅ 推荐目录结构

```
Project/
├── Mapping/
│   ├── UserProfile.cs
│   ├── OrderProfile.cs
│   ├── ProductProfile.cs
│   └── CommonProfile.cs
```

---

## 三、最常用的映射配置

### 1. 属性名不同 → `ForMember`

```csharp
CreateMap<User, UserDto>()
    .ForMember(dest => dest.FullName,
               opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
    .ForMember(dest => dest.DisplayName,
               opt => opt.MapFrom(src => src.NickName));
```

### 2. 忽略某些属性

```csharp
CreateMap<User, UserDto>()
    .ForMember(dest => dest.Password, opt => opt.Ignore())
    .ForMember(dest => dest.InternalNotes, opt => opt.Ignore());
```

### 3. 嵌套对象展平

```csharp
// Source: User.Address.City
// Dest:   UserDto.City  ← 自动展平，无需配置

// 也可以显式指定路径
CreateMap<User, UserDto>()
    .ForMember(dest => dest.City,
               opt => opt.MapFrom(src => src.Address.City));
```

### 4. 集合映射

```csharp
CreateMap<Order, OrderDto>();
CreateMap<OrderItem, OrderItemDto>();

// AutoMapper 自动处理 List<T> 映射
var orderDto = _mapper.Map<OrderDto>(order); // Items 自动映射
```

### 5. 条件映射

```csharp
CreateMap<User, UserDto>()
    .ForMember(dest => dest.VipLevel,
               opt => opt.Condition(src => src.IsVip))
    .ForMember(dest => dest.VipLevel,
               opt => opt.MapFrom(src => src.Level));
// 只有 IsVip=true 时才映射 VipLevel
```

### 6. 空值替换

```csharp
CreateMap<User, UserDto>()
    .ForMember(dest => dest.Avatar,
               opt => opt.NullSubstitute("/images/default-avatar.png"));
```

---

## 四、高级技巧

### 1. `ProjectTo` — 与 EF Core 配合（最重要）

```csharp
// ❌ 错误：先查全量再映射（所有列都查出来）
var users = await _db.Users.ToListAsync();
var dtos = _mapper.Map<List<UserDto>>(users);

// ✅ 正确：映射到 IQueryable，只查需要的列
var dtos = await _db.Users
    .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
    .ToListAsync();
// SQL: SELECT Id, Name, Email FROM Users  ← 只查 UserDto 需要的列
```

> **这是 AutoMapper 最有价值的功能**：`ProjectTo` 直接翻译成 SQL，避免查无用列。

### 2. 自定义值解析器

```csharp
// 当转换逻辑复杂时，用独立类封装
public class AgeResolver : IValueResolver<User, UserDto, int>
{
    public int Resolve(User source, UserDto destination, int destMember, ResolutionContext context)
    {
        var today = DateTime.Today;
        var age = today.Year - source.BirthDate.Year;
        if (source.BirthDate > today.AddYears(-age)) age--;
        return age;
    }
}

// 使用
CreateMap<User, UserDto>()
    .ForMember(dest => dest.Age, opt => opt.MapFrom<AgeResolver>());
```

### 3. 类型转换器（全局生效）

```csharp
// 注册全局 string → int? 转换（空串→null）
public class StringToNullableIntConverter : ITypeConverter<string, int?>
{
    public int? Convert(string source, int? destination, ResolutionContext context)
        => int.TryParse(source, out var val) ? val : null;
}

// 注册
builder.Services.AddAutoMapper(cfg =>
{
    cfg.CreateMap<string, int?>().ConvertUsing<StringToNullableIntConverter>();
});
```

### 4. BeforeMap / AfterMap 钩子

```csharp
CreateMap<User, UserDto>()
    .BeforeMap((src, dest) => {
        // 映射前处理，如加载关联数据
    })
    .AfterMap((src, dest) => {
        // 映射后处理，如计算衍生字段
        dest.CreatedAtFormatted = dest.CreatedAt.ToString("yyyy-MM-dd");
    });
```

### 5. 反向映射

```csharp
// 自动生成反向映射（属性名相同时好用）
CreateMap<User, UserDto>().ReverseMap();
// 等价于 CreateMap<User, UserDto>() + CreateMap<UserDto, User>()
```

---

## 五、性能最佳实践

### 1. 只调用一次 `MapperConfiguration` 创建（DI 已处理）

```csharp
// DI 注册时 AutoMapper 会扫描所有 Profile 并创建单一 MapperConfiguration
// 不要手动 new MapperConfiguration() — 让 DI 管理即可
```

### 2. `ProjectTo` >> `Map`（数据库查询场景）

| 方式 | SQL 行为 | 性能 |
|---|---|---|
| `Map(List<T>)` | `SELECT *` | ❌ 差 |
| `ProjectTo<TDto>` | `SELECT 所需列` | ✅ 优 |

### 3. 避免在循环中创建 Mapper

```csharp
// ❌ 每次都新建（配置文件被重复编译）
foreach (var user in users)
{
    var config = new MapperConfiguration(cfg => cfg.CreateMap<User, UserDto>());
    var mapper = config.CreateMapper();
    var dto = mapper.Map<UserDto>(user);  // 极慢
}

// ✅ 使用单例 IMapper
foreach (var user in users)
{
    var dto = _mapper.Map<UserDto>(user); // 快
}
```

### 4. 减少 `ForMember` 中的复杂逻辑

```csharp
// ❌ 每次映射都执行数据库查询
CreateMap<Order, OrderDto>()
    .ForMember(dest => dest.UserName,
               opt => opt.MapFrom(src => _db.Users.Find(src.UserId).Name));

// ✅ 先把数据准备好再映射
var order = _db.Orders.Include(o => o.User).First();
var dto = _mapper.Map<OrderDto>(order);  // 直接从导航属性取值
```

### 5. 验证配置（开发阶段）

```csharp
// 在单元测试中验证所有映射配置
[Fact]
public void AutoMapper_Configuration_IsValid()
{
    var config = new MapperConfiguration(cfg =>
        cfg.AddMaps(typeof(UserProfile).Assembly));
    
    config.AssertConfigurationIsValid(); // 配置有问题立刻暴露
}
```

---

## 六、常见陷阱

| 陷阱 | 说明 | 解决方案 |
|---|---|---|
| **同名不同类型** | `src.Status(string)` → `dest.Status(enum)` 会异常 | 显式 `ForMember` + `MapFrom` 转换 |
| **导航属性触发懒加载** | `Map` 时会读取所有导航属性 | 用 `ProjectTo` 或在查询时 `Include` |
| **循环引用** | `A→B→A` 导致无限递归 | `MaxDepth(1)` 或 `PreserveReferences()` |
| **构造函数注入失败** | DTO 只有带参构造函数 | 用 `ForCtorParam` 显式匹配 |
| **忽略的属性被意外覆盖** | `ReverseMap` 会忽略 `ForMember` 的某些设置 | 正反向分开写 |

### 循环引用处理

```csharp
CreateMap<Parent, ParentDto>()
    .ForMember(dest => dest.Children, opt => opt.MaxDepth(2));
```

### 构造函数参数匹配

```csharp
public record UserDto(int Id, string Name); // record 只有带参构造

CreateMap<User, UserDto>()
    .ForCtorParam("Id", opt => opt.MapFrom(src => src.UserId))
    .ForCtorParam("Name", opt => opt.MapFrom(src => src.UserName));
```

---

## 七、要不要用 AutoMapper？

| 场景 | 建议 |
|---|---|
| **简单同构映射**（属性名相同） | ✅ 用，省代码 |
| **配合 EF Core `ProjectTo`** | ✅ 强烈推荐，这是核心价值 |
| **大量 DTO 与实体互转** | ✅ 用，统一管理 |
| **只有 2-3 条映射** | ❌ 手动写更清晰 |
| **大量自定义逻辑** | ⚠️ 评估是否手动映射更可读 |
| **性能极致要求的路径** | ⚠️ `ProjectTo` 没问题，`Map` 略慢 |

> **核心理念**：AutoMapper 擅长"机械性重复工作"，不擅长"有判断逻辑的转换"。属性名相同 → 用 AutoMapper；转换里有 if-else → 手动写。

---

## 八、完整配置模板

```csharp
// Program.cs
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Mapping/UserProfile.cs
public class UserProfile : Profile
{
    public UserProfile()
    {
        // 基本映射
        CreateMap<User, UserDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => $"{s.FirstName} {s.LastName}"))
            .ForMember(d => d.PasswordHash, o => o.Ignore());

        // 创建映射
        CreateMap<CreateUserRequest, User>()
            .ForMember(d => d.CreatedAt, o => o.MapFrom(_ => DateTime.UtcNow));

        // 反向映射（更新）
        CreateMap<UpdateUserRequest, User>()
            .ForAllMembers(o => o.Condition((src, dest, srcVal) => srcVal != null));
            // 只更新非 null 字段 ↓
    }
}

// 使用 — 查询
public async Task<List<UserDto>> GetUsersAsync()
{
    return await _db.Users
        .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
        .ToListAsync();
}

// 使用 — 创建
public async Task<UserDto> CreateAsync(CreateUserRequest request)
{
    var user = _mapper.Map<User>(request);
    _db.Users.Add(user);
    await _db.SaveChangesAsync();
    return _mapper.Map<UserDto>(user);
}

// 使用 — 更新（只更新非 null 字段）
public async Task UpdateAsync(int id, UpdateUserRequest request)
{
    var user = await _db.Users.FindAsync(id);
    _mapper.Map(request, user); // 覆盖到已跟踪实体
    await _db.SaveChangesAsync();
}
```

---

## 总结

| 要点 | 一句话 |
|---|---|
| **Profile 拆分** | 按业务模块，别堆一起 |
| **核心优势** | `ProjectTo` → 只查需要的列 |
| **验证尽早** | 单元测试 `AssertConfigurationIsValid()` |
| **复杂逻辑** | 手动写，别硬塞进 AutoMapper |
| **更新场景** | `mapper.Map(request, entity)` 覆盖跟踪实体 |
| **循环引用** | `MaxDepth()` 限制深度 |
