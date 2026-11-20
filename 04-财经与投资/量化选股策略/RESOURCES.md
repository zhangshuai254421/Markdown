# 量化选股策略 Resources

> 2026-11-18 建立。原则：先中文一手资料，英文原典只作选读；每条都写"何时用"。新课程的知识点从这里取材，不从记忆里编。

## Knowledge

### 总览与因子框架

- [Book：《因子投资：方法与实践》石川、刘洋溢、连祥斌（电子工业出版社，2020）](https://m.winxuan.com/product/1202124453)
  中文因子投资第一本系统著作，且用 A 股数据做实证。**本课程主参考**。Use for：第 1 课因子地图；第 3-8 课逐个因子；第 9-11 课多因子、评估与归因。重点章：第 3 章（规模/价值/动量/盈利/投资/换手）、第 4 章（多因子模型）、第 5 章（异象，含低波）、第 7 章（实践）。
- [Book：《主动投资组合管理》Grinold & Kahn](https://www.wiley.com/en-us/Active+Portfolio+Management%3A+A+Quantitative+Approach+to+Producing+Superior+Returns%2C+5th+Edition-p-9780071376957)
  组合构建与风险模型的经典。**进阶，暂不要求通读**；第 9-11 课需要"组合优化/风险暴露"直觉时再查。
- [课程先修：《量化交易入门》](../量化交易入门/)
  回测五要素、成本、A 股物理、双均线、因子入门都在这里。Use for：补基础；第 1 课会直接引用它的第 8、10 课。

### 学术原典（英文，选读）

- [Fama & French (1993), Common Risk Factors in the Returns on Stocks and Bonds](https://www.jstor.org/stable/2329112)
  价值（HML）与规模（SMB）因子的源头。Use for：第 3、6 课理解"价值/小市值"为什么被当成风险因子。
- [Fama & French (2015), A Five-Factor Asset Pricing Model](https://www.sciencedirect.com/science/article/pii/S0304405X14002323)
  加入盈利（RMW）与投资（CMA）后的五因子模型。Use for：第 4 课"质量"因子的学术位置。
- [Jegadeesh & Titman (1993), Returns to Buying Winners and Selling Losers](https://www.jstor.org/stable/2328882)
  12-1 月动量的经典证据。Use for：第 5 课动量；注意 A 股与美股的差异。
- [Jegadeesh (1990), Evidence of Predictable Behavior of Security Returns](https://www.jstor.org/stable/2328812)
  短期反转的经典证据。Use for：第 5 课"为什么 A 股短期反转更强"。
- [Ang, Hodrick, Xing & Zhang (2006), The Cross-Section of Volatility and Expected Returns](https://www.nber.org/papers/w11353)
  低波异象。Use for：第 6 课低波策略。
- [Novy-Marx (2013), The Other Side of Value: The Gross Profitability Premium](https://www.sciencedirect.com/science/article/pii/S0304405X13001055)
  毛利/盈利能力因子。Use for：第 4 课质量因子。
- [Sloan (1996), Do Stock Prices Fully Reflect Information in Accruals and Cash Flows?](https://www.jstor.org/stable/248290)
  应计异象，质量因子的另一条腿。Use for：第 4 课"利润含金量"。
- [AQR: Fact, Fiction, and Factor Investing](https://www.aqr.com/Insights/Research/Journal-Article/Fact-Fiction-and-Factor-Investing)
  因子投资的常见误解与反驳。Use for：第 1、11 课"因子不是印钞机"的反面论证。

### 中文实务与 A 股证据

- [中信证券：2025 上半年量化选股策略组合盘点及展望](https://finance.sina.cn/2025-07-09/detail-infevnya1639699.d.html)
  九类全市场选股策略（预期风险、预期边际改善、高质量经营、红利低波、自由现金流、科技研发、价值洼地、GARP、PB-ROE）与风格轮动。Use for：第 1 课策略家族地图、第 12 课策略组合/轮动。
- [华福证券：因子动量和反转特征下的动态调整思路](http://m.hibor.com.cn/wap_detail.aspx?id=fe1afa3e33b46d3f9ebfca8d51233472)
  小盘/大盘池里因子有效性的差异，动量与反转的窗口。Use for：第 5、6、10 课 A 股风格与因子失效。
- [中金：被动化趋势下的量化投资](https://finance.sina.cn/2025-02-21/detail-inemezhi2971282.d.html)
  被动资金流与价值/质量/反转/低波因子收益的相关性。Use for：第 10-12 课因子拥挤与风格环境。
- [PandaAI 社区：A 股因子挖掘讨论](https://www.pandaaiquant.com/community/post/957)
  社区级"价值+质量+低波"组合与 A 股动量/反转差异的讨论。**社区观点，非学术证据**；Use for：第 1 课建立假设，不当作结论。

### 数据与工具

- [AKShare 官方文档](https://akshare.akfamily.xyz/)
  免费 A 股行情/财务数据接口。Use for：导出横截面面板 CSV；注意接口限频与字段口径。
- [Tushare 官方文档](https://tushare.pro/document/2)
  财务数据质量较高（积分制）。Use for：需要更干净的 ROE/营收/利润数据时。
- [掘金量化 C# SDK 文档](../量化交易入门/reference/myquant-csharp-cheatsheet.html)
  平台验证与模拟盘。Use for：第 2、12 课的掘金对照；横截面引擎仍以自建 C# 为主。
- [《量化交易入门》R2 回测自查清单](../量化交易入门/reference/backtest-checklist.html)
  五宗罪与稳健性测试。Use for：第 9-11 课每次回测前逐条过。

## Wisdom (Communities)

- [掘金量化社区](https://bbs.myquant.cn)
  中文平台/SDK 问答。Use for：掘金数据接口、回测参数、实盘接入问题。
- [聚宽社区](https://www.joinquant.com/community)
  中文策略分享与因子讨论。Use for：读公开选股策略、练归因；注意区分"晒收益"和"可复现"。
- [集思录](https://www.jisilu.cn)
  A 股低风险与 ETF 讨论。Use for：红利/低波/可转债等防守策略的现实检验。
- [Quant StackExchange](https://quant.stackexchange.com)
  英文硬核问答。Use for：因子统计、IC/IR、组合构建的概念问题（英文，可选）。

## Gaps

- **C# 横截面选股引擎的中文教程几乎为零**——本课程自建，代码会放在 `lessons/` 与 `CsharpCodeSource/`。
- A 股**退市股/ST/停牌/财务重述**的干净历史数据难免费获得；第 9 课会专项处理，需要提前检索数据源。
- 因子拥挤/失效的中文实证多为券商研报，缺少公开可复现的数据集；第 10-12 课以"方法论 + 自己复现"为主。
- 石川书中"A 股实证"的代码未公开；本课程用 AKShare/Tushare 自己重建，结果不会与书中数字逐一相同。
