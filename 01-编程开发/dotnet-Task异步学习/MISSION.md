# Mission:.NET Task 系统与 TaskCompletionSource

## Why
用户是有多年经验的 .NET 开发者,async/await 一直停留在"会用"层面。目标:把 Task 体系学通透——能读懂框架与开源库源码里的异步代码(如 SignalR、ASP.NET Core),能独立解决工作中的真实异步需求(回调转 Task、超时控制、事件桥接),并能从容应对高级岗位的异步面试题。

## Success looks like
- 看到任何 TaskCompletionSource 用法,能立刻说清:谁在等、谁负责完成、完成后代码在哪个线程继续
- 能亲手把回调式 / 事件式 API 包装成干净的 awaitable Task API
- 能完整讲清 await 的生命周期:编译器状态机、SynchronizationContext、ConfigureAwait、线程池调度
- 能诊断并修复典型异步 bug:sync-over-async 死锁、未完成 Task 的悬挂与泄漏、异常被吞
- 面试被问"Task 是什么 / 和线程什么关系 / 异步死锁怎么发生"时,能给出有层次的准确回答

## Constraints
- 每天 15–30 分钟碎片时间 → 每课短小自包含,末尾配间隔复习钩子
- 授课语言:中文;代码、术语保留英文原文
- 基线:日常熟练 await;线程池 / ConfigureAwait / 死锁"听过但没通透"(见 learning-records/0001)

## Out of scope(现阶段)
- dotnet/runtime 内部源码逐行精读(Task.cs 实现)——先建心智模型,后期按需深入
- PLINQ / Parallel、System.Threading.Channels、Pipelines 等相邻技术
- 其他语言异步模型(Node.js 事件循环、Rust async)的横向对比
