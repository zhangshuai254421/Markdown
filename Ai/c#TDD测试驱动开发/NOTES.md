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
