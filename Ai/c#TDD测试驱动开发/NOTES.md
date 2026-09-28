# Notes

教学工作笔记，供未来会话参考。

- **语言**：中文授课；技术术语保留英文并附中文（RED/GREEN/REFACTOR、Fact、Theory、assertion）。
- **起点**：8 年 C#，读过《代码整洁之道》知道 TDD，写过零散测试但从不先写；TDD 零实战。
- **动机**（2026-09-24 确认，用户全选）：重构更有底气、减少 bug 返工、设计更清晰、团队推广/面试。四条动机都成立，课程里轮流呼应。
- **框架**：xUnit（用户选定），所有示例统一用 xUnit，不混用 NUnit/MSTest。
- **练习场**：课程内练习为主，用户明确不急着上真实项目；每课的「课后作业」就是练习场，不要过早推工作项目。
- **产出节奏**：每课一个 HTML（`lessons/`），共享 `assets/style.css` 与 `assets/quiz.js`（自 c#异步编程 课程复制沿用）；核心循环参考卡在 `reference/red-green-refactor.html`。术语表暂并入参考卡，课程多了再拆 `reference/glossary.html`。
- **打开课程**：`cmd.exe //c start "" "<lesson 的绝对路径>"`（explorer.exe 在此环境不可靠）。
- **示例领域**：优先串口帧、协议解析、校验和、设备指令等工业场景；WPF/ViewModel 测试等讲到依赖与边界时再用。
- **资源验证**：本环境 WebFetch 被网络策略拦截，RESOURCES.md 中的链接来自训练知识（均为多年稳定的经典来源），待用户环境确认可达性。
- **进展**（09-28 记录，详见 learning-records/0001）：纯函数循环已打通（XorChecksum/Parse/Theory 均独立完成）；第 2 课作业 ToHexString 未做，已在第 3 课作业里回收。第 3 课进入隐藏依赖与接缝（seam），示例用 FrameSender/IFrameChannel（串口背景）。
- **作业策略**：用户作业完成度约 80%，把未完成作业「回收」进下一课作业比单独催更有效。
- **进展**（第 4 课时）：第 3 课核心作业完成（FrameSender/IFrameChannel/RecordingChannel，照骨架复现）；ToHexString 连跳两课，已放弃催收，其教学价值由正文覆盖；开放式「想一想」也未带回。见 learning-records/0002。
- **框架选型**：mock 框架定 NSubstitute（语法友好、社区主流；Moq 只提一句）。
- **第 5 课计划**：转向真实项目——挑第一块 TDD 试验田 + 回应「写测试太慢」质疑（兑现团队推广/面试动机）。
- **进展**（第 5 课时）：TrySend 已按对话引导完成（含注释照抄）；Send→TrySend 的消除重复一拍未做，不再列入作业。第 5 课为毕业课：选田三问 + FrameCutter（粘包/半包）三圈示范 + 推广话术；毕业答辩 = 用户把工作项目的第一块试验田签名和第一个红灯贴回对话。
- **答辩预案**：若工作项目保密/不便贴代码，备选：SECS 报文头解析、报警条件判断、超时重发策略——都在其领域内。
