# Mission: C# 异步编程（async/await）

## Why
做了 8 年 C#，async/await 天天写，却「用得动、说不清」——底层到底怎么跑、为什么会死锁、什么场景该怎么写，心里始终没底。目标是补上这块长期缺位的心智模型，从 .NET Framework 的异步演进一路走到现在的 async/await，把异步从「会写」变成「真正懂」，让诊断 bug、写库代码、评审时都能笃定地下判断。

## Success looks like
- 能一句话说清 `await` 到底做了什么（续延而非线程），并判断一段异步代码会跑在哪些线程上
- 能预测并规避经典异步坑：死锁、fire-and-forget、异常被吞、`ConfigureAwait` 用错
- 能读懂编译器为 async 方法生成的状态机，并解释 Task / ValueTask / 异步流 / SynchronizationContext 的差异
- 能给同事讲明白异步，做自信的 code review

## Constraints
- 8 年 C# 经验，不需要从零讲语言基础
- 自定节奏，多会话推进
- 要求深入到时运行时内部：SynchronizationContext、TaskScheduler、线程池、IValueTaskSource、异步流

## Out of scope
- 其他语言的异步模型（JS Promise、Go goroutine 等），除非作为对照
- 与异步无关的并行/多线程专题（Parallel、PLINQ、lock 底层），仅在解释 TaskScheduler/线程池时顺带提及
