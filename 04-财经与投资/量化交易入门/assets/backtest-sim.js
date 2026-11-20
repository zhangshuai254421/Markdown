/* ============================================================
   回测模拟器组件 — 量化交易入门
   在页面里 <div class="sim" id="..."></div>，末尾：
     <script src="../assets/backtest-sim.js"></script>
     <script>QuantSim.mount(document.getElementById("..."));</script>

   图表遵循 dataviz 规范：
   - 双系列：策略(蓝 series-1) vs 买入持有(橙 series-2)
   - 图例 + 线端直接标注；文字用墨色，识别靠色块
   - 十字线 + tooltip；统计表 = 数据的表格视图
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 随机数（可复现） ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rnd) {
    var u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------- 合成市场：阶段化漂移 + 波动（模拟数据！） ---------- */
  var PHASES = [ // [天数, 年化漂移, 日波动]
    [520, 0.16, 0.011],   // 温和牛市
    [380, -0.02, 0.010],  // 高位震荡
    [300, 0.22, 0.012],   // 主升
    [360, -0.42, 0.019],  // 熊市
    [420, 0.28, 0.013],   // 修复
    [300, 0.01, 0.010],   // 再震荡
  ];
  function genMarket(seed) {
    var rnd = mulberry32(seed);
    var px = [1000], day = 0;
    PHASES.forEach(function (ph) {
      for (var i = 0; i < ph[0]; i++) {
        var r = ph[1] / 252 + ph[2] * gauss(rnd);
        px.push(Math.max(px[px.length - 1] * (1 + r), 50));
        day++;
      }
    });
    return px;
  }

  /* ---------- 策略：双均线（可扩展） ---------- */
  function sma(arr, n, end) {
    var s = 0;
    for (var i = end - n + 1; i <= end; i++) s += arr[i];
    return s / n;
  }
  /* 返回 {pos:[每天仓位], trades:换手次数}；暖机期不含结果 */
  function runSmaCross(px, fast, slow) {
    var pos = [], trades = 0, cur = 0;
    for (var d = 0; d < px.length; d++) {
      if (d < slow - 1) { pos.push(0); continue; }
      var want = sma(px, fast, d) > sma(px, slow, d) ? 1 : 0;
      if (want !== cur) { trades++; cur = want; }
      pos.push(cur);
    }
    return { pos: pos, trades: trades };
  }
  function runBuyHold(px) {
    var pos = [];
    for (var d = 0; d < px.length; d++) pos.push(d === 0 ? 0 : 1); // 首日空仓，次日买入
    return { pos: pos, trades: 1 };
  }

  /* ---------- 绩效 ---------- */
  /* 净值曲线：持仓日吃涨跌幅，换仓日扣一次性单边成本 */
  function equityOf(px, pos, costPerSide) {
    var eq = [1], v = 1, prev = pos[0];
    for (var d = 1; d < px.length; d++) {
      if (pos[d] !== prev) { v *= (1 - costPerSide); prev = pos[d]; }
      if (pos[d] === 1) v *= px[d] / px[d - 1];
      eq.push(v);
    }
    return eq;
  }
  function stats(eq, trades) {
    var yrs = (eq.length - 1) / 252;
    var total = eq[eq.length - 1] - 1;
    var cagr = Math.pow(eq[eq.length - 1], 1 / yrs) - 1;
    var peak = -1, maxdd = 0;
    for (var i = 0; i < eq.length; i++) {
      if (eq[i] > peak) peak = eq[i];
      var dd = 1 - eq[i] / peak;
      if (dd > maxdd) maxdd = dd;
    }
    return { total: total, cagr: cagr, maxdd: maxdd, trades: trades };
  }

  /* ---------- 工具 ---------- */
  function pct(x, digits) { return (x * 100).toFixed(digits === undefined ? 1 : digits) + "%"; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ---------- 主入口 ---------- */
  var DEFAULTS = { warmup: 200, fast: 50, slow: 200, costOptions: [0, 0.001, 0.003], cheatable: false };

  function mount(root, opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var seed = Math.floor(Math.random() * 1e9);

    var selStrategy, selCost, selExec, px, cached;

    function compute() {
      var full = genMarket(seed);
      px = full.slice(o.warmup); // 对齐比较窗口
      var strat = selStrategy.value === "bh"
        ? { pos: runBuyHold(px).pos, trades: 1 }
        : runSmaCross(px, o.fast, o.slow);
      var cost = parseFloat(selCost.value);
      /* 信号执行延迟：诚实=信号次日成交(delay 1)；作弊=当日成交(delay 0)。
         delay 0 时信号用了当日收盘信息又在当日成交，即未来函数——收益必然虚高。 */
      var delay = selExec && selExec.value === "cheat" ? 0 : 1;
      var eff = strat.pos.map(function (_, d) {
        return d >= delay ? strat.pos[d - delay] : 0;
      });
      var trades = 0;
      for (var d = 1; d < eff.length; d++) if (eff[d] !== eff[d - 1]) trades++;
      return {
        px: px,
        eqS: equityOf(px, eff, cost),
        eqB: equityOf(px, runBuyHold(px).pos, cost),
        statsS: stats(equityOf(px, eff, cost), trades),
        statsB: stats(equityOf(px, runBuyHold(px).pos, cost), 1),
      };
    }

    /* --- 控件 --- */
    var controls = el("div", "sim-controls");
    var lblS = el("label", "", "策略 ");
    selStrategy = document.createElement("select");
    selStrategy.innerHTML =
      '<option value="sma">双均线 ' + o.fast + "/" + o.slow + "</option>" +
      '<option value="bh">买入持有</option>';
    lblS.appendChild(selStrategy);
    var lblC = el("label", "", "单边成本 ");
    selCost = document.createElement("select");
    selCost.innerHTML = o.costOptions
      .map(function (c) { return '<option value="' + c + '">' + (c === 0 ? "零成本" : pct(c, 2)); })
      .join("");
    lblC.appendChild(selCost);
    if (o.cheatable) {
      var lblE = el("label", "", "信号执行 ");
      selExec = document.createElement("select");
      selExec.innerHTML =
        '<option value="honest">次日成交（诚实）</option>' +
        '<option value="cheat">当日成交（作弊）</option>';
      lblE.appendChild(selExec);
    }
    var btnNew = el("button", "", "换一个市场");
    controls.appendChild(lblS);
    controls.appendChild(lblC);
    if (selExec) controls.appendChild(lblE);
    controls.appendChild(btnNew);

    /* --- 图例 --- */
    var legend = el(
      "div",
      "sim-legend",
      '<span class="t1"><span class="swatch"></span>双均线策略</span>' +
        '<span class="t2"><span class="swatch"></span>买入持有（基准）</span>'
    );

    /* --- 画布 --- */
    var wrap = el("div", "sim-chart-wrap");
    var canvas = document.createElement("canvas");
    canvas.height = 340;
    wrap.appendChild(canvas);
    var tip = el("div", "sim-tooltip");
    wrap.appendChild(tip);

    /* --- 统计：瓦片（策略） + 对比表（表格视图） --- */
    var tiles = el("div", "stat-grid");
    var tableWrap = el("div", "table-wrap");

    root.appendChild(controls);
    root.appendChild(legend);
    root.appendChild(wrap);
    root.appendChild(tiles);
    root.appendChild(tableWrap);

    var css = getComputedStyle(document.documentElement);
    var C = {
      s1: css.getPropertyValue("--series-1").trim() || "#2a78d6",
      s2: css.getPropertyValue("--series-2").trim() || "#eb6834",
      grid: css.getPropertyValue("--grid-hairline").trim() || "#e1e0d9",
      base: css.getPropertyValue("--axis-baseline").trim() || "#c3c2b7",
      label: css.getPropertyValue("--axis-label").trim() || "#898781",
      ink: css.getPropertyValue("--ink").trim() || "#172033",
      surface: css.getPropertyValue("--surface-1").trim() || "#fcfcfb",
    };

    function draw() {
      cached = compute();
      renderChart(cached);
      renderStats(cached);
    }

    function renderChart(d) {
      var dpr = window.devicePixelRatio || 1;
      var wCSS = wrap.clientWidth || 700;
      var hCSS = 340;
      canvas.width = wCSS * dpr;
      canvas.height = hCSS * dpr;
      canvas.style.height = hCSS + "px";
      var g = canvas.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = C.surface;
      g.fillRect(0, 0, wCSS, hCSS);

      var padL = 52, padR = 92, padT = 14, padB = 30;
      var iw = wCSS - padL - padR, ih = hCSS - padT - padB;
      var n = d.eqS.length;

      var lo = Infinity, hi = -Infinity;
      d.eqS.concat(d.eqB).forEach(function (v) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      });
      var span = hi - lo || 1;
      lo -= span * 0.06; hi += span * 0.06;
      function X(i) { return padL + (i / (n - 1)) * iw; }
      function Y(v) { return padT + (1 - (v - lo) / (hi - lo)) * ih; }

      /* 网格（细线，退后）与 y 轴刻度 */
      g.strokeStyle = C.grid;
      g.fillStyle = C.label;
      g.font = "11px Consolas, monospace";
      g.lineWidth = 1;
      for (var t = 0; t <= 4; t++) {
        var vy = lo + ((hi - lo) * t) / 4;
        var y = Y(vy);
        g.beginPath(); g.moveTo(padL, y); g.lineTo(wCSS - padR, y); g.stroke();
        g.textAlign = "right";
        g.fillText(vy.toFixed(2), padL - 8, y + 4);
      }
      /* 年份刻度 */
      g.textAlign = "center";
      for (var yr = 0; yr * 252 < n; yr++) {
        var xi = X(yr * 252);
        if (xi < wCSS - padR) g.fillText("第" + (yr + 1) + "年", xi, hCSS - 8);
      }

      /* 基线 */
      g.strokeStyle = C.base;
      g.beginPath(); g.moveTo(padL, Y(lo)); g.lineTo(wCSS - padR, Y(lo)); g.stroke();

      function line(eq, color) {
        g.strokeStyle = color;
        g.lineWidth = 2;
        g.beginPath();
        for (var i = 0; i < eq.length; i++) {
          var x = X(i), y = Y(eq[i]);
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
      line(d.eqB, C.s2);
      line(d.eqS, C.s1);

      /* 线端直接标注：文字用墨色，色点承载识别 */
      var endY1 = Y(d.eqS[n - 1]), endY2 = Y(d.eqB[n - 1]);
      g.font = "12px 'Segoe UI', 'Microsoft YaHei', sans-serif";
      g.textAlign = "left";
      function tag(y, color, txt) {
        g.fillStyle = color;
        g.beginPath(); g.arc(wCSS - padR + 12, y, 4, 0, 7); g.fill();
        g.fillStyle = C.ink;
        g.fillText(txt, wCSS - padR + 22, y + 4);
      }
      tag(endY1, C.s1, "策略");
      tag(endY2, C.s2, "基准");

      /* 交互：十字线 + tooltip（存在独立重绘时叠画） */
      canvas.onmousemove = function (ev) {
        var rect = canvas.getBoundingClientRect();
        var mx = ev.clientX - rect.left;
        if (mx < padL || mx > wCSS - padR) { tip.style.display = "none"; overlay(null); return; }
        var i = Math.round(((mx - padL) / iw) * (n - 1));
        overlay(X(i));
        tip.style.display = "block";
        var tx = Math.min(mx + 14, wCSS - 170);
        tip.style.left = tx + "px";
        tip.style.top = (ev.clientY - rect.top - 10) + "px";
        tip.innerHTML =
          '<span class="d">第 ' + (1 + i / 252).toFixed(2) + " 年 · 净值</span><br>" +
          '<span style="color:' + C.ink + '">● </span>策略　' + d.eqS[i].toFixed(3) + "<br>" +
          '<span style="color:' + C.ink + '">● </span>基准　' + d.eqB[i].toFixed(3);
      };
      canvas.onmouseleave = function () { tip.style.display = "none"; overlay(null); };

      /* 叠加十字线：简单实现——重绘曲线后画线 */
      var lastCross = null;
      function overlay(xi) {
        renderChartStatic(d);
        if (xi !== null) {
          var gg = canvas.getContext("2d");
          gg.strokeStyle = C.base;
          gg.setLineDash([3, 3]);
          gg.beginPath(); gg.moveTo(xi, padT); gg.lineTo(xi, hCSS - padB); gg.stroke();
          gg.setLineDash([]);
        }
      }
      function renderChartStatic(dd) {
        /* 轻量重绘：仅曲线层，避免鼠标移动时全量重算 */
        var gg = canvas.getContext("2d");
        gg.clearRect(0, 0, wCSS, hCSS);
        gg.fillStyle = C.surface;
        gg.fillRect(0, 0, wCSS, hCSS);
        gg.strokeStyle = C.grid; gg.lineWidth = 1; gg.fillStyle = C.label;
        gg.font = "11px Consolas, monospace";
        for (var t2 = 0; t2 <= 4; t2++) {
          var vy2 = lo + ((hi - lo) * t2) / 4, y2 = Y(vy2);
          gg.beginPath(); gg.moveTo(padL, y2); gg.lineTo(wCSS - padR, y2); gg.stroke();
          gg.textAlign = "right"; gg.fillText(vy2.toFixed(2), padL - 8, y2 + 4);
        }
        gg.textAlign = "center";
        for (var yr2 = 0; yr2 * 252 < n; yr2++) {
          var xi2 = X(yr2 * 252);
          if (xi2 < wCSS - padR) gg.fillText("第" + (yr2 + 1) + "年", xi2, hCSS - 8);
        }
        gg.strokeStyle = C.base;
        gg.beginPath(); gg.moveTo(padL, Y(lo)); gg.lineTo(wCSS - padR, Y(lo)); gg.stroke();
        [ [dd.eqB, C.s2], [dd.eqS, C.s1] ].forEach(function (p) {
          gg.strokeStyle = p[1]; gg.lineWidth = 2; gg.beginPath();
          for (var i2 = 0; i2 < p[0].length; i2++) {
            var x2 = X(i2), yy = Y(p[0][i2]);
            if (i2 === 0) gg.moveTo(x2, yy); else gg.lineTo(x2, yy);
          }
          gg.stroke();
        });
        var e1 = Y(dd.eqS[n - 1]), e2 = Y(dd.eqB[n - 1]);
        gg.font = "12px 'Segoe UI', 'Microsoft YaHei', sans-serif"; gg.textAlign = "left";
        [[e1, C.s1, "策略"], [e2, C.s2, "基准"]].forEach(function (p) {
          gg.fillStyle = p[1];
          gg.beginPath(); gg.arc(wCSS - padR + 12, p[0], 4, 0, 7); gg.fill();
          gg.fillStyle = C.ink; gg.fillText(p[2], wCSS - padR + 22, p[0] + 4);
        });
      }
    }

    function renderStats(d) {
      var s = d.statsS, b = d.statsB;
      tiles.innerHTML = "";
      [
        ["总收益率", pct(s.total), "同期基准 " + pct(b.total)],
        ["年化收益", pct(s.cagr), "同期基准 " + pct(b.cagr)],
        ["最大回撤", pct(s.maxdd), "同期基准 " + pct(b.maxdd)],
        ["交易次数", String(s.trades), "基准 " + b.trades + " 次"],
      ].forEach(function (t) {
        tiles.appendChild(el(
          "div", "stat-tile",
          '<p class="k">' + t[0] + '</p><p class="v">' + t[1] + '</p><p class="s">' + t[2] + "</p>"
        ));
      });
      tableWrap.innerHTML =
        "<table><thead><tr><th>指标</th><th class='num'>双均线策略</th><th class='num'>买入持有</th></tr></thead><tbody>" +
        "<tr><td>总收益率</td><td class='num'>" + pct(s.total) + "</td><td class='num'>" + pct(b.total) + "</td></tr>" +
        "<tr><td>年化收益</td><td class='num'>" + pct(s.cagr) + "</td><td class='num'>" + pct(b.cagr) + "</td></tr>" +
        "<tr><td>最大回撤</td><td class='num'>" + pct(s.maxdd) + "</td><td class='num'>" + pct(b.maxdd) + "</td></tr>" +
        "<tr><td>交易次数</td><td class='num'>" + s.trades + "</td><td class='num'>" + b.trades + "</td></tr>" +
        "</tbody></table>";
    }

    selStrategy.addEventListener("change", draw);
    selCost.addEventListener("change", draw);
    if (selExec) selExec.addEventListener("change", draw);
    btnNew.addEventListener("click", function () {
      seed = Math.floor(Math.random() * 1e9);
      draw();
    });
    window.addEventListener("resize", function () { draw(); });

    draw();
  }

  window.QuantSim = { mount: mount };
})();
