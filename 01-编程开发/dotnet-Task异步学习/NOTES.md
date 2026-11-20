# NOTES(教学工作区备忘)

## 用户画像与偏好
- 多年 .NET 经验;async/await"会用",机制自评"皮毛"级(知道线程池/ConfigureAwait/死锁现象,未系统梳理)
- 动机四合一:读源码 + 解决工作问题 + 系统补课 + 面试准备 → 每课尽量同时标注【面试高频】【源码视角】两个视角
- 每天 15–30 分钟 → 单课 15–30 分钟内可完成;每课末尾给"间隔复习钩子"
- 授课语言:中文;术语与代码保留英文
- 工作区在仓库子目录 `01-编程开发/dotnet-Task异步学习/`,不污染仓库根目录;仓库根 README 索引未经允许不动
- 不要自动用浏览器命令打开课程页面,给出文件路径即可(用户曾拒绝 Start-Process)
- 每课结尾必须有"下一课"直达跳转链接,页脚提供"上一课 · 目录 · 下一课"导航;lessons/index.html 是课程目录枢纽。交付新课时的固定动作:回填上一课的"下一课"链接
- 用户以"下一课"自学节奏推进,不在终端反馈检索成绩——不阻塞、不追问;隔日内嵌测验即为主要检索反馈循环,每课最多用一句话轻提复盘

## 课程路线图(按 ZPD 排序,随进度调整)
1. ✅ 0001 Task 的本质:欠条的两半 + TaskCompletionSource 初见(回调→Task 桥接)
2. ✅ 0002 TCS 三板斧:Set*/Try* 全家福、单次完成语义、RunContinuationsAsynchronously
3. ✅ 0003 经典模式:超时控制(手写 TCS+Timer,对比 .NET 6 的 .WaitAsync)
4. ✅ 0004 经典模式:事件流→Task、异步初始化(AsyncLazy)
5. ✅ 0005 Task 状态机与生命周期(Created / WaitingForActivation / RanToCompletion / Faulted / Canceled)
6. ✅ 0006 await 编译期真相:手写还原状态机骨架
7. ✅ 0007 SynchronizationContext 与 ConfigureAwait(异步死锁解剖)
8. ✅ 0008 线程池调度:Task.Run 的适用边界、IO-bound vs CPU-bound、ValueTask 初识
9. ✅ 0009 Task 组合器:WhenAll / WhenAny / Delay / Unwrap
10. ✅ 0010 异常处理全景:AggregateException、ExceptionDispatchInfo、await 的解包行为
11. ✅ 0011 源码阅读实战:精读一处 SignalR / ASP.NET Core 的 TCS 用法
12. ✅ 0012 面试专题:异步死锁、sync-over-async、Task vs Thread vs ValueTask(毕业课,12/12 完结)

## 教学决策记录
- 2026-10-22:工作区建立。用户点名要学 TCS;但首课先补"Task=欠条"心智模型再引出 TCS,否则只是 API 背诵。首课交付:欠条两半模型 + 交互模拟器 + 回调桥接模板 + 检索练习。
- 2026-10-23:交付 0002(Set* vs Try* 决策 + 竞态模拟器 + RunContinuationsAsynchronously + 升级版桥接模板)。新组件 assets/race-simulator.js(0003 超时课将复用);速查卡已同步竞态决策。注意:用户对 0001 的掌握尚无证据——隔日检索热身已内嵌在 0002 开头,待用户反馈作答情况后写学习记录。
- 2026-10-23(第二课):交付 0003(超时控制:三式演化 + WaitAsync + 超时≠取消)。新组件 assets/timeline-simulator.js(弃等 vs 真中止可视化,后续取消相关课可复用);新增 reference/timeout-速查卡.html。用户连续两课未反馈热身检索成绩,学习记录仍空缺;下次交付时应更明确地索要作答结果(或请用户口头复述),否则 ZPD 校准一直靠假设。
- 2026-10-23(反馈):用户要求每课结尾加"下一课"跳转链接 → 已回填 0001/0002,页脚统一为"上一课 · 目录 · 下一课"导航;新建 lessons/index.html 课程目录枢纽(含 12 课路线图与速查卡入口)。0003→0004 链接待 0004 交付时回填。此为长期固定流程。
- 2026-10-23(第三课):交付 0004(事件→Task 四步骨架 + 单飞异步初始化)。新组件 assets/event-race-simulator.js;新增 reference/event-init-速查卡.html;已回填 0003→0004 链接与 index 目录(4/12)。用户三课未反馈成绩,正式确立:检索循环内嵌于课程页,不再向用户索要反馈。
- 2026-10-24:交付 0005(Task 状态机:三区八状态 + OCE→Canceled 分界 + 生产诊断三态表)。新组件 assets/state-machine-explorer.js(数据驱动,后续课可复用);新增 reference/task-status-速查卡.html。进度 5/12。注意:0005 课内已预埋 0006 链接,文件名必须为 0006-await-compiler-state-machine.html;OCE 令牌匹配的边角规则课上仅点到"值得动手验证",未下断言。
- 2026-10-24(第二课):交付 0006(await 编译期真相:源码↔状态机骨架对照 + MoveNext 单步播放器慢/快双路径;异常通道 SetException 的 OCE→Canceled 实现位置呼应 0005)。新组件 assets/state-machine-stepper.js(数据驱动可复用);course.css 增补 .asm-* 播放器样式与 .kw/.str 代码着色;新增 reference/await-state-machine-速查卡.html。进度 6/12。补记:发现 index 速查卡区此前漏登 event-init 与 task-status 两张卡,已一并补全。0006 已预埋 0007 链接,文件名必须为 0007-synccontext-and-deadlock.html。
- 2026-10-24(第三课):交付 0007(SyncContext 与 ConfigureAwait:上下文一览 + 死锁环四节点解剖 + 三条防死锁纪律 + ConfigureAwait 三事实)。新组件 assets/deadlock-loop.js(死锁环播放器,死锁/破环双场景对照);course.css 增补 .dl-* 样式;新增 reference/configureawait-速查卡.html(含 ASP.NET classic 的 HttpContext.Current 丢失坑);RESOURCES 增补 Toub《ConfigureAwait FAQ》。进度 7/12。教学注意:0006 讲"续延默认内联",0007 以"补条件而非打脸"方式精确化(无上下文才内联),后续课沿用同一口径。0007 已预埋 0008 链接,文件名必须为 0008-threadpool-taskrun-valuetask.html。
- 2026-10-24(第四课):交付 0008(线程池:结构四件套 + IO/CPU 判决尺 + Task.Run 三不 + 饥饿模拟器三场景 + ValueTask 初识三纪律)。新组件 assets/pool-simulator.js(工人/队列账本模拟,后续并发课可复用);course.css 增补 .ps-* 样式;新增 reference/threadpool-taskrun-速查卡.html;RESOURCES 增补托管线程池、Cleary Task.Run Etiquette、Toub ValueTask 三条。补记:修正 deadlock-loop.js 误用的 ln-bad → ln-err。兑现欠账:0005 的 WaitingToRun/饥饿预告、0007 的"烧两工人"账本均在本课闭环。进度 8/12。0008 已预埋 0009 链接,文件名必须为 0009-task-combinators.html。
- 2026-10-24(第五课):交付 0009(组合器:串行陷阱"先发起后聚合" + WhenAll 三事实 + WhenAny 竞速模板与两陷阱 + Delay/Unwrap 与 StartNew 嵌套坑 + 实验室四场景)。新组件 assets/combinator-lab.js(时间条结算可视化,WhenAll/WhenAny 双模式);course.css 增补 .cb-* 样式;新增 reference/combinators-速查卡.html;RESOURCES 增补 Toub StartNew 对比文与 WhenAll API。连回:0003 超时模式(WhenAny 地基兑现)、0008 Task.Run 内置解包伏笔。遗留:混合取消+故障的 WhenAll 终态边角,速查卡标注"动手验证/问老师"。进度 9/12。0009 已预埋 0010 链接,文件名必须为 0010-exception-handling-panorama.html。
- 2026-10-25(批量交付):应用户显式要求"把后面的所有课程都生成",一次性生成 0010/0011/0012 三课三卡,课程 12/12 完结。① 0010 异常全景(两套规则表 + WhenAll 三步拆包模板 + throw/throw ex/EDI/when 四写法对比 + 五条异常纪律)+ reference/exceptions-速查卡.html;0009 遗留的"混合取消+故障 WhenAll 终态"仍未断言,0010 问老师框中保留该提问。② 0011 源码精读实战(三步法:定位/翻译/审问 + SignalR 实战地图 + 5 道寻宝作业)+ reference/source-reading-速查卡.html;链接当日经 WebSearch 验证——HubConnection.cs 路径(Client.Core/src/)与 InvocationRequest.cs 的 TCS+RunContinuationsAsynchronously 构造均确认;ClientResultsManager.cs(aspnetcore common/Shared)仅符号确认、路径标注"以仓库搜索为准";TaskCompletionSource.cs 按 TaskCache.cs 同构推定,卡上标注 △。注意:raw.githubusercontent 与 github.com 的 WebFetch、curl 出网均被环境拦截,验证只能靠 WebSearch——后续核链沿用此路径。RESOURCES 的 Gaps(SignalR TCS 链接)已补。③ 0012 面试毕业课(三段式答法 + 三大题 60 秒脚本 + 十问快答 + 六题大回环综合测验 + 毕业检查单 + D+1/3/7/14 复习日历;next-up 框改造成"课程完结·三个去处")+ reference/interview-速查卡.html。index 更新至 12/12 含毕业标识。后续:用户若反馈 0012 综合测验或三大题答辩结果,据此写首份学习记录 learning-records/0002。文件名链锁定完结:0011=source-reading-signalr-tcs,0012=interview-special-topics(均已兑现,无欠账)。
