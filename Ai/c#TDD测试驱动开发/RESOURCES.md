# C# TDD Resources

## Knowledge

- [Book: "Test-Driven Development: By Example" — Kent Beck (Addison-Wesley, 2002)](https://www.oreilly.com/library/view/test-driven-development/9780321146533/)
  TDD 的源头之书。红绿重构、Fake It / Triangulation / Obvious Implementation 三种到绿策略，全部出自这里。课程的「原著优先」主文本。

- [Bliki: "TestDrivenDefinition" — Martin Fowler](https://martinfowler.com/bliki/TestDrivenDefinition.html)
  TDD 的最短权威定义：三条规则 + 红绿重构节奏，并澄清 TDD 的目的是设计活动而非单纯测试。第一课的锚点文献。

- [Book: "Clean Code" 第 9 章「单元测试」— Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
  用户已读过的书。第 9 章给出 TDD 三条铁律，课程直接引用作为纪律来源。

- [Docs: "Getting Started with xUnit.net"](https://xunit.net/docs/getting-started)
  官方入门：`dotnet new xunit`、`dotnet test`、Fact/Theory 的权威出处。xUnit 用法一律以此为准。

- [Docs: "Unit testing C# with NUnit and xUnit" — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-dotnet-test)
  `dotnet test` 的官方文档，测试项目结构与 CLI 用法的权威对照。

- [Book: "The Art of Unit Testing" (3rd ed.) — Roy Osherove (Manning)](https://www.manning.com/books/the-art-of-unit-testing-third-edition)
  到「测什么、怎么隔离依赖」阶段（stub/mock、测试可维护性）的主文本，第 4-5 课之后启用。

## Wisdom (Communities)

- [Stack Overflow — 标签 `c# unit-testing`](https://stackoverflow.com/questions/tagged/c%23+unit-testing)
  xUnit 具体用法、断言写法的高质量问答池。

- [r/dotnet](https://www.reddit.com/r/dotnet/)
  .NET 社区主阵地；「TDD 到底值不值」「怎么向团队推」这类讨论的多方观点都在这里。

- [.NET Discord](https://discord.gg/dotnet)
  实时提问渠道，适合快速确认某个 xUnit 具体行为。
