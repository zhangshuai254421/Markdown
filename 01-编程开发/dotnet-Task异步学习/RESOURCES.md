# .NET Task / 异步编程 Resources

## Knowledge

- [Microsoft Learn:Task-based Asynchronous Pattern (TAP)](https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
  官方异步编程模式的权威规范。Use for:Task API 设计约定、异常/取消/进度的官方处理方式。
- [Microsoft Learn:TaskCompletionSource<TResult> API 文档](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.taskcompletionsource-1)
  TCS 官方 API 参考。Use for:Set*/TrySet* 精确语义、构造参数(TaskCreationOptions)细节。
- [Stephen Toub:How async/await really works(Async/Await FAQ)](https://devblogs.microsoft.com/dotnet/how-async-await-really-works/)
  .NET 团队核心架构师写的 await 机制长文,面试深度的最佳单一来源。Use for:状态机、SynchronizationContext、ConfigureAwait 的准确解释。
- [Stephen Toub:ConfigureAwait FAQ](https://devblogs.microsoft.com/dotnet/configureawait-faq/)
  ConfigureAwait 的权威问答。Use for:"不传染""只管续延去向"的精确语义、库/应用层规范依据、sync-over-async 死锁细节。
- [Stephen Cleary 博客](https://blog.stephencleary.com/)
  异步领域被引用最多的独立作者(《Concurrency in C# Cookbook》作者)。Use for:死锁机制、sync-over-async、Task 组合器实践。
- [Stephen Cleary:Asynchronous Lazy Initialization](https://blog.stephencleary.com/2012/08/asynchronous-lazy-initialization.html)
  异步初始化模式的奠基文章,含 AsyncLazy 实现与取舍。Use for:单飞初始化、Lazy&lt;Task&lt;T&gt;&gt; 对比。
- [Microsoft Learn:C# 异步编程文档枢纽](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)
  官方异步主题总入口,含 Task、取消、异常处理各子页。Use for:查漏、官方示例代码。
- [Microsoft Learn:Task.WaitAsync API](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.waitasync)
  WaitAsync 三个重载与超时/取消异常语义的官方参考(.NET 6+)。Use for:超时模式的 API 细节。
- [Microsoft Learn:TaskStatus 枚举](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.taskstatus)
  Task 八种状态的官方定义。Use for:状态语义、Is* 属性映射的权威依据。
- [Microsoft Learn:托管线程中的取消](https://learn.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads)
  CancellationToken 传播的官方模式指南。Use for:令牌贯穿、取消与超时的异常辨析。
- [Microsoft Learn:托管线程池](https://learn.microsoft.com/en-us/dotnet/standard/threading/the-managed-thread-pool)
  线程池结构官方说明。Use for:全局/本地队列、worker 行为、SetMinThreads 与补充机制。
- [Stephen Cleary:Task.Run Etiquette and Proper Usage](https://blog.stephencleary.com/2013/11/taskrun-etiquette-and-proper-usage.html)
  Task.Run 使用礼仪的经典文章。Use for:库/应用/服务端三层判决、Task.Run 不该用的场景清单。
- [Stephen Toub:Understanding the Whys, Whats, and Whens of ValueTask](https://devblogs.microsoft.com/dotnet/understanding-the-whys-whats-and-whens-of-valuetask/)
  ValueTask 权威长文。Use for:零分配原理、只能 await 一次的精确边界、IValueTaskSource。
- [Stephen Toub:Task.Run vs Task.Factory.StartNew](https://devblogs.microsoft.com/dotnet/task-run-vs-task-factory-startnew/)
  两工厂分野的权威说明。Use for:StartNew 不解包嵌套欠条的历史原因、Unwrap 的来龙去脉。
- [Microsoft Learn:Task.WhenAll API](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.whenall)
  WhenAll 官方语义。Use for:结果顺序、异常聚合、部分失败的权威表述。
- [Microsoft Learn:ExceptionDispatchInfo API](https://learn.microsoft.com/en-us/dotnet/api/system.runtime.exceptionservices.exceptiondispatchinfo)
  EDI 官方参考:Capture 冻结原始堆栈、Throw 原样重抛。Use for:异常保存与异地重抛、Task 故障重抛不失真的机制依据。
- [dotnet/aspnetcore:SignalR 客户端 InvocationRequest.cs](https://github.com/dotnet/aspnetcore/blob/main/src/SignalR/clients/csharp/Client.Core/Internal/InvocationRequest.cs)
  工业级 TCS 用法(路径 2026-10-25 已验证):`TaskCompletionSource<object?>` + `RunContinuationsAsynchronously` 构造、取消注册。Use for:0002 坑①的真实源码证据、0011 精读主菜。
- [dotnet/aspnetcore:SignalR 客户端 HubConnection.cs](https://github.com/dotnet/aspnetcore/blob/main/src/SignalR/clients/csharp/Client.Core/src/HubConnection.cs)
  客户端总指挥:invoke 发起、消息处理、断线广播(路径已验证)。Use for:欠条编号/挂号处/广播终态的完整上下文。
- [dotnet/runtime:TaskCompletionSource.cs 源码](https://github.com/dotnet/runtime/blob/main/src/libraries/System.Private.CoreLib/src/System/Threading/Tasks/TaskCompletionSource.cs)
  TCS 类型本体,官方注释"producer side of a Task"(路径按同构推定,△)。Use for:读懂我们学了一整课的类型。

## Wisdom (Communities)

- [Stack Overflow — c# + async-await 标签](https://stackoverflow.com/questions/tagged/c%23+async-await)
  异步疑难杂症最大的问答库,Stephen Cleary 本人在此长期答题。Use for:具体报错、边界行为求证。
- [r/dotnet](https://www.reddit.com/r/dotnet/)
  高活跃 .NET 社区。Use for:了解社区对某个模式的真实评价、新特性讨论。
- [dotnet/runtime GitHub Discussions](https://github.com/dotnet/runtime/discussions)
  BCL 团队亲自答疑的地方。Use for:"为什么 API 这样设计"级别的官方说明。
- 中文社区:博客园 .NET 区
  中文高质量 .NET 文章聚集地。Use for:中文视角的概念讲解与实战记录。

## Gaps
- (已补,2026-10-25)SignalR 客户端 TCS 实战链接 → 已入 Knowledge 三条 + reference/source-reading-速查卡.html;ClientResultsManager.cs 的 aspnetcore 精确路径与 TaskCompletionSource.cs 路径仍标 △,核链需在可直连 GitHub 的网络下用符号搜索二次确认。
- 混合取消+故障的 WhenAll 合成欠条终态规则(0009 遗留)——仍无权威出处,待动手实验或问 dotnet/runtime Discussions。
