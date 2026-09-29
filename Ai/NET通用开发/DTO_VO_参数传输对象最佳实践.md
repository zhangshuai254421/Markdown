# DTO / VO / 参数传输对象 最佳实践指南

## 目录

1. [对象分类全景图](#1-对象分类全景图)
2. [DTO — 数据传输对象](#2-dto--数据传输对象)
3. [VO — 值对象](#3-vo--值对象)
4. [其他常见对象类型](#4-其他常见对象类型)
5. [对象分层与流转](#5-对象分层与流转)
6. [命名规范](#6-命名规范)
7. [对象映射](#7-对象映射)
8. [项目结构建议](#8-项目结构建议)
9. [最佳实践总结](#9-最佳实践总结)
10. [常见反模式与陷阱](#10-常见反模式与陷阱)
11. [WPF 桌面开发实战](#11-wpf-桌面开发实战)

---

## 1. 对象分类全景图

在 .NET 企业级应用中，按**职责**可将对象分为以下几类：

| 缩写 | 全称 | 归属层 | 一句话定位 |
|------|------|--------|-----------|
| **DTO** | Data Transfer Object | 传输层 / 接口层 | 跨进程、跨网络搬运数据的"快递箱" |
| **VO** | Value Object | 领域层 | 描述领域概念、靠值本身判等的"身份" |
| **PO** | Persistence Object | 持久层 | 与数据库表一行一一对应的"镜像" |
| **BO** | Business Object | 业务层 | 承载业务逻辑的"核心公民" |
| **DO** | Domain Object | 领域层 | 充血模型中有行为的领域实体 |
| **POCO** | Plain Old CLR Object | 通用 | 不继承框架基类的普通 .NET 对象 |
| **Query** | Query Object | 接口层 | 封装查询/筛选条件的对象 |
| **Command** | Command Object | 应用层 | CQRS 中封装写操作的命令 |
| **ViewModel** | View Model | 表现层 | 为视图量身定制的数据+行为模型 |
| **Request/Response** | — | 接口层 | Web API 的输入/输出模型 |

### 1.1 一个请求的"变装之旅"

```
HTTP Request
    │
    ▼
[RequestDto]          ← 接口层：接收外部参数
    │
    ▼
[Command / Query]     ← 应用层：分离读写意图
    │
    ▼
[Domain Entity / VO]  ← 领域层：执行业务逻辑
    │
    ▼
[PO]                  ← 持久层：写入数据库
    │
    ▼
[Domain Entity / VO]  ← 领域层：组装返回数据
    │
    ▼
[ResponseDto]         ← 接口层：裁剪暴露字段
    │
    ▼
HTTP Response
```

> 同一个业务概念，在不同层穿着不同的"衣服"——不需要追求"一个对象走天下"。

---

## 2. DTO — 数据传输对象

### 2.1 什么是 DTO

DTO 的全称是 **Data Transfer Object**，它的存在只有一个目的：**在不同进程、不同层之间搬运数据**。

**核心特征：**

| 特征 | 说明 |
|------|------|
| **无行为** | 只有属性，没有方法（序列化方法除外） |
| **贫血模型** | 数据容器，不存在"对象"意义上的封装 |
| **可序列化** | 必须能轻松序列化/反序列化（JSON、XML、Protobuf） |
| **扁平优先** | 尽量扁平，减少嵌套层级 |
| **与 UI/数据库解耦** | 不包含视图逻辑，不感知 ORM |

### 2.2 典型用途

| 场景 | 说明 | 示例 |
|------|------|------|
| **API 出入参** | Controller 接收和返回的对象 | `CreateUserRequest`、`UserListResponse` |
| **服务间通信** | 微服务之间的 RPC / 消息队列载荷 | `OrderCreatedEvent` |
| **跨层传输** | 应用层 → 领域层，或领域层 → 持久层 | `UserDto` |
| **报表/导出** | 原始数据裁剪后传给报表引擎 | `SalesReportDto` |

### 2.3 DTO 的正确写法

```csharp
// ✅ 好的 DTO — 纯数据，职责单一
public class CreateUserRequest
{
    [Required]
    [StringLength(50)]
    public string UserName { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Range(1, 150)]
    public int Age { get; set; }
}

// ✅ 扁平化 DTO — 避免深层嵌套
public class OrderListResponse
{
    public string OrderNo { get; set; }
    public decimal TotalAmount { get; set; }
    // 只展平需要的字段，不把整个 Customer 对象丢进去
    public string CustomerName { get; set; }
    public string CustomerPhone { get; set; }
}

// ✅ 不同场景不同 DTO — 各取所需
public class UserSummaryDto    // 列表：字段少
{
    public int Id { get; set; }
    public string Name { get; set; }
}

public class UserDetailDto     // 详情：字段多
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public List<OrderBriefDto> RecentOrders { get; set; }
}
```

### 2.4 DTO 的错误写法

```csharp
// ❌ 坏的味道
public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }

    // ❌ DTO 不应该有业务逻辑
    public bool IsAdult() => Age >= 18;

    // ❌ DTO 不应该依赖数据库上下文
    public async Task SaveAsync(DbContext ctx)
    {
        ctx.Users.Add(this);
        await ctx.SaveChangesAsync();
    }

    // ❌ DTO 不应该直接暴露数据库实体
    public DepartmentEntity Department { get; set; }
}
```

---

## 3. VO — 值对象

### 3.1 什么是 VO

VO 的全称是 **Value Object（值对象）**，是领域驱动设计（DDD）中的核心概念。

**核心特征：**

| 特征 | 说明 |
|------|------|
| **靠值判等** | 两个 VO 的所有属性值相同，就认为它们相等 |
| **不可变** | 创建后状态不可修改（immutable） |
| **无标识** | 没有 ID，不需要主键 |
| **自描述** | 自身蕴含业务含义 |
| **可替换** | 修改 = 整体替换，而非修改内部字段 |

### 3.2 典型场景

```csharp
// ✅ 值对象示例 1：金额
public class Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentException("金额不能为负");
        Amount = amount;
        Currency = currency ?? throw new ArgumentNullException(nameof(currency));
    }

    // 值判等：金额 + 币种相同 → 即相等
    public override bool Equals(object obj) => Equals(obj as Money);
    public bool Equals(Money other) =>
        other is not null &&
        Amount == other.Amount &&
        Currency == other.Currency;
    public override int GetHashCode() => HashCode.Combine(Amount, Currency);

    // 不可变：返回新对象，不修改原对象
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("不同币种不能相加");
        return new Money(Amount + other.Amount, Currency);
    }

    public override string ToString() => $"{Amount} {Currency}";
}

// ✅ 值对象示例 2：地址
public class Address : IEquatable<Address>
{
    public string Province { get; }
    public string City { get; }
    public string District { get; }
    public string Detail { get; }

    public Address(string province, string city, string district, string detail)
    {
        Province = province;
        City = city;
        District = district;
        Detail = detail;
    }

    public bool Equals(Address other) =>
        other is not null &&
        Province == other.Province &&
        City == other.City &&
        District == other.District &&
        Detail == other.Detail;

    public override bool Equals(object obj) => Equals(obj as Address);
    public override int GetHashCode() =>
        HashCode.Combine(Province, City, District, Detail);
}

// ✅ 值对象示例 3：电话号码
public class PhoneNumber : IEquatable<PhoneNumber>
{
    public string Number { get; }

    public PhoneNumber(string number)
    {
        Number = IsValid(number)
            ? number
            : throw new ArgumentException($"无效的电话号码: {number}");
    }

    public static bool IsValid(string number) =>
        Regex.IsMatch(number, @"^1[3-9]\d{9}$");

    public bool Equals(PhoneNumber other) =>
        other is not null && Number == other.Number;
    public override bool Equals(object obj) => Equals(obj as PhoneNumber);
    public override int GetHashCode() => Number.GetHashCode();
    public override string ToString() => Number;
}
```

### 3.3 VO vs 实体（Entity）

| 维度 | 值对象 (VO) | 实体 (Entity) |
|------|------------|--------------|
| **唯一标识** | 无 ID | 有 ID |
| **相等性** | 属性值相同即相等 | ID 相同即相等（即使其他属性不同） |
| **可变性** | 不可变 | 可变 |
| **生命周期** | 依附于实体 | 独立存在 |
| **持久化** | 通常随实体一起存储（Owned Type / JSON 列） | 独立表 |
| **举例** | 金额、地址、坐标、颜色、时间段 | 用户、订单、商品 |

### 3.4 VO 持久化策略（EF Core）

```csharp
// 方式一：Owned Type（推荐）
[Owned]
public class Address { /* ... */ }

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Address HomeAddress { get; set; }  // VO 作为实体的一部分
    public Address WorkAddress { get; set; }
}

// 生成的表：Customer 包含 Address_Province, Address_City 等列

// 方式二：JSON 列（.NET 7+ EF Core 8）
public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Address HomeAddress { get; set; }
}
// 配置
builder.OwnsOne(c => c.HomeAddress, addr =>
{
    addr.ToJson("HomeAddressJson");
});
```

---

## 4. 其他常见对象类型

### 4.1 PO (Persistence Object) — 持久化对象

```csharp
// PO 与数据库表一一对应
[Table("Users")]
public class UserPO
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ✅ 只用做 ORM 映射，不掺入业务逻辑
// ✅ 命名清晰标识 "我是数据库的镜像"
```

### 4.2 BO (Business Object) — 业务对象

```csharp
// BO 封装业务规则
public class OrderBO
{
    public int Id { get; private set; }
    public string OrderNo { get; private set; }
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }

    // ✅ 业务行为封装在 BO 内部
    public void Cancel(string reason)
    {
        if (Status != OrderStatus.Pending && Status != OrderStatus.Confirmed)
            throw new BusinessException($"订单状态 {Status} 不允许取消");

        Status = OrderStatus.Cancelled;
        // 触发领域事件...
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new BusinessException("只有待处理订单才能确认");

        Status = OrderStatus.Confirmed;
    }
}
```

### 4.3 ViewModel — 视图模型

```csharp
// MVVM 中的 ViewModel：为视图服务
public class UserEditViewModel : BindableBase
{
    private string _userName;
    public string UserName
    {
        get => _userName;
        set => SetProperty(ref _userName, value);
    }

    private bool _isBusy;
    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    // ✅ ViewModel 可以有命令属性
    public DelegateCommand SaveCommand { get; }

    public UserEditViewModel()
    {
        SaveCommand = new DelegateCommand(SaveAsync, CanSave);
    }

    private async void SaveAsync()
    {
        IsBusy = true;
        // 调用服务层...
        IsBusy = false;
    }

    private bool CanSave() => !string.IsNullOrWhiteSpace(UserName);
}
```

### 4.4 Query / Command（CQRS 模式）

```csharp
// ✅ Query — 只读，表述"我要什么"
public class GetUserListQuery : IRequest<List<UserSummaryDto>>
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string Keyword { get; set; }
    public int? DepartmentId { get; set; }
}

// ✅ Command — 写操作，表述"我要做什么"
public class CreateUserCommand : IRequest<Result<int>>
{
    public string UserName { get; set; }
    public string Email { get; set; }
    public int DepartmentId { get; set; }
}
```

### 4.5 各对象类型对比速查

| 类型 | 有行为？ | 有 ID？ | 可变？ | 主要存在层 | 与 DB 耦合？ |
|------|---------|--------|-------|-----------|------------|
| DTO | ❌ | 可选 | ✅ | 接口层/传输层 | ❌ |
| VO | ✅ (有限) | ❌ | ❌ | 领域层 | ❌ |
| PO | ❌ | ✅ | ✅ | 持久层 | ✅ |
| BO | ✅ | ✅ | ✅ | 业务层 | ❌ |
| DO/Entity | ✅ | ✅ | ✅ | 领域层 | ❌ |
| ViewModel | ✅ | ❌ | ✅ | 表现层 | ❌ |
| Query | ❌ | ❌ | ✅ | 应用层 | ❌ |
| Command | ❌ | ❌ | ✅ | 应用层 | ❌ |

---

## 5. 对象分层与流转

### 5.1 经典三层 + DDD 对象分布

```
┌─────────────────────────────────────────────────────┐
│                   表现层 (Presentation)               │
│   ViewModel  ←──→  View                              │
├─────────────────────────────────────────────────────┤
│                   接口层 (API / Interface)             │
│   RequestDto / ResponseDto                           │
├─────────────────────────────────────────────────────┤
│                   应用层 (Application)                 │
│   Command / Query / ApplicationDto                   │
├─────────────────────────────────────────────────────┤
│                   领域层 (Domain)                      │
│   Domain Entity / Value Object / Domain Service      │
├─────────────────────────────────────────────────────┤
│                   基础设施层 (Infrastructure)           │
│   PO / Repository / External Service Adapter         │
├─────────────────────────────────────────────────────┤
│                   数据库 (Database)                    │
│   Tables                                             │
└─────────────────────────────────────────────────────┘
```

### 5.2 各层之间的转换

```csharp
// ❌ 反模式：跨层混用
public async Task<UserEntity> CreateUser(CreateUserRequest request)
{
    // 实体直接暴露给 Controller
    var entity = await _repo.GetByIdAsync(id);
    return entity;
}

// ✅ 正确做法：每层转换
public async Task<UserDetailDto> CreateUser(CreateUserRequest request)
{
    // 1. Request → Command
    var command = _mapper.Map<CreateUserCommand>(request);

    // 2. Command → Domain Entity
    var entity = UserEntity.Create(command.UserName, command.Email);

    // 3. 领域层执行业务逻辑
    await _userService.RegisterAsync(entity);

    // 4. Entity → Response DTO
    return _mapper.Map<UserDetailDto>(entity);
}
```

---

## 6. 命名规范

### 6.1 推荐命名约定

| 对象类型 | 后缀 | 示例 |
|---------|------|------|
| API 请求参数 | `Request` | `CreateUserRequest`、`LoginRequest` |
| API 响应结果 | `Response` / `Result` | `UserListResponse`、`ApiResult<T>` |
| 通用传输对象 | `Dto` | `UserDto`、`OrderSummaryDto` |
| 值对象 | 无后缀（业务名词） | `Money`、`Address`、`PhoneNumber` |
| 持久化对象 | `PO` | `UserPO`、`OrderPO` |
| 业务对象 | `BO` | `OrderBO`、`InvoiceBO` |
| 视图模型 | `ViewModel` / `VM` | `UserEditViewModel`、`MainVM` |
| 查询对象 | `Query` | `UserListQuery`、`OrderSearchQuery` |
| 命令对象 | `Command` | `CreateUserCommand`、`CancelOrderCommand` |
| 分页参数 | `PageRequest` / `PagedQuery` | `UserPageRequest` |
| 分页结果 | `PagedResult<T>` / `PageResponse<T>` | `PagedResult<UserDto>` |

### 6.2 命名原则

```csharp
// ✅ 按业务含义命名，不按技术含义
// 好
public class CreateOrderRequest { }
public class OrderDetailResponse { }

// 差：太泛化，看不出是干什么的
public class DataModel { }
public class InfoDto { }
public class ResultObject { }

// ✅ 同级概念统一后缀
// 好：全是 Response
UserListResponse
UserDetailResponse
LoginResponse

// 差：乱七八糟
UserListResult
UserDetailDto
LoginOutput
```

---

## 7. 对象映射

### 7.1 手动映射（小项目 / 简单场景）

```csharp
// ✅ 小对象手动映射 — 无依赖，最直观
public static UserDto ToDto(this UserEntity entity)
{
    return new UserDto
    {
        Id = entity.Id,
        Name = entity.Name,
        Email = entity.Email
    };
}
```

### 7.2 AutoMapper（中大型项目）

```csharp
// 安装：Install-Package AutoMapper

// 1. 定义 Profile
public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        // 简单映射
        CreateMap<CreateUserRequest, CreateUserCommand>();

        // 自定义映射
        CreateMap<UserEntity, UserDetailDto>()
            .ForMember(dest => dest.FullAddress,
                       opt => opt.MapFrom(src =>
                           $"{src.Province} {src.City} {src.District}"))
            .ForMember(dest => dest.Age,
                       opt => opt.MapFrom(src =>
                           DateTime.Now.Year - src.BirthDate.Year));

        // 双向映射
        CreateMap<UserEntity, UserDto>().ReverseMap();
    }
}

// 2. 注册
services.AddAutoMapper(typeof(UserMappingProfile).Assembly);

// 3. 使用
var dto = _mapper.Map<UserDetailDto>(entity);
var dtos = _mapper.Map<List<UserDto>>(entities);
```

### 7.3 Mapster（性能优先）

```csharp
// 安装：Install-Package Mapster

// ✅ 编译时生成映射代码，性能远超 AutoMapper
var dto = entity.Adapt<UserDetailDto>();

// ✅ 全局配置
TypeAdapterConfig<UserEntity, UserDetailDto>
    .NewConfig()
    .Map(dest => dest.FullAddress,
         src => $"{src.Province} {src.City}");

// ✅ 无需 Profile，按需配置即可
```

### 7.4 映射选型建议

| 项目规模 | 推荐方案 | 理由 |
|---------|---------|------|
| 小型项目 (< 10 个 Entity) | 手动映射 | 零依赖，简单直观 |
| 中型项目 (10-50 Entity) | AutoMapper | 约定优于配置，社区成熟 |
| 大型项目 / 性能敏感 | Mapster | 编译时生成，零反射 |
| 源生成器 | Mapperly | .NET 7+ 推荐，编译时安全 |

---

## 8. 项目结构建议

### 8.1 按层分区

```
src/
├── Company.Project.Api/              # Web API 项目
│   ├── Controllers/
│   ├── Models/
│   │   ├── Requests/                 # 请求 DTO
│   │   │   ├── UserRequest.cs
│   │   │   └── OrderRequest.cs
│   │   └── Responses/                # 响应 DTO
│   │       ├── UserResponse.cs
│   │       └── OrderResponse.cs
│   └── Filters/                      # 验证过滤器
│
├── Company.Project.Application/      # 应用层
│   ├── Commands/                     # 命令对象
│   │   └── Users/
│   │       ├── CreateUserCommand.cs
│   │       └── UpdateUserCommand.cs
│   ├── Queries/                      # 查询对象
│   │   └── Users/
│   │       └── GetUserListQuery.cs
│   └── Dtos/                         # 应用层 DTO
│       └── UserDto.cs
│
├── Company.Project.Domain/           # 领域层
│   ├── Entities/                     # 实体
│   ├── ValueObjects/                 # 值对象
│   │   ├── Money.cs
│   │   ├── Address.cs
│   │   └── PhoneNumber.cs
│   └── Services/                     # 领域服务
│
└── Company.Project.Infrastructure/   # 基础设施层
    ├── Persistence/
    │   └── POs/                      # 持久化对象
    │       ├── UserPO.cs
    │       └── OrderPO.cs
    └── Mapping/                      # 映射配置
        └── AutoMapperProfiles/
```

### 8.2 简单项目结构

如果项目不复杂，不必强行分层——可以把 DTO 放在使用它的模块旁边：

```
src/
└── Company.Project.Web/
    ├── Features/
    │   ├── Users/
    │   │   ├── UserController.cs
    │   │   ├── CreateUserRequest.cs      # DTO 和 Controller 放一起
    │   │   ├── UserListResponse.cs
    │   │   └── UserService.cs
    │   └── Orders/
    │       ├── OrderController.cs
    │       ├── CreateOrderRequest.cs
    │       └── OrderDetailResponse.cs
    └── Shared/
        ├── PagedResult.cs
        └── ApiResult.cs
```

---

## 9. 最佳实践总结

### 9.1 黄金法则

```
═══════════════════════════════════════════════════
  每个层看到的数据形状，应该恰好是它需要的形状
═══════════════════════════════════════════════════
```

### 9.2 十条纪律

| # | 纪律 | 说明 |
|---|------|------|
| 1 | **一场景一 DTO** | 不要复用同一个 DTO 给列表、详情、编辑——字段差异大，混用只会互相拖累 |
| 2 | **DTO 零行为** | 不在 DTO 中写任何业务方法；验证注解（DataAnnotation）是唯一允许的"逻辑" |
| 3 | **VO 必判等** | 值对象必须实现 `IEquatable<T>`，重写 `Equals` 和 `GetHashCode` |
| 4 | **VO 不可变** | 值对象属性 `{ get; }` 或 `init`，构造函数校验，修改 = 创建新实例 |
| 5 | **层间必须转换** | Controller 不接收 Entity，Repository 不返回 DTO——层边界强制转换 |
| 6 | **禁止实体直出** | API 响应永远不要直接序列化 ORM 实体——字段泄露、循环引用、懒加载坑 |
| 7 | **DTO 扁平优先** | 返回给前端的 DTO 尽量扁平，避免 3 层以上嵌套 |
| 8 | **命名自解释** | 看后缀就知道是什么对象：`XxxRequest`、`XxxDto`、`XxxPO` |
| 9 | **映射集中管理** | AutoMapper Profile / Mapster Config 放在独立文件，不要散落各处 |
| 10 | **Command/Query 无复用** | CQRS 中 Command 和 Query 各自独立，不共享字段基类 |

### 9.3 验证放哪里

```csharp
// ✅ Request DTO：DataAnnotation 验证（API 层）
public class CreateUserRequest
{
    [Required, StringLength(50)]
    public string UserName { get; set; }

    [Required, EmailAddress]
    public string Email { get; set; }
}

// ✅ Command：FluentValidation（应用层）
public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.UserName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.DepartmentId).GreaterThan(0);
    }
}

// ✅ VO：构造函数自校验（领域层）
public class Email
{
    public string Value { get; }
    public Email(string value)
    {
        if (!value.Contains('@'))
            throw new ArgumentException("无效的邮箱地址");
        Value = value;
    }
}
```

---

## 10. 常见反模式与陷阱

### 10.1 万能 DTO

```csharp
// ❌ 一个 DTO 打天下
public class UserDto
{
    // 列表要的字段
    public int Id { get; set; }
    public string Name { get; set; }

    // 详情要的字段
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Address { get; set; }

    // 编辑要的字段
    public string Password { get; set; }
    public int RoleId { get; set; }

    // 报表要的字段
    public DateTime CreatedAt { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalSpent { get; set; }
}

// ✅ 拆成专用 DTO
public class UserListItemDto { /* 列表 */ }
public class UserDetailDto { /* 详情 */ }
public class UserUpdateRequest { /* 编辑 */ }
public class UserReportDto { /* 报表 */ }
```

### 10.2 实体直接暴露

```csharp
// ❌ 把 ORM 实体直接返回给前端
[HttpGet("{id}")]
public async Task<UserEntity> GetUser(int id)  // 危险！
{
    return await _dbContext.Users
        .Include(u => u.Department)
        .FirstOrDefaultAsync(u => u.Id == id);
}
// 风险：
// 1. 循环引用导致 JSON 序列化失败
// 2. 懒加载触发 N+1 查询
// 3. 密码 Hash、内部字段可能被泄露

// ✅ 投影到 DTO（EF Core 只 SELECT 需要的列）
[HttpGet("{id}")]
public async Task<UserDetailDto> GetUser(int id)
{
    return await _dbContext.Users
        .Where(u => u.Id == id)
        .Select(u => new UserDetailDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email
        })
        .FirstOrDefaultAsync();
}
```

### 10.3 VO 当作 DTO 用

```csharp
// ❌ 把需要序列化传输的值对象当作 DTO
public class ApiResponse
{
    public Money TotalAmount { get; set; }  // Money 是 VO，不可变
}
// 问题：反序列化时构造函数校验可能失败；setter 违背不可变性

// ✅ DTO 用原始类型，到了领域层再转 VO
public class OrderResponseDto
{
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; }
}

// 领域层：
var money = new Money(dto.TotalAmount, dto.Currency); // 安全转换
```

### 10.4 映射逻辑散落

```csharp
// ❌ 到处写映射代码
public class UserController
{
    public async Task<UserDto> Get(int id)
    {
        var entity = await _service.GetAsync(id);
        return new UserDto { Id = entity.Id, Name = entity.Name };
    }
}

public class OrderController
{
    public async Task<OrderDto> Get(int id)
    {
        var entity = await _service.GetAsync(id);
        // 同一个 Entity 的映射逻辑在另一个 Controller 重复
        var dto = new OrderDto();
        dto.UserName = entity.User.Name;
        dto.UserEmail = entity.User.Email;
        return dto;
    }
}

// ✅ 映射逻辑集中：扩展方法 或 AutoMapper
public static class UserMappingExtensions
{
    public static UserDto ToDto(this UserEntity entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name
    };
}
```

### 10.5 过度抽象

```csharp
// ❌ 过度设计：为了"通用"创建太多基类
public abstract class BaseDto<TKey> { public TKey Id { get; set; } }
public abstract class BaseAuditedDto<TKey> : BaseDto<TKey>
{
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}
public abstract class BaseFullDto<TKey> : BaseAuditedDto<TKey>
{
    public DateTime UpdatedAt { get; set; }
    public string UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

// ✅ 够用就好：简单的 DTO 不需要继承链
public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}
```

---

## 11. WPF 桌面开发实战

> 前面章节覆盖了理论上的完整分层。但在 WPF + EF Core 的桌面项目中，**分层是菜单，不是套餐**——你不需要把每一层都点一遍。

### 11.1 核心原则：复杂的地方厚，简单的地方薄

```
理论上的"满配"链路（几乎不存在于真实项目）：
  DB → PO → Entity → BO → DTO → ViewModel → View
  7 层，每一层都转 ← 没人这么干

WPF + EF Core 实战中的精简架构：
  DB ──→ Entity ──→ ViewModel ──→ View
         (EF Core)   (展示逻辑)    (XAML)
```

**Entity 就是你的数据层，ViewModel 就是你的展示层。** 中间不需要再塞 DTO、BO、PO——除非你的项目真有那个复杂度去接住。

### 11.2 核心架构图

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌──────────┐
│   Database   │ ←→  │  EF Core Entity  │ ←→  │   ViewModel    │ ←→  │   View   │
│   (Tables)   │     │  (DbContext)     │     │ (属性 + 命令)   │     │  (XAML)  │
└──────────────┘     └──────────────────┘     └────────────────┘     └──────────┘
                            ↑                        ↑
                      User / Order           UserEditViewModel
                      就是 Entity           属性直接绑 Entity 字段

              列表场景加一个轻量壳（DisplayItem）
              只做 Select 投影，不算"多一层"
```

### 11.3 场景一：只读列表（DataGrid、ComboBox）

**最佳实践：EF Core 直接 `Select` 投影到一个轻量显示类，不经过中间层。**

```csharp
// === 1. 纯展示用的轻量类（放在 ViewModels 文件夹，后缀 DisplayItem） ===
public class UserDisplayItem
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string DepartmentName { get; set; }  // 关联表字段已展平
    public string CreateTime { get; set; }       // 格式化好的字符串，不再二次处理
}

// === 2. ViewModel：直接投影，一步到位 ===
public class UserListViewModel : BindableBase
{
    private ObservableCollection<UserDisplayItem> _users;
    public ObservableCollection<UserDisplayItem> Users
    {
        get => _users;
        set => SetProperty(ref _users, value);
    }

    private readonly AppDbContext _db;

    public async Task LoadAsync()
    {
        // ✅ EF Core Select 投影：SQL 只查需要的列，直接映射到显示对象
        Users = new ObservableCollection<UserDisplayItem>(
            await _db.Users
                .Where(u => !u.IsDeleted)
                .Select(u => new UserDisplayItem
                {
                    Id = u.Id,
                    Name = u.Name,
                    DepartmentName = u.Department.Name,
                    CreateTime = u.CreatedAt.ToString("yyyy-MM-dd")
                })
                .ToListAsync()
        );
    }
}
```

**为什么这不算"多一层"：**

| 对比项 | 中间 DTO 层 | DisplayItem |
|--------|-----------|-------------|
| 独立文件 | 单独文件夹、单独项目 | 放在 ViewModel 旁边 |
| 映射工具 | AutoMapper / Mapster | EF Core 原生 `Select` |
| 使用范围 | 跨层共享 | 仅此 ViewModel 使用 |
| 本质 | 架构概念，职责分离 | ViewModel 的附属品，像 `List<T>` 里的 `T` |

### 11.4 场景二：编辑表单（新增 / 修改）

**最佳实践：ViewModel 的属性直接对应 Entity 的字段，手动赋值，不引入中间对象。**

```csharp
public class UserEditViewModel : BindableBase
{
    // ===== 绑定属性：直接对应 Entity 字段 =====
    private int _userId;
    private string _userName;
    private string _email;
    private int _selectedDepartmentId;

    public string UserName
    {
        get => _userName;
        set => SetProperty(ref _userName, value);
    }

    public string Email
    {
        get => _email;
        set => SetProperty(ref _email, value);
    }

    public int SelectedDepartmentId
    {
        get => _selectedDepartmentId;
        set => SetProperty(ref _selectedDepartmentId, value);
    }

    // 下拉数据源
    private ObservableCollection<Department> _departments;
    public ObservableCollection<Department> Departments
    {
        get => _departments;
        set => SetProperty(ref _departments, value);
    }

    // ===== 命令 =====
    public DelegateCommand SaveCommand { get; }

    private readonly AppDbContext _db;

    public UserEditViewModel()
    {
        SaveCommand = new DelegateCommand(SaveAsync);
    }

    // ===== 加载：Entity 字段 → ViewModel 属性（手动赋值，6 行代码） =====
    public async Task LoadAsync(int userId)
    {
        _userId = userId;
        Departments = new ObservableCollection<Department>(
            await _db.Departments.ToListAsync()
        );

        var entity = await _db.Users.FindAsync(userId);
        if (entity != null)
        {
            UserName = entity.Name;
            Email = entity.Email;
            SelectedDepartmentId = entity.DepartmentId;
        }
    }

    // ===== 保存：ViewModel 属性 → Entity 字段（手动赋值，6 行代码） =====
    private async void SaveAsync()
    {
        var entity = await _db.Users.FindAsync(_userId);
        if (entity == null)
        {
            entity = new User();
            _db.Users.Add(entity);
        }

        entity.Name = UserName;
        entity.Email = Email;
        entity.DepartmentId = SelectedDepartmentId;

        await _db.SaveChangesAsync();
    }
}
```

**为什么不需要建一个 `UserModel` 或 `UserDto` 来中转：**

- ViewModel 的属性**已经是** Entity 字段的镜像——它本身就是那个 DTO
- 引入中间对象只会多一次属性拷贝（Entity → Model → ViewModel），零收益
- 当 Entity 字段变更（改名、增减），你本来就要改 ViewModel 的绑定——中间多一层不会减少工作量

### 11.5 什么时候才需要加中间层？

不是说永远不用加——以下场景加一层是有价值的：

| 场景 | 加什么 | 为什么 |
|------|--------|--------|
| **多个 Entity 拼成一个视图** | 加一个聚合 DTO | 避免 ViewModel 依赖 5 个 Entity |
| **Entity 字段名与绑定名差异大** | 加一个 ApplicationDto | 隔离数据库命名变更对 View 的影响 |
| **团队分工：数据库团队 + UI 团队** | 加 DTO 作为契约 | 双方约定接口，互不阻塞 |
| **同一套 Entity 给 WPF 也供 Web API** | 加 Shared DTO | 不同客户端复用同一传输契约 |
| **复杂业务规则（如订单金额计算）** | 加 BO 或 Domain Entity | 业务逻辑集中，不在 ViewModel 里散落 |

```csharp
// ✅ 当 View 需要 5 个表的聚合数据时，加一个聚合 DTO 是值得的
public class OrderDetailDto
{
    // 来自 Order 表
    public string OrderNo { get; set; }
    public decimal TotalAmount { get; set; }

    // 来自 Customer 表
    public string CustomerName { get; set; }

    // 来自 OrderItem 表（聚合计算）
    public int ItemCount { get; set; }
    public string FirstItemName { get; set; }

    // 来自 Logistics 表
    public string TrackingNumber { get; set; }

    // 来自 Invoice 表
    public bool HasInvoice { get; set; }
}

// ViewModel 直接使用这个 DTO
public class OrderDetailViewModel : BindableBase
{
    private OrderDetailDto _order;
    public OrderDetailDto Order
    {
        get => _order;
        set => SetProperty(ref _order, value);
    }

    public async Task LoadAsync(int orderId)
    {
        Order = await _db.Orders
            .Where(o => o.Id == orderId)
            .Select(o => new OrderDetailDto  // ← Select 一步投影到聚合 DTO
            {
                OrderNo = o.OrderNo,
                TotalAmount = o.TotalAmount,
                CustomerName = o.Customer.Name,
                ItemCount = o.Items.Count,
                FirstItemName = o.Items.First().ProductName,
                TrackingNumber = o.Logistics.TrackingNumber,
                HasInvoice = o.Invoice != null
            })
            .FirstOrDefaultAsync();
    }
}
```

### 11.6 WPF 实战总结

```
普通 CRUD 场景（占项目的 80%）：
  Entity ←→ ViewModel ←→ View
  中间不加任何对象，Entity 和 ViewModel 直接互转

简单列表：
  Entity ──Select 投影──→ DisplayItem ──绑定──→ DataGrid/ComboBox
  DisplayItem 是 ViewModel 的一部分，不算独立层

聚合视图（多表拼装）：
  多个 Entity ──Select 投影──→ 一个聚合 Dto ──→ ViewModel ──→ View
  加 Dto 是为了聚合，不是为了"架构正确"

复杂业务（订单、支付、库存等核心领域）：
  Entity ──→ Domain Entity / BO ──→ Dto ──→ ViewModel ──→ View
  只在 20% 的核心业务上厚，其他 80% 一律走精简链路
```

> **一句话**：WPF 桌面项目里，Entity 负责跟数据库打交道，ViewModel 负责跟视图打交道。两者之间——**先直接赋值，发现真的疼了再加层。**

---

## 附录：快速决策树

```
你需要创建一个对象 →
    │
    ├─ 跨越进程/网络传输数据？
    │   ├─ 接收请求 → Request
    │   ├─ 返回响应 → Response
    │   └─ 服务间通讯 → Message / Event DTO
    │
    ├─ 描述领域概念、靠值判等？
    │   └─ Value Object（不可变，IEquatable）
    │
    ├─ 与数据库表映射？
    │   └─ PO
    │
    ├─ 承载复杂业务逻辑？
    │   └─ BO / Domain Entity
    │
    ├─ 为视图服务（WPF/Blazor/MAUI）？
    │   └─ ViewModel
    │
    ├─ CQRS 读写分离？
    │   ├─ 读 → Query
    │   └─ 写 → Command
    │
    └─ 都不属于？
        └─ POCO（普通类，不强加职责）
```

---

> **一句话记住**：DTO 是送快递的（搬运数据），VO 是验身份的（值相等），Entity 是有户口的（ID 唯一）——各司其职，别让送快递的顺便当警察。
