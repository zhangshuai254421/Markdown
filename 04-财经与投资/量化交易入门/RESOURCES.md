# 量化交易（A股 · 个人 · C#）Resources

> 2026-11-04 经网络检索建立；所有条目带"何时用"。新课程的知识点从这里取材，不从记忆里编。
>
> **课程主平台（2026-11-06 起）**：掘金量化（MyQuant，myquant.cn），C# SDK。QuantConnect / LEAN / Backtrader 已从课程路径移除，只在需要"平台无关"的概念对照时口头提及。

## Knowledge

- [Book：《打开量化投资的黑箱》Rishi Narang（里什·K·纳兰）](https://www.getabstract.com/zh/%E6%91%98%E8%A6%81/%E6%89%93%E5%BC%80%E9%87%8F%E5%8C%96%E6%8A%95%E8%B5%84%E7%9A%84%E9%BB%91%E7%AE%B1/21036)
  专业量化基金如何运作：Alpha 模型、风险模型、执行系统、交易成本。入门第一本，建全景认知。
- [Book：《量化交易：自己动手做算法交易》Ernest Chan（陈勤）](https://xquant.shop/p/2026-09-09-quant-books-list)
  个人算法交易实操经典：回测方法论、风控、自动化执行。本课程回测部分的**主参考**。
- [Book：《因子投资：方法与实践》石川 等](https://waylandz.com/quant-book/%E9%87%8F%E5%8C%96%E6%8E%A8%E8%8D%90%E4%B9%A6%E5%8D%95)
  中文因子研究方法论。中期课程（因子入门）的主参考。书单见 waylandz《2026 量化交易入门书单》。
- [掘金量化官网（终端下载）](https://www.myquant.cn/terminal)
  课程主平台。Windows 终端 + 策略研究/回测/仿真/实盘全链路；基础版提供免费投研数据，C# 是官方四种策略语言之一。Use for：第 2 课起的所有平台实操。
- [掘金量化 C# SDK 快速开始](https://www.myquant.cn/docs2/sdk/cSharp/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.html)
  官方中文入门：`Strategy` 基类、`OnInit`/`OnBar`、`Subscribe`、下单、`SetBacktestConfig`、`Run` 的完整示例。Use for：第 2 课主源。
- [掘金量化 C# SDK 策略基类](https://www.myquant.cn/docs2/sdk/cSharp/%E7%AD%96%E7%95%A5%E5%9F%BA%E7%B1%BB.html)
  交易函数与事件回调的权威签名：`OrderTargetPercent`/`OrderVolume`/`OnBacktestFinished` 等。Use for：第 3、6 课查 API。
- [掘金量化：策略回测与绩效](https://www.myquant.cn/docs2/operatingInstruction/study/%E7%AD%96%E7%95%A5%E5%9B%9E%E6%B5%8B%E4%B8%8E%E7%BB%A9%E6%95%88.html)
  终端里的回测参数、撮合模式、绩效报告字段说明。Use for：第 2、6 课读报告。
- [本工作区 R4：掘金量化 C# SDK 速查](../reference/myquant-csharp-cheatsheet.html)
  策略骨架、常用 API、终端操作路径、常见坑、报告字段一页纸。Use for：写策略时对照。
- [本工作区 R5：双均线算法详解](../reference/sma-crossover-explained.html)
  SMA 公式、3/5 日均线手算金叉/死叉、模拟器代码映射、滞后与震荡市假信号。Use for：第 1、3 课复习。
- [本工作区 R6：回测数据对不上排查清单](../reference/backtest-data-reconciliation.html)
  定点前复权 vs 最新日前复权、AKShare 列序、成交时序、成本、归一化对账。Use for：第 5、7 课数据/回测对账。
- [AKShare 官方文档（策略回测章节）](https://akshare.akfamily.xyz/demo.html)
  免费 A 股数据源（爬虫聚合、接口广）。Use for：真实数据获取课；注意其"无中心化数据库"的坑。
- [知乎：AKShare vs Tushare vs Baostock 对比](https://zhuanlan.zhihu.com/p/2067012476840031953)
  数据源选型：AKShare 广度、Tushare 质量、Baostock 零门槛。Use for：数据源选型课。
- [掘金量化社区：资源合集](https://bbs.myquant.cn/topic/624) 与 [四大量化平台对比（QMT/聚宽/PTrade/掘金）](https://zhuanlan.zhihu.com/p/2048462900814205689)
  掘金 SDK 支持 C++/**C#**/Python/Matlab；A 股实盘接入（QMT/PTrade）的选型资料。Use for：实盘接入课。
- [掘金量化官方文档入口（支持中心）](https://www.myquant.cn/docs2/faq) 与 [产品页](https://www.myquant.cn/terminal)
  官方全中文文档，含 **C# SDK 专门板块**；SDK 经掘金终端"量化研究 → SDK 下载"安装。2026-11 检索确认。Use for：R3 地图 + 全课程主通道。
- [聚宽 JoinQuant 官网](https://www.joinquant.com) 与 [API 文档（约 120 页中文 PDF）](https://cdn.joinquant.com/help/img/JoinQuantAPI.pdf)
  在线 Python 研究回测平台，中文社区最大；经典策略库索引见[雪球社区干货帖](https://xueqiu.com/8287840120/65009358)。Use for：读他人策略练归因（第 10 课技能）。
- [RQAlpha（米筐开源框架，GitHub）](https://github.com/ricequant/rqalpha) 与 [中文文档（readthedocs）](https://rqalpha.readthedocs.io)
  A 股回测引擎，Mod 架构，example 目录自带海龟/配对交易等示例；开源版配置对新手不友好。Use for：想读回测引擎源码时对照第 7 课自建引擎。
- [雪球：PTrade 与 QMT 对比及开通门槛](https://xueqiu.com/5521309053/243783874)、[miniqmt.com 常见问题](https://miniqmt.com/pages/qanda.html)
  实盘通道选型：QMT 本地 Python、品种全含期权期货（多数券商门槛 50-300 万，低门槛渠道约 10 万）；PTrade 券商托管、模板化新手友好（约 10-50 万）。门槛时效性强，动手前以券商当期政策为准。Use for：第 12 课实盘通道比价。
- [Book：《Advances in Financial Machine Learning》López de Prado](https://www.oreilly.com/library/view/advances-in-financial/9781119482086/c11.xhtml)（第 11 章免费可读）
  回测过拟合与 DSR 的学术原典；"回测是 sanity check 不是实验"态度的出处。全书笔记见 [reasonabledeviations.com](https://reasonabledeviations.com/notes/adv_fin_ml)。Use for：第 4、6、11 课深读。
- [SSRN 讲义第 6 讲：Backtest Overfitting / Deflated Sharpe Ratio](https://papers.ssrn.com/sol3/Delivery.cfm/SSRN_ID3637110_code434076.pdf?abstractid=3261943&mirid=1)
  "试得越多，成绩越要打折"的数学。Use for：第 6、11 课；读前两页即可。
- [GitHub：Neyt/How-To-Backtest-Correctly](https://github.com/Neyt/How-To-Backtest-Correctly)
  回测正确姿势的代码化清单。Use for：第 11 课 walk-forward 进阶。
- [Wikipedia: Kelly criterion](https://en.wikipedia.org/wiki/Kelly_criterion)
  凯利公式与分数凯利。Use for：第 9 课仓位管理；进阶读 Thorp 2008 论文（搜标题可得）。

## Wisdom (Communities)

- [集思录](https://jisilu.cn)
  A 股低风险投资社区（可转债/套利），个人投资者信噪比最高的中文社区之一。Use for：策略思路的现实检验。
- [掘金量化社区](https://bbs.myquant.cn)
  官方社区，SDK/策略/实盘问题的中文问答。Use for：平台卡住时的中文搜索入口。
- [聚宽社区](https://www.joinquant.com/community)
  中文策略分享与问答。Use for：读公开策略、练第 10 课归因。
- [Quant StackExchange](https://quant.stackexchange.com)
  英文量化问答；回测方法论、统计问题的高质量答案库。Use for：概念性疑问的深挖（英文，可选）。
- [r/algotrading](https://www.reddit.com/r/algotrading/)
  英文算法交易社区。Use for：平台求助、散户策略生态观察（英文，可选）。
- [VeighNa/vn.py 社区](https://www.vnpy.com/forum)
  国内开源交易框架社区（期货见长）。Use for：框架工程问题；暂不深入实盘期货。

## Gaps

- 掘金 C# 官方文档齐全，但第三方实战教程仍少；本课程以官方文档为主源，遇到版本差异以官网当期文档为准。
- 自建 C# 教学引擎没有现成中文教程可引用——这正是第 7-8 课要边写边记录的原因。
- A 股个人实盘接入（QMT/PTrade 开通门槛、费用）缺少权威中文汇总，实盘课前需专项检索。
- Ernest Chan《量化交易》中文版的具体章节页码索引待补。
