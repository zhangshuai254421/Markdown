# DryIoc 使用指南

## 目录

1. [什么是 DryIoc](#1-什么是-dryioc)
2. [快速入门](#2-快速入门)
3. [注册服务](#3-注册服务)
4. [解析服务](#4-解析服务)
5. [生命周期管理](#5-生命周期管理)
6. [条件注册与解析](#6-条件注册与解析)
7. [装饰器模式](#7-装饰器模式)
8. [拦截器](#8-拦截器)
9. [开放泛型](#9-开放泛型)
10. [集合注入](#10-集合注入)
11. [属性注入](#11-属性注入)
12. [进阶特性](#12-进阶特性)
13. [与 Prism 集成](#13-与-prism-集成)
14. [最佳实践与常见陷阱](#14-最佳实践与常见陷阱)

---

## 1. 什么是 DryIoc

DryIoc 是一个轻量级、高性能的 .NET IoC/DI 容器。"Dry" = **D**on't **R**epeat **Y**ourself，"Ioc" = Inversion of Control。

| 特性 | 说明 |
|------|------|
| **体积小** | 单一 DLL，无外部依赖 |
| **速度快** | 启动和解析速度在主流容器中名列前茅 |
| **功能全** | 支持装饰器、拦截器、开放泛型、条件注册等高级特性 |
| **表达式树** | 使用表达式树编译解析逻辑，接近手写代码性能 |
| **线程安全** | 所有公开 API 线程安全 |
| **容器不可变** | 注册后`包含`不可变的规则集合，可高效克隆 |

### 安装

```bash
# Package Manager Console
Install-Package DryIoc.dll         # 无依赖版本
Install-Package DryIoc             # 完整版

# .NET CLI
dotnet add package DryIoc
```

---

## 2. 快速入门

```csharp
using DryIoc;

// 1. 创建容器
var container = new Container();

// 2. 注册
container.Register<ILogger, ConsoleLogger>();
container.Register<IUserService, UserService>();

// 3. 解析
var userService = container.Resolve<IUserService>();
userService.DoSomething();
```

---

## 3. 注册服务

### 3.1 基本注册方式

```csharp
var container = new Container();

// ========== 接口 → 实现 ==========
container.Register<IService, MyService>();

// ========== 具体类自注册 ==========
container.Register<MyService>();                    // 通过类型自身解析

// ========== 实例注册（单例实例） ==========
var instance = new MyService();
container.RegisterInstance<IService>(instance);    // 注册已有实例

// ========== 委托注册 ==========
container.RegisterDelegate<IService>(r => new MyService("param"));

// ========== 条件委托注册 ==========
container.RegisterDelegate<IService>(
    r => r.IsValid ? new MyService() : new OtherService());
```

### 3.2 注册多个实现（Keyed Registration）

同一个接口注册多个实现，用 `serviceKey` 区分：

```csharp
// 注册时指定 key
container.Register<IService, ServiceA>(serviceKey: "A");
container.Register<IService, ServiceB>(serviceKey: "B");
container.Register<IService, ServiceC>(serviceKey: "C");

// 解析时指定 key
var a = container.Resolve<IService>(serviceKey: "A");  // → ServiceA
var b = container.Resolve<IService>(serviceKey: "B");  // → ServiceB

// 默认注册（无 key），解析时不指定 key 获得默认实现
container.Register<IService, ServiceDefault>();
var d = container.Resolve<IService>();                  // → ServiceDefault
```

### 3.3 使用 made.Of 工厂方法

```csharp
// 指定构造函数参数
container.Register<IMyService, MyService>(
    made: Made.Of(
        () => new MyService(Arg.Of<ILogger>(), Arg.Of<string>("connectionString"))
    )
);

// 调用已有方法/属性
container.Register<IMyService>(
    made: Made.Of(
        typeof(ServiceFactory).GetProperty(nameof(ServiceFactory.Current)),
        factoryMethod: s => s.GetService
    )
);

// 使用 Made.Of 简化构造函数选择
container.Register<IMyService, MyService>(
    made: Made.Of(
        typeof(MyService).GetConstructor(new[] { typeof(ILogger) })
    )
);
```

### 3.4 注册时指定生命周期

```csharp
// 单例
container.Register<IService, MyService>(Reuse.Singleton);

// 作用域内单例
container.Register<IService, MyService>(Reuse.Scoped);

// 每次解析新实例（默认）
container.Register<IService, MyService>(Reuse.Transient);

// 指定作用域名称
container.Register<IService, MyService>(Reuse.ScopedTo("MyScope"));
```

---

## 4. 解析服务

### 4.1 基本解析

```csharp
// 泛型解析（推荐）
var service = container.Resolve<IService>();

// Type 解析
var service = (IService)container.Resolve(typeof(IService));

// 带 key 解析
var service = container.Resolve<IService>(serviceKey: "ImplA");
```

### 4.2 可选解析

如果服务可能未注册，使用 `ResolveMany` 或 `IsRegistered` 检查，或 Try 模式：

```csharp
// 方式 1：先检查再解析
if (container.IsRegistered<IService>())
    container.Resolve<IService>();

// 方式 2：Try 解析（返回 null）
var service = container.Resolve<IService>(IfUnresolved.ReturnDefault);
if (service != null) { /* ... */ }

// 方式 3：返回 Default 值
var service = container.Resolve<IService>(IfUnresolved.ReturnDefaultIfNotRegistered);

// 方式 4：抛出自定义异常
var service = container.Resolve<IService>(IfUnresolved.Throw);
```

### 4.3 解析集合

```csharp
// 解析所有注册的实现
var allServices = container.Resolve<IEnumerable<IService>>();
// 等价于
var allServices = container.Resolve<IService[]>();       // 数组
var allServices = container.Resolve<IList<IService>>();  // IList
var allServices = container.Resolve<ICollection<IService>>(); // ICollection

// 带 key 的集合
var keyed = container.Resolve<KeyValuePair<string, IService>[]>();
```

---

## 5. 生命周期管理

### 5.1 生命周期类型

| 生命周期 | API | 说明 |
|----------|-----|------|
| **Transient** | `Reuse.Transient` | 每次解析创建新实例（默认） |
| **Singleton** | `Reuse.Singleton` | 容器级别单例 |
| **Scoped** | `Reuse.Scoped` | 作用域内单例 |
| **ScopedTo** | `Reuse.ScopedTo("Name")` | 指定名称作用域内单例 |
| **ScopedOrSingleton** | `Reuse.ScopedOrSingleton` | 作用域存在时用作用域，否则用单例 |
| **ThreadLocal** | `Reuse.InThreadLocal` | 线程内单例 |

### 5.2 作用域（Scope）

```csharp
var container = new Container();

// 注册作用域服务
container.Register<IService, MyService>(Reuse.Scoped);
container.Register<IRepository, Repository>(Reuse.Scoped);

// 打开作用域
using (var scope = container.OpenScope())
{
    // 同一作用域内多次解析 → 同一实例
    var s1 = scope.Resolve<IService>();
    var s2 = scope.Resolve<IService>();
    ReferenceEquals(s1, s2);  // → true
}
// 作用域释放 → Scoped 实例被释放

// 不同作用域 → 不同实例
using (var scope1 = container.OpenScope())
using (var scope2 = container.OpenScope())
{
    var a = scope1.Resolve<IService>();
    var b = scope2.Resolve<IService>();
    ReferenceEquals(a, b);  // → false
}
```

### 5.3 作用域命名

```csharp
container.Register<IService, MyService>(Reuse.ScopedTo("ChildScope"));

// 单例在 "ViewScope" 作用域
container.Register<IViewModel, MainViewModel>(Reuse.ScopedTo("ViewScope"));

// 被命名称的作用域，可使用 using 或同名 scopeName
using (var scope = container.OpenScope("ViewScope"))
{
    var vm1 = scope.Resolve<IViewModel>();  // 同一作用域内相同实例
    var vm2 = scope.Resolve<IViewModel>();
    ReferenceEquals(vm1, vm2);  // → true
}
```

### 5.4 IDisposable 自动释放

```csharp
// DryIoc 在作用域关闭时自动调用实现了 IDisposable 的实例的 Dispose()
container.Register<IService, MyDisposableService>(Reuse.Scoped);

using (var scope = container.OpenScope())
{
    var s = scope.Resolve<IService>();
}
// 作用域结束 → MyDisposableService.Dispose() 自动调用

// 使用 using 语法让容器管理生命周期
using var singleton = container.Resolve<IDisposable>();  // 容器释放时调用 Dispose
```

---

## 6. 条件注册与解析

### 6.1 条件注册

```csharp
// 仅当 IService 未被注册时才注册
container.Register<IService, ServiceDefault>(
    ifAlreadyRegistered: IfAlreadyRegistered.Keep   // 如果已注册就忽略
);

// 强制替换旧注册
container.Register<IService, ServiceNew>(
    ifAlreadyRegistered: IfAlreadyRegistered.Replace
);

// 有同名 key 时抛异常（默认行为）
container.Register<IService, ServiceA>(
    ifAlreadyRegistered: IfAlreadyRegistered.Throw
);

// 追加注册（同一接口允许多个实现，用于 ResolveMany）
container.Register<IService, ServiceA>(
    ifAlreadyRegistered: IfAlreadyRegistered.AppendNotKeyed
);
```

### 6.2 Setup 条件配置

```csharp
// 条件注册：只在特定环境下注册
container.Register<ILogger, FileLogger>(
    setup: Setup.With(condition: r => r.IsRegistrationOf<ILogger, ConsoleLogger>() == false)
);

// 使用父级容器解析
container.Register<ILogger, Logger>(
    setup: Setup.With(openResolutionScope: true)
);

// 元数据
container.Register<IService, ServiceA>(
    setup: Setup.With(metadataOrFuncOfMetadata: new { Key = "A", Priority = 1 })
);

var metadata = container.GetServiceRegistrations()
    .Where(r => r.Metadata != null)
    .ToList();
```

---

## 7. 装饰器模式

装饰器在 DryIoc 中是一等公民，无需自己写代理类。

```csharp
// 注册基础服务
container.Register<IService, MyService>();

// 注册装饰器（自动包装）
container.Register<IService, LoggingDecorator>(setup: Setup.Decorator);
container.Register<IService, CachingDecorator>(setup: Setup.Decorator);

// 解析时自动包装：
// CachingDecorator → LoggingDecorator → MyService
var service = container.Resolve<IService>();
```

装饰器实现：
```csharp
// 装饰器约定：构造函数接收被装饰对象
public class LoggingDecorator : IService
{
    private readonly IService _inner;
    private readonly ILogger _logger;

    public LoggingDecorator(IService inner, ILogger logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public void DoWork()
    {
        _logger.Log("Before");
        _inner.DoWork();
        _logger.Log("After");
    }
}
```

**装饰器顺序控制**：
```csharp
// order 越小越靠近内层
container.Register<IService, LoggingDecorator>(setup: Setup.DecoratorOf<IService>(order: 1));
container.Register<IService, CachingDecorator>(setup: Setup.DecoratorOf<IService>(order: 2));
// 结果：Caching → Logging → MyService
```

**条件装饰器**：
```csharp
// 仅在注册表中已注册了特定接口时才应用装饰器
container.Register<IService, LoggingDecorator>(
    setup: Setup.DecoratorOf<IService>(
        condition: r => r.Container.IsRegistered<ILogger>()
    )
);
```

---

## 8. 拦截器

拦截器依赖 `Castle.Core` 的 `DynamicProxy`。

### 8.1 安装

```bash
Install-Package DryIoc.Interception
```

### 8.2 基本使用

```csharp
using DryIoc.Interception;
using Castle.DynamicProxy;

// 定义拦截器
public class LogInterceptor : IInterceptor
{
    public void Intercept(IInvocation invocation)
    {
        Console.WriteLine($"调用方法: {invocation.Method.Name}");
        invocation.Proceed();  // 执行原方法
        Console.WriteLine($"方法返回: {invocation.ReturnValue}");
    }
}

public class TimingInterceptor : IInterceptor
{
    public void Intercept(IInvocation invocation)
    {
        var sw = Stopwatch.StartNew();
        invocation.Proceed();
        sw.Stop();
        Console.WriteLine($"{invocation.Method.Name} 耗时: {sw.ElapsedMilliseconds}ms");
    }
}

// 注册
var container = new Container();

container.Register<IService, MyService>();

// 注册拦截器
container.Register<LogInterceptor>(Reuse.Singleton);
container.Register<TimingInterceptor>(Reuse.Singleton);

// 使用拦截
container.Intercept<IService, LogInterceptor>();
container.Intercept<IService, TimingInterceptor>();

// 解析 → 自动拦截
var service = container.Resolve<IService>();
service.DoWork();  // 日志 + 计时均生效
```

---

## 9. 开放泛型

### 9.1 基本泛型注册

```csharp
// 注册开放泛型（无需指定泛型参数）
container.Register(typeof(IRepository<>), typeof(Repository<>));
container.Register(typeof(IMapper<,>), typeof(AutoMapper<,>));

// 解析封闭泛型
var userRepo = container.Resolve<IRepository<User>>();
var orderRepo = container.Resolve<IRepository<Order>>();
```

### 9.2 泛型约束

```csharp
// 仅为值类型注册
container.Register(typeof(IProcessor<>), typeof(ValueProcessor<>),
    condition: r => r.ServiceType.GetGenericParamsAndArgs()[0].IsValueType);

// 仅实现 IEntity 接口的类型
container.Register(typeof(IRepository<>), typeof(Repository<>),
    condition: r => typeof(IEntity).IsAssignableFrom(
        r.ServiceType.GetGenericParamsAndArgs()[0]));
```

### 9.3 泛型工厂

```csharp
// 注册泛型工厂
container.Register(typeof(IFactory<>), typeof(Factory<>));

public class Factory<T> : IFactory<T>
{
    private readonly IContainer _container;
    public Factory(IContainer container) => _container = container;
    public T Create() => _container.Resolve<T>();
}
```

---

## 10. 集合注入

### 10.1 解析所有实现

```csharp
// 注册多个实现
container.Register<IPlugin, PluginA>(serviceKey: "A");
container.Register<IPlugin, PluginB>(serviceKey: "B");
container.Register<IPlugin, PluginC>(serviceKey: "C");

// 构造函数注入集合
public class PluginManager
{
    public PluginManager(IEnumerable<IPlugin> plugins)
    {
        foreach (var p in plugins)
            p.Initialize();
    }
}

// 解析时获取所有实现
container.Register<PluginManager>();
var manager = container.Resolve<PluginManager>();  // 自动注入 3 个插件
```

### 10.2 有序集合

```csharp
// DryIoc 保持注册顺序
container.Register<IPlugin, PluginA>();
container.Register<IPlugin, PluginB>();
container.Register<IPlugin, PluginC>();

// 解析出的顺序与注册顺序一致
var plugins = container.Resolve<IList<IPlugin>>();
// plugins[0] = PluginA, plugins[1] = PluginB, plugins[2] = PluginC
```

### 10.3 带键的字典注入

```csharp
container.Register<IPlugin, PluginA>(serviceKey: "A");
container.Register<IPlugin, PluginB>(serviceKey: "B");

// 注入为字典
public class PluginManager
{
    public PluginManager(KeyValuePair<string, IPlugin>[] plugins)
    {
        // plugins 包含 ("A", PluginA), ("B", PluginB)
    }
}
```

---

## 11. 属性注入

DryIoc 默认仅支持构造函数注入。如需属性注入，显式指定。

```csharp
public class MyViewModel
{
    // 标记需要注入的属性
    [Import]
    public ILogger Logger { get; set; }

    public string Title { get; set; }
}

// 注册并启用属性注入
container.Register<ILogger, ConsoleLogger>();
container.Register<MyViewModel>(
    made: PropertiesAndFields.Auto  // 自动注入带 [Import] 标签的属性
);

var vm = container.Resolve<MyViewModel>();
Assert.NotNull(vm.Logger);  // ✅ 已注入
```

**指定注入哪些属性**：
```csharp
// 注入指定名称的属性
container.Register<MyViewModel>(
    made: PropertiesAndFields.Of
        .Name("Logger")
        .Name("Title", requiredServiceType: typeof(string))
);

// 注入所有 public writable 属性
container.Register<MyViewModel>(
    made: PropertiesAndFields.AllPublic
);
```

> **建议**：优先使用构造函数注入；属性注入仅用于无法使用构造函数的场景（如 ViewModel 基类）。

---

## 12. 进阶特性

### 12.1 子容器（Facade / Registry）

```csharp
// 创建子容器（可注册自己的规则）
var child = container.CreateChild();    // 创建子容器
var facade = container.CreateFacade();  // 轻量级外观，不持有引用

// 在子容器注册额外服务
child.Register<IService, ChildSpecificService>();

// 子容器可以解析父容器的注册
child.Resolve<IRepository<User>>();  // 父容器中注册的
```

### 12.2 WithDependencies（手动指定依赖）

```csharp
// 硬编码参数
container.Register<MyService>(
    made: Made.Of(
        () => new MyService(Arg.Of<ILogger>(), Arg.Of<string>("connection"))
    )
);

// 带返回值前缀
container.Register<IBar>(
    made: Made.Of<IFoo>(foo => foo.GetBar())
);
```

### 12.3 AsResolutionCall（延迟解析）

```csharp
// 运行时按需解析 Lazy<T>
var service = container.Resolve<Lazy<IService>>();
var instance = service.Value;  // 此时才真正解析

// 注册时允许延迟解析
container.Register<IService, MyService>(
    setup: Setup.With(asResolutionCall: true)
);
```

### 12.4 Many 规则（默认服务 Key）

```csharp
// 注册默认 key，与 ResolveMany 配合
container.RegisterMany<MyModule>(
    serviceTypeCondition: type => type.IsInterface,
    reuse: Reuse.Singleton
);

// 等同于：
container.Register<IModule, MyModule>(Reuse.Singleton);
container.Register<IPlugin, MyModule>(Reuse.Singleton);
// ...MyModule 实现的所有接口
```

### 12.5 验证容器配置

```csharp
// 启动时验证所有注册可解析
var result = container.Validate();

if (result.Length > 0)
{
    foreach (var error in result)
        Console.WriteLine($"注册错误: {error}");
}

// 单独验证一个服务
container.Validate<IService>();
```

### 12.6 Rules（容器配置规则）

```csharp
var container = new Container(rules =>
    rules
        // 自动具体类型解析（无需显式注册）
        .WithAutoConcreteTypeResolution()

        // 未注册时抛出更详细的异常
        .WithDefaultIfAlreadyRegistered(IfAlreadyRegistered.Keep)

        // 允许 Resolve 时自动发现具体类型
        .WithConcreteTypeDynamicRegistrations()

        // 设置服务解析时的默认生命周期
        .WithDefaultReuse(Reuse.Scoped)

        // 忽略特定的注入属性
        .With(made: PropertiesAndFields.Auto)
);
```

---

## 13. 与 Prism 集成

Prism 8.x 起正式支持 DryIoc 作为容器。

### 13.1 安装

```bash
Install-Package Prism.DryIoc
```

### 13.2 基本集成

```csharp
// App.xaml.cs
public partial class App : PrismApplication
{
    protected override void RegisterTypes(IContainerRegistry containerRegistry)
    {
        // Prism 标准注册 API
        containerRegistry.Register<IService, MyService>();
        containerRegistry.RegisterSingleton<ILogger, ConsoleLogger>();
        containerRegistry.RegisterForNavigation<MainView>("MainView");
        containerRegistry.RegisterDialog<MyDialog, MyDialogViewModel>();
    }

    protected override IContainerExtension CreateContainerExtension()
    {
        return new DryIocContainerExtension();
    }
}
```

### 13.3 获取 DryIoc 原生容器

```csharp
// 在 RegisterTypes 中需要高级特性时，获取原生容器
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // 获取 DryIoc 原生接口
    var dryIocContainer = containerRegistry.GetContainer();

    // 使用 DryIoc 原生 API
    dryIocContainer.Register<IService, ServiceA>(serviceKey: "A");
    dryIocContainer.Register<IService, ServiceB>(serviceKey: "B");

    // 注册装饰器
    dryIocContainer.Register<IService, LoggingDecorator>(setup: Setup.Decorator);

    // 注册开放泛型
    dryIocContainer.Register(typeof(IRepository<>), typeof(Repository<>));

    // 条件注册
    dryIocContainer.Register<IModule, DebugModule>(
        setup: Setup.With(condition: r => IsDebugMode));
}
```

### 13.4 完整 Prism + DryIoc 示例

```csharp
public partial class App : PrismApplication
{
    // 创建 Shell
    protected override Window CreateShell()
    {
        return Container.Resolve<MainWindow>();
    }

    // 注册类型
    protected override void RegisterTypes(IContainerRegistry containerRegistry)
    {
        var c = containerRegistry.GetContainer();

        // === 基础设施（单例） ===
        c.Register<IEventAggregator, EventAggregator>(Reuse.Singleton);
        c.Register<IDialogService, DialogService>(Reuse.Singleton);

        // === 数据访问（作用域——每个请求一个） ===
        c.Register<IDbContext, AppDbContext>(Reuse.Scoped);
        c.Register(typeof(IRepository<>), typeof(EfRepository<>), Reuse.Scoped);

        // === 业务服务 ===
        c.Register<IUserService, UserService>(Reuse.Transient);
        c.Register<IOrderService, OrderService>(Reuse.Transient);

        // === ViewModel（Transient——每次导航新实例） ===
        ViewModelLocationProvider.Register<MainView, MainViewModel>();
        ViewModelLocationProvider.Register<DetailView, DetailViewModel>();
        c.Register<MainViewModel>(Reuse.Transient);
        c.Register<DetailViewModel>(Reuse.Transient);

        // === 导航 ===
        containerRegistry.RegisterForNavigation<MainView>();
        containerRegistry.RegisterForNavigation<DetailView>();

        // === 装饰器（可选） ===
        if (EnableLogging)
        {
            c.Register<IUserService, UserServiceLoggingDecorator>(
                setup: Setup.Decorator);
        }
    }

    // 初始化
    protected override void OnInitialized()
    {
        var regionManager = Container.Resolve<IRegionManager>();
        regionManager.RequestNavigate("ContentRegion", "MainView");
        base.OnInitialized();
    }
}
```

---

## 14. 最佳实践与常见陷阱

### 14.1 最佳实践

| 实践 | 说明 |
|------|------|
| **构造函数注入优先** | 依赖在构造时确定，不可变对象更安全 |
| **避免 Service Locator 模式** | 不要到处 `container.Resolve<T>()`，用构造函数注入 |
| **启动时验证** | `container.Validate()` 在应用启动时发现配置错误 |
| **分层注册** | 将注册逻辑按模块分层：基础设施 → 数据访问 → 业务 → UI |
| **Scoped 用于请求级别** | Web 应用：一个请求一个 Scope；桌面应用：一个窗口一个 Scope |
| **尽量不依赖容器** | 业务类不引用 `IContainer`，保持纯 POCO |
| **集合注入替代条件判断** | 用 `IEnumerable<T>` 替代 `if (type == A)` 的逻辑分支 |
| **装饰器优于继承** | 需要横向扩展功能时用装饰器，而非继承 |

### 14.2 常见陷阱

| 陷阱 | 症状 | 解决方案 |
|------|------|---------|
| **循环依赖** | `ContainerException: Recursive dependency detected` | 重构设计：引入接口、提取第三个类、使用 `Lazy<T>` |
| **Scoped 实例泄漏** | 内存增长、数据库连接耗尽 | 确保 `OpenScope()` 配合 `using` |
| **Transient 被 Singleton 持有** | Singleton 中的 Transient 依赖实际变成了 Singleton | 确保生命周期正确匹配：Singleton 不能持有 Scoped 实例 |
| **装饰器匹配多个注册** | 装饰器包装了错误的服务 | 用 `condition` 精确指定装饰器作用范围 |
| **忘记 Dispose** | 未释放资源（文件句柄、数据库连接） | 在作用域内解析 `IDisposable` 实例 |
| **ResolveMany 顺序假设** | 依赖了隐式注册顺序 | 用元数据或 key 显式控制顺序 |
| **条件注册逻辑错误** | 预期注册被覆盖或遗漏 | `ifAlreadyRegistered` 用 `Keep`，或启动时验证 |
| **属性注入误用** | 依赖未注入，静默失败为 null | 优先构造函数注入；属性注入仅用于特定场景 |

### 14.3 生命周期匹配规则

```
✅ 允许的组合：
  Singleton → Singleton    （单例持单例，OK）
  Singleton → Transient    （单例持瞬时，实例与单例同寿）
  Scoped    → Scoped       （作用域内一致）
  Scoped    → Transient    （正常）
  Transient → Transient    （正常）
  Transient → Scoped       （要求当前存在作用域）
  Transient → Singleton    （正常）

❌ 禁止的组合（DryIoc 会抛异常）：
  Singleton → Scoped       （单例活的比作用域长，Scoped 实例无法释放）
```

### 14.4 调试技巧

```csharp
// 输出容器内所有注册
var registrations = container.GetServiceRegistrations();
foreach (var r in registrations)
{
    Console.WriteLine($"{r.ServiceType} → {r.ImplementationType} [{r.Reuse}]");
}

// 输出指定服务的解析树
var expr = container.Resolve<Func<IService>>();
Console.WriteLine(expr);  // 查看表达式树

// 开启详细异常
var container = new Container(rules =>
    rules.WithThrowOnRegisteringDisposableTransient(false)
);
```

---

## 参考资源

- [DryIoc 官方文档](https://github.com/dadhi/DryIoc)
- [DryIoc API 参考](https://www.fuget.org/packages/DryIoc)
- [DryIoc 性能基准](https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/Performance.md)
- [Prism + DryIoc 集成文档](https://prismlibrary.com/docs/dependency-injection/dryioc.html)
- [NuGet: DryIoc](https://www.nuget.org/packages/DryIoc/)
- [NuGet: Prism.DryIoc](https://www.nuget.org/packages/Prism.DryIoc/)
