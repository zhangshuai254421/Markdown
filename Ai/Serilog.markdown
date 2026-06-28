# Serilog 使用文档 (.NET)

## 一、Serilog 简介

**Serilog** 是 .NET 生态中最流行的**结构化日志（Structured Logging）**库之一。与传统日志库将日志保存为纯文本不同，Serilog 将日志数据保存为**结构化数据**（键值对形式），使得日志可以被高效地查询、分析和聚合。

### 核心特性

| 特性 | 说明 |
|------|------|
| **结构化日志** | 以键值对形式记录日志，方便机器解析和查询 |
| **Sink 架构** | 支持输出到控制台、文件、数据库、Elasticsearch、Seq 等多种目标 |
| **Enricher 机制** | 自动向日志添加额外上下文信息（如机器名、线程ID、请求信息等） |
| **Filtering** | 支持灵活的日志过滤，精确控制哪些日志被输出 |
| **Destructuring** | 控制复杂对象的序列化方式 |
| **与 ASP.NET Core 深度集成** | 无缝替换 `ILogger<T>`，支持请求上下文的自动捕获 |

---

## 二、安装

### 2.1 NuGet 包

```bash
# 核心库（必须）
dotnet add package Serilog

# ASP.NET Core 集成（Web 项目推荐）
dotnet add package Serilog.AspNetCore

# 常用 Sinks（根据需要选择）
dotnet add package Serilog.Sinks.Console      # 控制台输出
dotnet add package Serilog.Sinks.File         # 文件输出
dotnet add package Serilog.Sinks.Seq          # Seq 服务器
dotnet add package Serilog.Sinks.ElasticSearch # Elasticsearch
dotnet add package Serilog.Sinks.MSSqlServer  # SQL Server
dotnet add package Serilog.Sinks.Async        # 异步写入（性能优化）

# 常用 Enrichers
dotnet add package Serilog.Enrichers.Environment  # 环境信息
dotnet add package Serilog.Enrichers.Thread       # 线程信息
dotnet add package Serilog.Enrichers.Process      # 进程信息
dotnet add package Serilog.Enrichers.Context      # 上下文信息

# 配置文件支持
dotnet add package Serilog.Settings.Configuration # 从 appsettings.json 读取配置
```

> **提示**：使用 `Serilog.AspNetCore` 会自动引入核心包和常用 Sink。

---

## 三、快速开始

### 3.1 控制台应用

```csharp
using Serilog;

// 配置 Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()                        // 设置最低日志级别
    .WriteTo.Console()                           // 输出到控制台
    .CreateLogger();                             // 创建 Logger

// 记录日志
Log.Debug("应用程序启动完成");
Log.Information("用户 {UserId} 登录成功", 12345);
Log.Warning("磁盘空间不足，当前剩余 {FreeSpace} MB", 512);
Log.Error("数据库连接失败: {ErrorMessage}", "Timeout");
Log.Fatal("系统崩溃，无法恢复");

// 程序退出前释放资源
Log.CloseAndFlush();
```

### 3.2 ASP.NET Core Web 应用

```csharp
// Program.cs
using Serilog;

// 先配置 Serilog（在 Host 创建之前）
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("启动 Web 应用程序");

    var builder = WebApplication.CreateBuilder(args);

    // 替换默认日志为 Serilog
    builder.Host.UseSerilog();

    // ... 其他服务配置 ...

    var app = builder.Build();
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "应用程序启动失败");
}
finally
{
    Log.CloseAndFlush();
}
```

然后在控制器中使用：

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;

    public UsersController(ILogger<UsersController> logger)
    {
        _logger = logger;
    }

    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
        _logger.LogInformation("查询用户信息: {UserId}", id);
        // ...
        return Ok();
    }
}
```

---

## 四、结构化日志

**结构化日志**是 Serilog 最核心的特性。通过消息模板（Message Template）中的 `{属性名}` 占位符，Serilog 会自动提取结构化数据。

### 4.1 消息模板

```csharp
// 传统方式（字符串拼接 - 不推荐）
Log.Information($"用户 {userId} 在 {time} 执行了操作");

// Serilog 结构化方式（推荐）
Log.Information("用户 {UserId} 在 {OperationTime} 执行了操作", userId, time);
```

两者的区别：

| 特性 | 字符串拼接 | 结构化模板 |
|------|-----------|-----------|
| 可读性 | 日志文本直观 | 属性自动提取 |
| 搜索查询 | 只能用 LIKE 模糊搜索 | 可以精确查询 `UserId=12345` |
| 性能 | 无论是否输出都执行拼接 | 仅当日志级别启用时才格式化 |
| 序列化控制 | 自动调用 ToString() | 支持 Destructuring 控制 |

### 4.2 记录复杂对象

```csharp
var user = new User { Id = 1, Name = "张三", Email = "zhangsan@example.com" };

// 默认：调用 ToString() 或序列化
Log.Information("用户信息: {@User}", user);

// 使用 @ 符号：按结构化方式序列化整个对象
// 输出时会展开对象的所有属性
```

### 4.3 Destructuring 控制

```csharp
// @ 操作符：保留对象结构（推荐）
Log.Information("订单详情: {@Order}", order);

// $ 操作符：序列化为字符串
Log.Information("原始请求: {$RawData}", rawData);

// 自定义 Destructuring 策略
Log.Logger = new LoggerConfiguration()
    .Destructure.ToMaximumDepth(4)           // 最大深度
    .Destructure.ToMaximumStringLength(100)  // 字符串最大长度
    .Destructure.ToMaximumCollectionCount(10)// 集合最大数量
    .Destructure.With<MyDestructuringPolicy>()// 自定义策略
    .CreateLogger();
```

---

## 五、Sinks（日志输出目标）

Serilog 通过 **Sink** 机制将日志输出到不同的目的地。以下是最常用的 Sink：

### 5.1 控制台 (Console)

```csharp
// 基本用法
.WriteTo.Console()

// 自定义输出模板和主题
.WriteTo.Console(
    outputTemplate: "{Timestamp:HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}",
    theme: Serilog.Sinks.SystemConsole.Themes.AnsiConsoleTheme.Code
)
```

### 5.2 文件 (File)

```csharp
// 每日滚动文件
.WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day)

// 按文件大小滚动（每个 100MB）
.WriteTo.File("logs/app.log", fileSizeLimitBytes: 100_000_000, rollOnFileSizeLimit: true)

// 限制保留文件数量
.WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)

// 常用 rollingInterval 选项
// - Day      : log20260524.log
// - Hour     : log2026052414.log
// - Minute   : log202605241430.log
// - Month    : log202605.log
// - Year     : log2026.log
// - Infinite : 始终写入同一个文件
```

### 5.3 Seq（结构化日志服务器）

[Seq](https://datalust.co/seq) 是一个专为结构化日志设计的可视化服务器。

```csharp
.WriteTo.Seq("http://localhost:5341")
```

### 5.4 Elasticsearch

```csharp
.WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri("http://localhost:9200"))
{
    IndexFormat = "myapp-logs-{0:yyyy.MM}",
    AutoRegisterTemplate = true
})
```

### 5.5 数据库 (MSSqlServer)

```csharp
.WriteTo.MSSqlServer(
    connectionString: "Server=.;Database=Logs;...",
    sinkOptions: new MSSqlServerSinkOptions { TableName = "LogEvents", AutoCreateSqlTable = true }
)
```

### 5.6 邮件 (Email)

```csharp
.WriteTo.Email(
    connectionInfo: new EmailConnectionInfo
    {
        FromEmail = "noreply@example.com",
        ToEmail = "admin@example.com",
        MailServer = "smtp.example.com",
        NetworkCredentials = new NetworkCredential("user", "pass")
    },
    restrictedToMinimumLevel: LogEventLevel.Error  // 只发错误级别邮件
)
```

### 5.7 异步 Sink（性能优化）

```csharp
// 使用 Serilog.Sinks.Async 包
.WriteTo.Async(writeTo => writeTo.File("logs/app.log"))
```

### 5.8 多个 Sink 组合

```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day)
    .WriteTo.Seq("http://localhost:5341")
    .WriteTo.Email(...)
    .CreateLogger();
```

---

## 六、日志级别 (Log Levels)

Serilog 定义了 6 个日志级别（从低到高）：

| 级别 | 方法 | 说明 | 使用场景 |
|------|------|------|---------|
| **Verbose** | `Log.Verbose()` | 最详细的跟踪信息 | 开发调试时输出所有细节 |
| **Debug** | `Log.Debug()` | 调试信息 | 开发环境中输出变量状态 |
| **Information** | `Log.Information()` | 常规信息 | 业务流程的关键步骤 |
| **Warning** | `Log.Warning()` | 警告 | 异常情况但系统可自动恢复 |
| **Error** | `Log.Error()` | 错误 | 需要人工处理的异常 |
| **Fatal** | `Log.Fatal()` | 致命错误 | 导致应用程序崩溃的异常 |

### 级别控制

```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()           // 全局：只记录 Information 及以上
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)  // Microsoft 命名空间只记录 Warning 及以上
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Error)
    .MinimumLevel.Override("MyApp.SensitiveNamespace", LogEventLevel.Verbose)
    .CreateLogger();
```

---

## 七、Enrichers（日志增强器）

Enricher 可以自动向每条日志添加额外的上下文信息。

### 7.1 内置 Enrichers

```csharp
using Serilog.Enrichers;

Log.Logger = new LoggerConfiguration()
    .Enrich.WithMachineName()             // 添加 MachineName
    .Enrich.WithThreadId()                // 添加 ThreadId
    .Enrich.WithProcessId()               // 添加 ProcessId
    .Enrich.WithEnvironmentUserName()     // 添加当前用户名
    .Enrich.WithProperty("Application", "MyApp")  // 自定义固定属性
    .CreateLogger();
```

### 7.2 ASP.NET Core Enrichers

```csharp
// 在 ASP.NET Core 中使用 UseSerilog 时，自动提供以下 Enrichers：
// - RequestId
// - RequestPath
// - CorrelationId
// - UserName（如果已认证）
// - ClientIp
// - UserAgent
```

### 7.3 自定义 Enricher

```csharp
public class TenantEnricher : ILogEventEnricher
{
    private readonly string _tenantId;

    public TenantEnricher(string tenantId)
    {
        _tenantId = tenantId;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("TenantId", _tenantId));
    }
}

// 使用
Log.Logger = new LoggerConfiguration()
    .Enrich.With<TenantEnricher>()
    .CreateLogger();
```

---

## 八、过滤器 (Filters)

精确控制哪些日志被输出。

### 8.1 基本过滤

```csharp
Log.Logger = new LoggerConfiguration()
    .Filter.ByExcluding(logEvent => logEvent.Properties.ContainsKey("Noisy"))
    .Filter.ByIncludingOnly(logEvent => logEvent.Level == LogEventLevel.Error)
    .CreateLogger();
```

### 8.2 按命名空间过滤

```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error)
    .CreateLogger();
```

### 8.3 自定义过滤

```csharp
Log.Logger = new LoggerConfiguration()
    .Filter.ByExcluding(e => 
        e.Level == LogEventLevel.Information && 
        e.Properties.TryGetValue("SourceContext", out var ctx) && 
        ctx.ToString().Contains("HealthCheck"))
    .CreateLogger();
```

---

## 九、使用 appsettings.json 配置

### 9.1 安装配置包

```bash
dotnet add package Serilog.Settings.Configuration
```

### 9.2 appsettings.json

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "System": "Warning"
      }
    },
    "Enrich": [
      "FromLogContext",
      "WithMachineName",
      "WithThreadId"
    ],
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/app.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30,
          "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "Seq",
        "Args": {
          "serverUrl": "http://localhost:5341"
        }
      }
    ],
    "Properties": {
      "Application": "MyApp",
      "Environment": "Production"
    }
  }
}
```

### 9.3 在 Program.cs 中读取配置

```csharp
// 方法一：从 appsettings.json 读取
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

// 方法二：使用 UseSerilog 自动读取（推荐）
builder.Host.UseSerilog((context, config) =>
{
    config.ReadFrom.Configuration(context.Configuration);
});
```

---

## 十、高级特性

### 10.1 日志上下文 (LogContext)

在同一个作用域内临时附加属性：

```csharp
using Serilog.Context;

public void ProcessOrder(int orderId)
{
    // 这个作用域内的所有日志都会自动带上 OrderId 属性
    using (LogContext.PushProperty("OrderId", orderId))
    using (LogContext.PushProperty("UserId", currentUserId))
    {
        Log.Information("开始处理订单");
        // ... 业务逻辑 ...
        Log.Information("订单处理完成");
    }
}
```

### 10.2 审计日志 (Audit Logging)

审计日志是**同步写入**的，确保日志一定会被写入（不会因缓冲或异步而丢失）：

```csharp
Log.Logger = new LoggerConfiguration()
    .AuditTo.File("audit.log")      // 审计日志：同步写入，失败会抛出异常
    .WriteTo.Console()              // 普通日志：异步缓冲
    .CreateLogger();
```

### 10.3 子 Logger

为特定场景创建独立的 Logger 配置：

```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Error)
        .WriteTo.File("errors.log"))
    .WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(e => e.Properties.ContainsKey("Performance"))
        .WriteTo.Seq("http://localhost:5341"))
    .CreateLogger();
```

### 10.4 条件日志 (Conditional Sink)

```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.Conditional(
        evt => evt.Level >= LogEventLevel.Warning,
        wt => wt.File("warnings_and_errors.log"))
    .CreateLogger();
```

### 10.5 记录异常

```csharp
try
{
    // ... 业务代码 ...
}
catch (Exception ex)
{
    // 方式一：传异常对象
    Log.Error(ex, "处理请求时发生错误");

    // 方式二：异常 + 结构化数据
    Log.Error(ex, "处理用户 {UserId} 的请求时发生错误", userId);

    // 方式三：传异常的属性
    Log.Error("错误信息: {ErrorMessage}, 堆栈: {StackTrace}",
        ex.Message, ex.StackTrace);
}
```

### 10.6 性能追踪

```csharp
var sw = Stopwatch.StartNew();

// ... 操作 ...

Log.Information("数据库查询完成，耗时 {ElapsedMs} ms", sw.ElapsedMilliseconds);
```

### 10.7 Serilog + OpenTelemetry

```csharp
// 安装: dotnet add package Serilog.Sinks.OpenTelemetry

Log.Logger = new LoggerConfiguration()
    .WriteTo.OpenTelemetry(options =>
    {
        options.Endpoint = "http://otel-collector:4318/v1/logs";
        options.Protocol = OtlpProtocol.HttpProtobuf;
        options.ResourceAttributes = new Dictionary<string, object>
        {
            ["service.name"] = "MyService"
        };
    })
    .CreateLogger();
```

---

## 十一、性能优化建议

| 建议 | 说明 |
|------|------|
| **使用消息模板，避免字符串插值** | `Log.Info("ID: {Id}", id)` 优于 `Log.Info($"ID: {id}")` |
| **使用异步 Sink** | `WriteTo.Async()` 避免日志 I/O 阻塞业务线程 |
| **控制日志级别** | 生产环境至少设置为 `Information`，避免过多的 Debug 日志 |
| **合理使用过滤器** | 在配置阶段过滤，而非在业务代码中判断 |
| **控制保留文件数** | 设置 `retainedFileCountLimit` 避免磁盘被日志占满 |
| **使用缓冲 Sink** | 如 `Serilog.Sinks.File` 默认就有缓冲，避免频繁写入 |

---

## 十二、与第三方日志框架对比

| 特性 | Serilog | NLog | log4net |
|------|---------|------|---------|
| **结构化日志** | ✅ 原生支持 | ✅ 支持 | ❌ 有限支持 |
| **Sink 数量** | 多（100+） | 多 | 一般 |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **社区活跃度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **ASP.NET Core 集成** | ✅ 最佳支持 | ✅ 支持 | ⚠️ 需额外配置 |
| **配置方式** | 代码 / JSON | XML / JSON | XML |
| **学习成本** | 低 | 中 | 中 |

---

## 十三、最佳实践总结

1. **始终使用结构化日志**：用 `{属性名}` 模板，不要字符串拼接
2. **选择合适的日志级别**：开发用 Debug/Verbose，生产用 Information
3. **使用 LogContext**：在请求链中自动传递上下文
4. **配置多种 Sink**：开发环境输出到控制台，生产环境输出到文件 + Seq/Elasticsearch
5. **善用 Enricher**：自动注入机器名、请求ID等上下文
6. **注意性能**：使用异步 Sink，生产环境关闭 Verbose/Debug
7. **记得 `CloseAndFlush()`**：确保程序退出前所有日志都已写入
8. **敏感信息脱敏**：不要在日志中记录密码、Token 等敏感信息

---

## 十四、完整示例

```csharp
// Program.cs - 完整的 ASP.NET Core 配置示例
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Hosting", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .Enrich.WithProperty("Application", "MyWebApp")
    .WriteTo.Console(outputTemplate:
        "{Timestamp:HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/app.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.Seq("http://localhost:5341")
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();
    
    var app = builder.Build();
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "主机意外终止");
}
finally
{
    Log.CloseAndFlush();
}
```

---

> **参考资源**
>
> - [Serilog 官方文档](https://serilog.net/)
> - [Serilog GitHub](https://github.com/serilog/serilog)
> - [Seq - 结构化日志服务器](https://datalust.co/seq)
