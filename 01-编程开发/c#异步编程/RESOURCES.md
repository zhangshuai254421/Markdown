# C# 异步编程 Resources

## Knowledge

- [Article: "There Is No Thread" — Stephen Cleary](https://blog.stephencleary.com/2013/11/there-is-no-thread.html)
  async 的「不二法门」：真正的异步 I/O 在等待期间没有线程被占用。理解续延与 Task 心智模型的第一篇文章。

- [Article: "How Async/Await Really Works in C#" — Stephen Toub (.NET Blog)](https://devblogs.microsoft.com/dotnet/how-async-await-really-works/)
  async 方法被编译器改写成状态机的权威深潜：IAsyncStateMachine、builder、ExecutionContext。是「读懂底层」的主文本。

- [Article: "Async and Await" — Stephen Cleary](https://blog.stephencleary.com/2012/02/async-and-await.html)
  Cleary 的 async 入门经典，讲清 async 方法、await、Task 的基本语义。适合复习对照。

- [Article: "Don't Block on Async Code" — Stephen Cleary](https://blog.stephencleary.com/2012/07/dont-block-on-async-code.html)
  死锁的成因与两条防线（ConfigureAwait(false) + async all the way down）。诊断死锁 bug 必读。

- [Article: "ConfigureAwait FAQ" — Stephen Toub (.NET Blog)](https://devblogs.microsoft.com/dotnet/configureawait-faq/)
  ConfigureAwait 到底改了什么、什么时候该用/不该用。到 SynchronizationContext 那几课会用到。

- [Guide: "Async Guidance" — David Fowler (AspNetCoreDiagnosticScenarios)](https://github.com/davidfowl/AspNetCoreDiagnosticScenarios/blob/master/AsyncGuidance.md)
  实战戒律：async void 为什么是雷、Task.Run 的误用、ContinueWith 的陷阱。来自微软 ASP.NET 团队的真实案例。

- [Docs: "Asynchronous programming with async and await" — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)
  官方 C# 异步入门文档，作为术语与 API 的权威对照。

- [Book: "Concurrency in C# Cookbook" (2nd ed.) — Stephen Cleary (O'Reilly)](https://www.oreilly.com/library/view/concurrency-in-c/9798341650060/)
  系统性的并发/异步食谱书，覆盖 async、异步流、并行、取消、线程池。想系统化时翻它。

## Wisdom (Communities)

- [Stack Overflow — 标签 `c# async-await`](https://stackoverflow.com/questions/tagged/async-await+c%23)
  高质量 Q&A，死锁、异常、ConfigureAwait 的具体案例极多；Cleary、Toub 常亲自下场。

- [r/dotnet](https://www.reddit.com/r/dotnet/)
  .NET 社区主阵地。遇到「最佳实践分歧」时看多方观点。

- [.NET Discord](https://discord.gg/dotnet)
  实时提问，适合快速确认某个具体行为。
