# Notes

教学过程中的工作笔记，供未来会话参考。

- **语言**：用中文写课程与讲解；技术术语保留英文并附中文（Task、continuation、state machine）。
- **起点**：8 年 C# 老兵，能写 async 但「说不清」。跳过语法入门，直接讲心智模型与底层。
- **深度**：要求直抵运行时内部（SynchronizationContext、TaskScheduler、线程池、ValueTask/IValueTaskSource、异步流）。
- **产出节奏**：每课一个 HTML（`lessons/`），共享样式 `assets/style.css` 与测验组件 `assets/quiz.js`；术语统一进 `reference/glossary.html`。
- **课程主线索**：从 .NET Framework 的历史演进 → 现代 async/await，历史与底层交织推进。
- 打开课程用：`cmd.exe //c start "" "<lesson 的绝对路径>"`（explorer.exe 在此环境不可靠）。

## 用户领域背景

- **工业硬件方向**：激光器、串口（COM/SerialPort）通讯、SECS 协议；设备「发指令→回报文」的请求响应模式，可能主动上报。
- **UI 技术栈**：WPF（仓库里有 WPF-Prism 目录），关心「按钮不阻塞」这类 UI 线程问题。
- 举例优先用：串口收发、设备指令、UI 按钮、工业通讯场景，别用纯 Web/CRUD 例子。
