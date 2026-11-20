using System.Globalization;
using System.Text;


namespace MinimumViableEngine
{
    internal class Program
    {
        record Bar(DateTime Date, double Open, double High, double Low, double Close);
        record Trade(DateTime SignalDate, DateTime FillDate, string Side,
                     double Price, double Shares, double Amount, double Fee,
                     double CashAfter, double EquityAfter, double? Pnl);

        static void Main(string[] args)
        {

         
            // ---------- 数据 ----------
            const string DataPath = @"E:\01-学习\05-Python\01-股票数据下载\hs300etf_daily.csv";
            var lines = File.ReadAllLines(DataPath).Skip(1);
            var bars = lines
                .Select(l => l.Split(','))
                .Select(f => new Bar(
                    Date: DateTime.Parse(f[0], CultureInfo.InvariantCulture),
                    Open: Parse(f[1]), Close: Parse(f[2]),
                    High: Parse(f[3]), Low: Parse(f[4])))
                .OrderBy(b => b.Date)
                .ToList();

            static double Parse(string s) => double.Parse(s, CultureInfo.InvariantCulture);

            // ---------- 策略：SMA50/200，输出每日目标仓位 ----------
            static int Signal(IReadOnlyList<Bar> bars, int i)     // 用截至昨收的数据
            {
                if (i < 200) return 0;
                double smaFast(int end, int n) { double s = 0; for (int k = end - n; k < end; k++) s += bars[k].Close; return s / n; }
                return smaFast(i, 50) > smaFast(i, 200) ? 1 : 0;   // i 指向"昨天"，不含今
            }

            // ---------- Broker + Portfolio ----------
            const double InitialCash = 100_000;
            double cash = InitialCash, shares = 0;
            var equity = new List<double>();
            int prevSignal = 0;
            int trades = 0, buys = 0, sells = 0;                  // 交易次数：买/卖各算一次
            double totalFees = 0;                                  // 累计佣金 + 印花税
            DateTime firstTrade = default, lastTrade = default;
            var tradeLog = new List<Trade>();                      // 每笔成交明细
            double positionCost = 0;                               // 当前持仓的买入成本（含佣金）

            // ---------- A股物理常数 ----------
            const double Commission = 0.00025;   // 佣金 万2.5
            const double MinFee = 5;             // 佣金最低 5 元
            const double StampTax = 0;           // 510300 是 ETF，免征印花税；个股改为 0.0005
            const double LimitPct = 0.10;        // 涨跌停 ±10%（主板/多数ETF）

            DateTime lastBuyDay = default;

            for (int t = 200; t < bars.Count; t++)
            {
                int signal = Signal(bars, t);
                var today = bars[t];
                var prevClose = t > 0 ? bars[t - 1].Close : today.Open;

                bool limitUp = today.Open >= prevClose * (1 + LimitPct - 0.0005);
                bool limitDown = today.Open <= prevClose * (1 - LimitPct + 0.0005);
                bool canSell = shares > 0 && today.Date > lastBuyDay;      // T+1

                if (signal != prevSignal)
                {
                    bool traded = false;

                    if (signal == 1 && shares == 0 && !limitUp)              // 涨停买单作废
                    {
                        double fill = today.Open;
                        shares = Math.Floor(cash * (1 - Commission) / fill);
                        double amount = shares * fill;
                        double fee = Math.Max(amount * Commission, MinFee);
                        cash -= amount + fee;
                        totalFees += fee;
                        lastBuyDay = today.Date;

                        if (trades == 0) firstTrade = today.Date;
                        lastTrade = today.Date;
                        trades++; buys++;
                        traded = true;
                        positionCost = amount + fee;
                        tradeLog.Add(new Trade(bars[t - 1].Date, today.Date, "买入",
                            fill, shares, amount, fee, cash, cash + shares * today.Close, null));
                    }
                    else if (signal == 0 && canSell && !limitDown)           // 跌停卖单作废
                    {
                        double fill = today.Open;
                        double soldShares = shares;
                        double amount = soldShares * fill;
                        double fee = Math.Max(amount * Commission, MinFee);
                        double tax = amount * StampTax;
                        cash += amount - fee - tax;
                        totalFees += fee + tax;
                        shares = 0;

                        lastTrade = today.Date;
                        trades++; sells++;
                        traded = true;
                        double pnl = amount - fee - tax - positionCost;
                        positionCost = 0;
                        tradeLog.Add(new Trade(bars[t - 1].Date, today.Date, "卖出",
                            fill, soldShares, amount, fee + tax, cash, cash, pnl));
                    }

                    if (traded) prevSignal = signal;   // 只有成交才更新；被挡下则次日重试
                }
                equity.Add(cash + shares * today.Close);
            }

            // ---------- 统计 ----------
            double total = equity[^1] / equity[0] - 1;
            double years = (bars.Count - 200) / 252.0;
            double cagr = Math.Pow(equity[^1] / equity[0], 1 / years) - 1;
            double peak = 0, maxdd = 0;
            foreach (var v in equity) { peak = Math.Max(peak, v); maxdd = Math.Max(maxdd, 1 - v / peak); }

            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine($"总收益 {total:P1} | 年化 {cagr:P1} | 最大回撤 {maxdd:P1}");
            Console.WriteLine($"交易次数 {trades}（买 {buys} / 卖 {sells}） | 累计成本 {totalFees:F2} 元（{totalFees / InitialCash:P2} 初始资金）");
            if (trades > 0)
                Console.WriteLine($"首末交易 {firstTrade:yyyy-MM-dd} ~ {lastTrade:yyyy-MM-dd}");
            Console.WriteLine($"区间 {bars[200].Date:yyyy-MM} ~ {bars[^1].Date:yyyy-MM}，共 {bars.Count - 200} 个交易日");

            Console.WriteLine();
            Console.WriteLine("交易明细（信号日 → 成交日，成交价 / 数量 / 金额 / 费用 / 本笔盈亏 / 成交后现金 / 成交后净值）：");
            Console.WriteLine("信号日      成交日      方向  成交价   数量      金额        费用     本笔盈亏    现金        净值");
            foreach (var tr in tradeLog)
            {
                string pnl = tr.Pnl.HasValue ? tr.Pnl.Value.ToString("F2") : "—";
                Console.WriteLine($"{tr.SignalDate:yyyy-MM-dd}  {tr.FillDate:yyyy-MM-dd}  {tr.Side}  {tr.Price,7:F3}  {tr.Shares,8:F0}  {tr.Amount,10:F2}  {tr.Fee,8:F2}  {pnl,10}  {tr.CashAfter,10:F2}  {tr.EquityAfter,10:F2}");
            }

            var logPath = Path.Combine(Path.GetDirectoryName(DataPath)!, "trades.csv");
            File.WriteAllLines(logPath, new[]
            {
                "信号日,成交日,方向,成交价,数量,金额,费用,本笔盈亏,现金,净值"
            }.Concat(tradeLog.Select(tr =>
                $"{tr.SignalDate:yyyy-MM-dd},{tr.FillDate:yyyy-MM-dd},{tr.Side},{tr.Price:F3},{tr.Shares:F0},{tr.Amount:F2},{tr.Fee:F2},{(tr.Pnl.HasValue ? tr.Pnl.Value.ToString("F2") : "")},{tr.CashAfter:F2},{tr.EquityAfter:F2}")));
            Console.WriteLine($"交易明细已写入 {logPath}");
        }


    }
}
