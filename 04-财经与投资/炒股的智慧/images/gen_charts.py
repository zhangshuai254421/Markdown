# -*- coding: utf-8 -*-
"""《炒股的智慧》章节详解配图生成脚本(示意图,非真实行情)"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei"]
plt.rcParams["axes.unicode_minus"] = False

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(OUT, exist_ok=True)

C_PRICE = "#1f4e9c"   # 深蓝:价格线
C_UP = "#c0392b"      # A股习惯:红涨
C_DOWN = "#1e8449"    # 绿跌
C_LINE = "#e67e22"    # 橙:趋势线/颈线
C_SUP = "#8e44ad"     # 紫:支撑
C_RES = "#c0392b"     # 红:阻力
C_MA = "#e74c3c"
C_MA2 = "#16a085"
C_VOL = "#95a5a6"

def save(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("saved:", path)

def wobble(points, n=None, amp=0.06, seed=7):
    """给折线加一点锯齿感,更像K线走势"""
    pts = np.array(points, dtype=float)
    x, y = pts[:, 0], pts[:, 1]
    xi = np.linspace(x.min(), x.max(), n or max(len(x) * 8, 200))
    yi = np.interp(xi, x, y)
    rng = np.random.default_rng(seed)
    yi = yi + np.sin(xi * 2.1) * amp * 0.4 + rng.normal(0, amp, xi.size)
    return xi, yi

def draw(ax, x, y, color=C_PRICE, lw=1.8):
    ax.plot(x, y, color=color, lw=lw)
    ax.spines[["top", "right"]].set_visible(False)
    ax.set_xticks([])
    ax.tick_params(axis="y", labelsize=8)

# ---------- 图01:三种走势 ----------
def fig01():
    fig, axes = plt.subplots(3, 1, figsize=(8, 9))
    # 升势
    ax = axes[0]
    x, y = wobble([(0,10),(2,12),(3,11.2),(5,14),(6,13),(8,16)], seed=11)
    draw(ax, x, y, C_UP)
    for hx, hy in [(2,12),(5,14),(8,16)]:
        ax.scatter([hx],[hy], color=C_UP, zorder=5, s=25)
    for lx, ly in [(3,11.2),(6,13)]:
        ax.scatter([lx],[ly], color=C_SUP, zorder=5, s=25)
    ax.annotate("高点不断抬高", xy=(5,14), xytext=(0.4,15.2),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=10, color=C_UP)
    ax.annotate("低点不断抬高", xy=(6,13), xytext=(4.2,10.6),
                arrowprops=dict(arrowstyle="->", color=C_SUP), fontsize=10, color=C_SUP)
    ax.set_title("① 升势:一波比一波高(高点、低点都抬高)——只在这种走势中买股票", fontsize=11)
    ax.set_ylim(9.5, 16.5)
    # 跌势
    ax = axes[1]
    x, y = wobble([(0,16),(2,14),(3,14.8),(5,12),(6,13),(8,10)], seed=22)
    draw(ax, x, y, C_DOWN)
    ax.annotate("高点不断降低", xy=(3,14.8), xytext=(0.3,15.8),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10, color=C_DOWN)
    ax.annotate("低点不断降低", xy=(6,13), xytext=(4.3,13.9),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10, color=C_DOWN)
    ax.set_title("② 跌势:一波比一波低——绝不抄底,空仓等待", fontsize=11)
    ax.set_ylim(9.3, 16.5)
    # 无趋势
    ax = axes[2]
    x, y = wobble([(0,10.8),(1,11.4),(2,10.4),(3,11.3),(4,10.5),(5,11.4),(6,10.6),(7,11.2),(8,10.8)], seed=33)
    draw(ax, x, y)
    ax.axhline(11.5, color=C_RES, ls="--", lw=1)
    ax.axhline(10.3, color=C_SUP, ls="--", lw=1)
    ax.text(0.05, 11.6, "箱体上沿(阻力)", fontsize=9, color=C_RES)
    ax.text(0.05, 9.95, "箱体下沿(支撑)", fontsize=9, color=C_SUP)
    ax.set_title("③ 无趋势(盘整):横盘震荡——观望,等方向选择", fontsize=11)
    ax.set_ylim(9.5, 12.3)
    fig.suptitle("股票的三种运动方式(第二章·技术分析)", fontsize=13, y=1.0)
    fig.tight_layout()
    save(fig, "01-三种走势.png")

# ---------- 图02:趋势线 ----------
def fig02():
    fig, ax = plt.subplots(figsize=(8.5, 5.2))
    x, y = wobble([(0,10),(1.5,12),(2.5,11.2),(4,13.5),(5,12.6),(6.5,15),(7.5,14.2),(9,16.8),
                   (9.8,16.0),(10.8,17.5),(11.6,15.2),(12.5,13.8)], seed=44)
    draw(ax, x, y)
    lx = [2.5, 5, 7.5, 9.8]
    ly = [11.2, 12.6, 14.2, 16.0]
    ax.scatter(lx, ly, color=C_SUP, s=28, zorder=5)
    k, b = np.polyfit(lx, ly, 1)
    xs = np.array([0, 12.0])
    ax.plot(xs, k*xs+b, color=C_LINE, lw=2, label="上升趋势线:连接依次抬高的低点")
    bx = 10.55  # 跌破点
    ax.scatter([bx],[k*bx+b], color=C_DOWN, s=70, zorder=6, marker="x")
    ax.annotate("有效跌破趋势线:\n升势结束的警报,离场!",
                xy=(bx, k*bx+b), xytext=(8.2, 11.2),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10.5, color=C_DOWN)
    ax.annotate("每次回调到趋势线附近\n获得支撑,是加仓参考位",
                xy=(5,12.6), xytext=(3.0,14.8),
                arrowprops=dict(arrowstyle="->", color=C_LINE), fontsize=10, color="#b9770e")
    ax.legend(loc="upper left", fontsize=9, frameon=False)
    ax.set_title("趋势线:升势的生命线(第二章·技术分析)", fontsize=13)
    ax.set_ylim(10, 18.6)
    fig.tight_layout()
    save(fig, "02-趋势线.png")

# ---------- 图03:支撑线与阻力线 ----------
def fig03():
    fig, ax = plt.subplots(figsize=(8.5, 5.4))
    x, y = wobble([(0,19.4),(0.8,19.9),(1.5,18.2),(2.5,19.9),(3.2,18.1),(4.2,19.8),(5.0,18.2),
                   (5.8,19.7),(6.4,20.6),(7.2,22),(8.0,23.4),(8.8,21.6),(9.5,20.2),(10.2,21.5),
                   (11,23),(11.8,24.4)], seed=55)
    draw(ax, x, y)
    ax.axhline(20.0, color=C_RES, ls="--", lw=1.6)
    ax.axhline(18.0, color=C_SUP, ls="--", lw=1.6)
    ax.text(0.05, 20.25, "阻力线 = 20 元(多次冲高失败,套牢盘抛压)", fontsize=9.5, color=C_RES)
    ax.text(0.05, 17.6, "支撑线 = 18 元(多次探底回升,买盘承接)", fontsize=9.5, color=C_SUP)
    ax.scatter([6.4],[20.6], color=C_UP, s=80, zorder=6, marker="^")
    ax.annotate("① 放量突破阻力线 → 买入点", xy=(6.4,20.6), xytext=(5.4,22.6),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=10.5, color=C_UP)
    ax.scatter([9.5],[20.2], color=C_LINE, s=60, zorder=6)
    ax.annotate("② 回抽原阻力线(20元)\n不再跌破=角色互换:阻力变支撑\n回抽企稳可加仓",
                xy=(9.5,20.2), xytext=(9.9,17.2),
                arrowprops=dict(arrowstyle="->", color=C_LINE), fontsize=10, color="#b9770e")
    ax.annotate("③ 突破后升幅可观", xy=(11.8,24.4), xytext=(10.2,25.3),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=10, color=C_UP)
    ax.set_title("支撑线与阻力线及其角色互换(第二章·技术分析)", fontsize=13)
    ax.set_ylim(17.0, 26.2)
    fig.tight_layout()
    save(fig, "03-支撑线与阻力线.png")

# ---------- 图04:双肩图与头肩图 ----------
def fig04():
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8))
    # 双肩图(双顶)
    ax = axes[0]
    x, y = wobble([(0,10),(1.5,13),(2.8,16),(3.6,14.2),(5,16.1),(5.8,14.0),(6.6,12.2),(7.4,10.6)], seed=66)
    draw(ax, x, y)
    ax.axhline(14.1, color=C_LINE, ls="--", lw=1.6)
    ax.text(0.1, 14.35, "颈线(两肩低点连线)", fontsize=9, color="#b9770e")
    for px, py, t in [(2.8,16,"左顶(第一次冲高失败)"),(5,16.1,"右顶(再攻同一高位失败)")]:
        ax.scatter([px],[py], color=C_RES, s=45, zorder=6)
    ax.annotate("左顶", xy=(2.8,16), xytext=(1.5,17.0), fontsize=10, color=C_RES,
                arrowprops=dict(arrowstyle="->", color=C_RES))
    ax.annotate("右顶", xy=(5,16.1), xytext=(5.3,17.2), fontsize=10, color=C_RES,
                arrowprops=dict(arrowstyle="->", color=C_RES))
    ax.scatter([5.9],[13.8], color=C_DOWN, s=80, zorder=6, marker="x")
    ax.annotate("跌破颈线 → 卖出信号\n(上涨动能耗尽)", xy=(5.9,13.8), xytext=(3.4,11.4),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10, color=C_DOWN)
    ax.set_title("双肩图(双顶):两次冲击同一高位都失败", fontsize=11.5)
    ax.set_ylim(9.5, 18.4)
    # 头肩图
    ax = axes[1]
    x, y = wobble([(0,10),(1.2,13.8),(2,12.8),(3.2,16.6),(4.4,13.2),(5.6,14.4),(6.4,12.4),(7.2,10.4)], seed=77)
    draw(ax, x, y)
    ax.plot([2,4.4],[12.8,13.2], color=C_LINE, ls="--", lw=1.8)
    ax.text(2.0, 11.9, "颈线(左肩、右肩低点连线)", fontsize=9, color="#b9770e")
    ax.annotate("左肩", xy=(1.2,13.8), xytext=(0.3,14.8), fontsize=10, color=C_RES,
                arrowprops=dict(arrowstyle="->", color=C_RES))
    ax.annotate("头(最高点)", xy=(3.2,16.6), xytext=(2.4,17.3), fontsize=10, color=C_RES,
                arrowprops=dict(arrowstyle="->", color=C_RES))
    ax.annotate("右肩(无力创新高)", xy=(5.6,14.4), xytext=(5.3,15.8), fontsize=10, color=C_RES,
                arrowprops=dict(arrowstyle="->", color=C_RES))
    ax.scatter([4.6],[13.1], color=C_DOWN, s=80, zorder=6, marker="x")
    ax.annotate("跌破颈线 → 头肩顶确认\n典型的大顶形态,坚决离场", xy=(4.6,13.1), xytext=(4.9,10.9),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10, color=C_DOWN)
    ax.set_title("头肩图(头肩顶):中间高点最高,两肩稍低", fontsize=11.5)
    fig.suptitle("反转形态:双肩图与头肩图(第二章·技术分析)", fontsize=13, y=1.02)
    fig.tight_layout()
    save(fig, "04-双肩图与头肩图.png")

# ---------- 图05:平均线 ----------
def fig05():
    fig, ax = plt.subplots(figsize=(9, 5))
    rng = np.random.default_rng(88)
    n = 260
    drift = np.concatenate([np.linspace(0.04, 0.02, 90), np.linspace(0.02, -0.06, 60), np.linspace(-0.06, 0.10, 110)])
    price = 40 + np.cumsum(drift + rng.normal(0, 0.55, n))
    xs = np.arange(n)
    ma20 = np.convolve(price, np.ones(20)/20, mode="valid")
    ma60 = np.convolve(price, np.ones(60)/60, mode="valid")
    ax.plot(xs, price, color=C_PRICE, lw=1.2, label="股价")
    ax.plot(xs[19:], ma20, color=C_MA, lw=1.8, label="20日均线(短期成本)")
    ax.plot(xs[59:], ma60, color=C_MA2, lw=1.8, label="60日均线(中期成本)")
    # 金叉:ma20 从第40个点起与 ma60 逐点对齐(都对应 xs[59:])
    diff = ma20[40:len(ma60)+40] - ma60
    gc = int(np.argmax(diff > 0))
    gx = 59 + gc
    ax.scatter([gx],[ma60[gc]], color=C_UP, s=90, zorder=6, marker="^")
    ax.annotate("金叉:短期均线上穿长期均线,常是转强信号", xy=(gx, ma60[gc]), xytext=(gx+10, 40.2),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=9.5, color=C_UP)
    # 均线含义
    ax.text(4, price.max()+2.5,
            "均线 = 一段时间内买入者的平均成本\n股价站上均线→买的人平均赚钱→抛压小;\n股价跌破均线→买的人平均套牢→抛压大\n书中的口诀:股价站上200天线看多,跌破200天线看空",
            fontsize=9.5, color="#555",
            bbox=dict(boxstyle="round", fc="#fff8e7", ec="#e0c060"))
    ax.legend(loc="lower right", fontsize=9, frameon=False)
    ax.set_title("平均线:市场的平均持仓成本(第二章·技术分析)", fontsize=13)
    ax.set_xticks([])
    ax.spines[["top","right"]].set_visible(False)
    fig.tight_layout()
    save(fig, "05-平均线.png")

# ---------- 图06:量价配合(真突破 vs 假突破) ----------
def fig06():
    fig, axes = plt.subplots(2, 2, figsize=(11.5, 6.8),
                             gridspec_kw={"height_ratios": [3, 1], "hspace": 0.08, "wspace": 0.18})
    vx = np.arange(11)

    def panel(px, vol, vol_colors, title):
        axp, axv = px, vol
        axp.set_title(title, fontsize=11.5, pad=8)
        axp.set_xticks([]); axv.set_xticks([])
        axp.spines[["top", "right"]].set_visible(False)
        axv.spines[["top", "right"]].set_visible(False)
        axv.tick_params(axis="y", labelsize=7)
        axv.set_ylabel("成交量", fontsize=8)

    # 真突破:价格面板 + 成交量面板
    axp, axv = axes[0, 0], axes[1, 0]
    x, y = wobble([(0,19.5),(1,19.9),(1.8,18.6),(2.6,19.9),(3.4,18.5),(4.2,19.8),(5.2,21.2),
                   (6.2,22.8),(7.2,24.2),(8.2,25.8),(9,26.6)], seed=99)
    draw(axp, x, y, C_UP)
    axp.axhline(20.0, color=C_RES, ls="--", lw=1.4)
    axp.text(0.05, 20.2, "阻力线", fontsize=9, color=C_RES)
    axp.annotate("突破当日放量(量能翻倍)\n买盘真实涌入 → 有效突破,跟进",
                xy=(5.4,21.4), xytext=(3.9,27.2),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=10, color=C_UP)
    axp.set_ylim(15, 29.5)
    vol = np.array([30,26,22,25,20,24,58,64,60,55,50], dtype=float)
    axv.bar(vx, vol, width=0.6, color=[C_VOL]*6 + [C_UP]*5, alpha=0.8)
    axv.set_ylim(0, 80)
    panel(axp, axv, None, "√ 真突破:价升 + 量增(健康)")

    # 假突破
    axp, axv = axes[0, 1], axes[1, 1]
    x, y = wobble([(0,19.4),(0.9,19.9),(1.7,18.7),(2.5,19.9),(3.3,18.6),(4.1,19.8),(4.9,20.5),
                   (5.5,19.2),(6.2,17.8),(7,16.6),(7.8,15.6)], seed=111)
    draw(axp, x, y)
    axp.axhline(20.0, color=C_RES, ls="--", lw=1.4)
    axp.text(0.05, 20.2, "阻力线", fontsize=9, color=C_RES)
    axp.annotate("冲过阻力线但缩量\n买盘后继无力 → 假突破(诱多)\n股价很快跌回,套住追高者",
                xy=(4.9,20.5), xytext=(4.0,25.8),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10, color=C_DOWN)
    axp.set_ylim(15, 29.5)
    vol2 = np.array([30,26,22,25,21,22,18,14,16,12,11], dtype=float)
    axv.bar(vx, vol2, width=0.6, color=[C_VOL]*6 + [C_DOWN]*5, alpha=0.8)
    axv.set_ylim(0, 80)
    panel(axp, axv, None, "× 假突破:价升量缩(警惕)")

    fig.suptitle("量价配合:突破必须放量才有效(第二章·技术分析)", fontsize=13)
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    save(fig, "06-量价配合.png")

# ---------- 图07:临界点买入 ----------
def fig07():
    fig, ax = plt.subplots(figsize=(9, 5.4))
    x, y = wobble([(0,18.9),(0.8,19.8),(1.6,18.4),(2.4,19.7),(3.2,18.5),(4.0,19.8),(4.8,18.6),
                   (5.6,20.8),(6.4,22.2),(7.2,23.6),(8.0,25.0),(8.8,26.4),(9.6,27.4)], seed=123)
    draw(ax, x, y)
    ax.axhline(20.0, color=C_RES, ls="--", lw=1.4)
    ax.text(0.05, 20.2, "阻力线 20 元", fontsize=9, color=C_RES)
    bx = 5.75
    ax.scatter([bx],[20.6], color=C_UP, s=140, marker="*", zorder=7)
    ax.annotate("临界点买入\n(放量突破阻力线的瞬间)", xy=(bx,20.6), xytext=(2.6,23.4),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=11, color=C_UP, fontweight="bold")
    ax.axhspan(19.2, 20.6, xmin=0.04, xmax=0.72, color=C_DOWN, alpha=0.10)
    ax.axhline(19.2, color=C_DOWN, ls=":", lw=1.6)
    ax.text(7.6, 19.5, "止损位 19.2 元\n(跌破突破平台即离场)", fontsize=9.5, color=C_DOWN)
    ax.annotate("风险:约 7%,错了小亏出场", xy=(3.0,19.2), xytext=(0.4,17.95),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=9.5, color=C_DOWN)
    ax.annotate("潜在收益:30%+\n对了趋势一路展开\n(风险收益比 ≥ 1:3 才出手)",
                xy=(9.4,27.0), xytext=(6.6,25.9),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=9.5, color=C_UP)
    ax.set_title("临界点买入法:买在突破处,把止损距离压到最短(第三章)", fontsize=12.5)
    ax.set_ylim(17.8, 28.6)
    fig.tight_layout()
    save(fig, "07-临界点买入.png")

# ---------- 图08:截断亏损,让利润奔跑 ----------
def fig08():
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8))
    rng = np.random.default_rng(2024)
    # A: 小赚就跑、大亏死扛
    eq_a = [100]
    for _ in range(60):
        r = rng.choice([0.02, -0.15, -0.03], p=[0.7, 0.10, 0.20])
        eq_a.append(eq_a[-1] * (1 + r))
    ax = axes[0]
    ax.plot(eq_a, color=C_DOWN, lw=1.8)
    ax.set_title("× 人性做法:小赚就跑(+2%)\n偶尔大亏(-15%)死扛 → 长期亏钱", fontsize=11)
    ax.text(30, min(eq_a)*0.995, "胜率虽高(70%小赢)\n但一次大亏吃掉多次小赢", fontsize=9.5,
            color=C_DOWN, ha="center")
    # B: 截短亏损,让利润奔跑
    eq_b = [100]
    for _ in range(60):
        r = rng.choice([-0.02, 0.015, 0.25, -0.005], p=[0.45, 0.35, 0.12, 0.08])
        eq_b.append(eq_b[-1] * (1 + r))
    ax = axes[1]
    ax.plot(eq_b, color=C_UP, lw=1.8)
    ax.set_title("√ 正确做法:亏损截短(-2%止损)\n盈利让它奔跑(+25%大赢) → 长期赚钱", fontsize=11)
    ax.text(30, max(eq_b)*1.02, "胜率不高也不要紧\n赢的时候赢得大,期望值为正", fontsize=9.5,
            color=C_UP, ha="center")
    for ax in axes:
        ax.spines[["top","right"]].set_visible(False)
        ax.set_xlabel("交易次数", fontsize=9)
        ax.tick_params(labelsize=8)
    axes[0].set_ylabel("资金曲线", fontsize=9)
    fig.suptitle("“截短亏损,让利润奔跑”——两种做法的长期结果(第三章)", fontsize=13, y=1.04)
    fig.tight_layout()
    save(fig, "08-截短亏损让利润奔跑.png")

# ---------- 图09:移动止损(保利) ----------
def fig09():
    fig, ax = plt.subplots(figsize=(9, 5.2))
    x, y = wobble([(0,20),(1,20.9),(2,22.3),(3,21.8),(4,23.6),(5,23.0),(6,24.8),(7,26.2),
                   (8,25.6),(9,27.4),(10,28.6),(11,27.8),(12,26.4),(13,24.6)], seed=333)
    draw(ax, x, y)
    stops_x = [0, 1.6, 3.4, 5.4, 7.4, 9.6]
    stops_y = [19.0, 20.4, 21.4, 22.6, 25.0, 27.0]
    ax.step(stops_x, stops_y, where="post", color=C_DOWN, lw=2, ls="--", label="止损位(只升不降)")
    ax.scatter([0],[20], color=C_UP, s=90, marker="*", zorder=6)
    ax.annotate("20 元买入,初始止损 19 元\n(先想好亏多少再进场)", xy=(0,20), xytext=(0.3,22.8),
                arrowprops=dict(arrowstyle="->", color=C_UP), fontsize=10, color=C_UP)
    for i in range(1, len(stops_x)):
        ax.annotate("", xy=(stops_x[i], stops_y[i]), xytext=(stops_x[i], stops_y[i-1]),
                    arrowprops=dict(arrowstyle="->", color=C_DOWN, alpha=0.6))
    ax.text(3.8, 18.2, "股价每上一个台阶,止损就上移一级\n—— 永远不让浮盈变成亏损", fontsize=10.5, color=C_DOWN)
    ex = 11.6
    ax.scatter([ex],[26.2], color=C_DOWN, s=90, marker="x", zorder=6)
    ax.annotate("回调触发止损 → 27 元附近落袋\n约 +35%,绝不坐过山车", xy=(ex,26.2), xytext=(8.2,21.6),
                arrowprops=dict(arrowstyle="->", color=C_DOWN), fontsize=10, color=C_DOWN)
    ax.legend(loc="upper left", fontsize=9, frameon=False)
    ax.set_title("保利止损(移动止损):让利润奔跑,但把底线越抬越高(第三章)", fontsize=12.5)
    ax.set_ylim(17.4, 30)
    fig.tight_layout()
    save(fig, "09-移动止损.png")

# ---------- 图10:复利的力量 ----------
def fig10():
    fig, ax = plt.subplots(figsize=(8.5, 5))
    years = np.arange(0, 31)
    for r, c, lab in [(0.05, "#95a5a6", "每年 5%"),
                      (0.10, "#2980b9", "每年 10%"),
                      (0.20, "#e67e22", "每年 20%(顶级水平)"),
                      (0.30, "#c0392b", "每年 30%(股神级)")]:
        ax.plot(years, (1+r)**years, color=c, lw=2, label=lab)
        ax.annotate(f"{(1+r)**30:.0f} 倍", xy=(30, (1+r)**30), xytext=(28.3, (1+r)**30*1.15),
                    fontsize=9.5, color=c)
    ax.set_yscale("log")
    ax.set_xlabel("年数", fontsize=10)
    ax.set_ylabel("1 元本金的变化(对数刻度)", fontsize=10)
    ax.legend(fontsize=9, frameon=False, loc="upper left")
    ax.set_title("复利的力量:不追求一夜暴富,追求可持续的收益率(第四章)", fontsize=12.5)
    ax.spines[["top","right"]].set_visible(False)
    ax.text(1, 900, "每年 20%,30 年约 237 倍\n—— 这就是“慢即是快”",
            fontsize=10, color="#e67e22",
            bbox=dict(boxstyle="round", fc="#fff8e7", ec="#e0c060"))
    fig.tight_layout()
    save(fig, "10-复利的力量.png")

# ---------- 图11:股民情绪循环 ----------
def fig11():
    fig, ax = plt.subplots(figsize=(9.5, 5.4))
    x, y = wobble([(0,12),(1.2,14),(2.4,16.5),(3.4,18.2),(4.2,19.5),(5.2,18.0),(6.4,15.5),
                   (7.6,13.0),(8.6,11.2),(9.6,10.2),(10.8,11.6),(12,13.8)], seed=444)
    draw(ax, x, y)
    steps = [
        (1.2,14,"观望:“好像能涨”\n(好奇、将信将疑)"),
        (3.4,18.2,"追涨:越涨越兴奋\n(重仓杀入)"),
        (4.2,19.5,"顶部:贪婪到顶点\n“还会更高,加仓!”"),
        (6.4,15.5,"回落:“只是正常调整”\n(侥幸,不肯认错)"),
        (8.6,11.2,"恐慌:天天看账户\n(睡不着觉)"),
        (9.6,10.2,"绝望割肉:“再也不碰股票!”\n(卖在底部)"),
        (12,13.8,"新一轮行情启动…\n(懊悔,又忍不住追进去)"),
    ]
    offs = [(0.2,2.3),(1.0,1.6),(2.3,-3.6),(-0.6,2.2),(-3.4,-3.6),(-3.0,-3.4),(0.6,1.9)]
    for (px,py,txt),(dx,dy) in zip(steps, offs):
        ax.annotate(txt, xy=(px,py), xytext=(px+dx, py+dy), fontsize=9,
                    color="#7b241c" if py>14 else C_DOWN,
                    arrowprops=dict(arrowstyle="->", color="#999", lw=0.9))
    ax.scatter([4.2],[19.5], color=C_RES, s=60, zorder=6)
    ax.scatter([9.6],[10.2], color=C_SUP, s=60, zorder=6)
    ax.set_title("股民的情绪循环:为什么散户总在顶部买入、底部卖出(第一章)", fontsize=12.5)
    ax.set_ylim(7.5, 23.5)
    fig.tight_layout()
    save(fig, "11-股民情绪循环.png")

if __name__ == "__main__":
    for f in [fig01, fig02, fig03, fig04, fig05, fig06, fig07, fig08, fig09, fig10, fig11]:
        f()
    print("ALL DONE")
