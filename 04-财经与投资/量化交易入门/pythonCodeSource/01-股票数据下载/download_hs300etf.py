import akshare as ak

# 前复权日线：沪市 ETF 510300（沪深300ETF）
df = ak.fund_etf_hist_em(symbol="510300",
                         period="daily",
                         start_date="20150101",
                         end_date="20241231",
                         adjust="qfq")          # qfq = 前复权
df.to_csv("hs300etf_daily.csv", index=False, encoding="utf-8-sig")
print(df.head(), df.shape)
