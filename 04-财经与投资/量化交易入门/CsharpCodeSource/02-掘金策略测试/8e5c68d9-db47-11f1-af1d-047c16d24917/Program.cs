//////////////////////////////////////////////////////////////////////////
//2024-08-28 13:50

using GMSDK;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace EmptyStrategy
{
    public class Trade
    {
        public DateTime Time;
        public string Side = "";
        public string Symbol = "";
        public double Price;
        public double Volume;
        public double Amount;
        public double Commission;
        public double? Pnl;
    }

    public class SmaCross : Strategy
    {
        private const string Symbol = "SHSE.510300"; // 沪深300ETF
        private readonly List<double> _closes = new List<double>();
        private int _prevSign = -1;                  // -1 空仓/均线下方，+1 持仓/均线上方
        private double _positionCost;                // 当前持仓的买入成本（含佣金）

        public readonly List<Trade> Trades = new List<Trade>();

        public SmaCross(string token, string strategyId, StrategyMode mode)
            : base(token, strategyId, mode) { }

        public override void OnInit()
        {
            Subscribe(Symbol, "1d");
        }

        public override void OnBar(Bar bar)
        {
            _closes.Add(bar.close);
            if (_closes.Count < 200) return;         // 200 日均线还没攒够数据

            double fast = _closes.Skip(_closes.Count - 50).Take(50).Average();
            double slow = _closes.Skip(_closes.Count - 200).Take(200).Average();
            int sign = fast > slow ? 1 : -1;

            if (sign != _prevSign)                   // 状态翻转：金叉或死叉
            {
                OrderTargetPercent(Symbol, sign == 1 ? 0.99 : 0.0,
                    PositionSide.PositionSide_Long,
                    OrderType.OrderType_Market);
                _prevSign = sign;
            }
        }

        public override void OnOrderStatus(Order order)
        {
            if (order.status == (int)OrderStatus.OrderStatus_Rejected)
            {
                Console.WriteLine($"拒单: {Now():yyyy-MM-dd HH:mm:ss} {order.symbol} " +
                                  $"{order.side} {order.ordRejReasonDetail}");
                // 恢复状态，让下一根 K 线重试
                if (order.side == (int)OrderSide.OrderSide_Buy) _prevSign = -1;
                else _prevSign = 1;
                return;
            }

            if (order.status != (int)OrderStatus.OrderStatus_Filled) return;

            bool isBuy = order.side == (int)OrderSide.OrderSide_Buy;
            double volume = order.filledVolume;
            double price = order.filledVwap > 0 ? order.filledVwap : order.price;
            if (price <= 0 && volume > 0) price = order.filledAmount / volume;
            double amount = order.filledAmount > 0 ? order.filledAmount : price * volume;
            double commission = order.filledCommission;
            double? pnl = null;

            if (isBuy)
            {
                _positionCost += amount + commission;
            }
            else
            {
                pnl = amount - commission - _positionCost;
                _positionCost = 0;
            }

            Trades.Add(new Trade
            {
                Time = order.updatedAt == default ? Now() : order.updatedAt,
                Side = isBuy ? "买入" : "卖出",
                Symbol = order.symbol,
                Price = price,
                Volume = volume,
                Amount = amount,
                Commission = commission,
                Pnl = pnl
            });
        }
    }
    class Program
    {


        static void Main()
        {
            // 不要把 token 写进代码或提交到 Git；在系统环境变量里配置：
            //   MYQUANT_TOKEN / MYQUANT_STRATEGY_ID
            string token = Environment.GetEnvironmentVariable("MYQUANT_TOKEN") ?? "你的 token";
            string strategyId = Environment.GetEnvironmentVariable("MYQUANT_STRATEGY_ID") ?? "你的策略 ID";

            var s = new SmaCross(token, strategyId, StrategyMode.MODE_BACKTEST);

            // 起止时间、初始资金、成交比例、佣金、滑点、复权
            s.SetBacktestConfig("2015-01-01 09:30:00", "2026-11-12 15:00:00",
                                100000, 1, 0.00025, 0.000, Adjust.ADJUST_NONE);

            int ret = s.Run();
            Console.WriteLine("回测返回码: " + ret); // 0 = 成功

            Console.WriteLine();
            Console.WriteLine($"成交笔数: {s.Trades.Count}");
            Console.WriteLine("成交时间                方向  标的          成交价    数量      金额        手续费     本笔盈亏");
            foreach (var t in s.Trades)
            {
                string pnl = t.Pnl.HasValue ? t.Pnl.Value.ToString("F2") : "—";
                Console.WriteLine($"{t.Time:yyyy-MM-dd HH:mm:ss}  {t.Side}  {t.Symbol,-12}  {t.Price,7:F3}  {t.Volume,8:F0}  {t.Amount,10:F2}  {t.Commission,8:F2}  {pnl,10}");
            }

            var logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "myquant_trades.csv");
            File.WriteAllLines(logPath, new[] { "时间,方向,标的,成交价,数量,金额,手续费,本笔盈亏" }
                .Concat(s.Trades.Select(t =>
                    $"{t.Time:yyyy-MM-dd HH:mm:ss},{t.Side},{t.Symbol},{t.Price:F3},{t.Volume:F0},{t.Amount:F2},{t.Commission:F2},{(t.Pnl.HasValue ? t.Pnl.Value.ToString("F2") : "")}")));
            Console.WriteLine("成交明细已写入 " + logPath);
        }
    }
}
