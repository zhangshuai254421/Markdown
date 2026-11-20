/* ============================================================
   课程目录组件 — 量化交易入门
   在每页末尾引入：
     <script src="../assets/course-nav.js"></script>
   自动在 <main> 顶部插入可折叠目录，并高亮当前页。
   ============================================================ */
(function () {
  "use strict";

  if (document.querySelector(".course-toc")) return;

  var lessons = [
    { file: "0001-why-backtests-die-to-fees.html", label: "第 1 课 · 为什么多数策略活不过手续费" },
    { file: "0002-first-csharp-backtest.html", label: "第 2 课 · 掘金量化第一个 C# 回测" },
    { file: "0003-sma-crossover-and-lookahead-bias.html", label: "第 3 课 · 双均线与第一次作弊" },
    { file: "0004-backtest-cheating-catalog.html", label: "第 4 课 · 回测作弊图鉴：五宗罪" },
    { file: "0005-real-cndata-akshare.html", label: "第 5 课 · 真实 A 股数据与复权" },
    { file: "0006-benchmark-and-sharpe.html", label: "第 6 课 · 基准平反与夏普比率" },
    { file: "0007-own-engine-part1.html", label: "第 7 课 · 自建引擎（上）：核心循环" },
    { file: "0008-cndata-physics-engine.html", label: "第 8 课 · 自建引擎（下）：A 股物理" },
    { file: "0009-stop-loss-and-sizing.html", label: "第 9 课 · 止损与仓位" },
    { file: "0010-factors-intro.html", label: "第 10 课 · 因子入门" },
    { file: "0011-evaluation-protocol.html", label: "第 11 课 · 评估协议" },
    { file: "0012-graduation-paper-trading.html", label: "第 12 课 · 毕业：模拟盘与实盘" }
  ];

  var refs = [
    { file: "glossary.html", label: "R1 · 术语表" },
    { file: "backtest-checklist.html", label: "R2 · 回测自查清单" },
    { file: "cn-platform-map.html", label: "R3 · 国内量化平台地图" },
    { file: "myquant-csharp-cheatsheet.html", label: "R4 · 掘金 C# SDK 速查" },
    { file: "sma-crossover-explained.html", label: "R5 · 双均线算法详解" },
    { file: "backtest-data-reconciliation.html", label: "R6 · 回测数据对账清单" }
  ];

  var path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");
  var inLessons = path.indexOf("/lessons/") !== -1;
  var current = path.split("/").pop() || "";
  var lessonBase = inLessons ? "" : "../lessons/";
  var refBase = inLessons ? "../reference/" : "";

  function link(item, base) {
    var href = base + item.file;
    var cls = item.file === current ? ' class="toc-current" aria-current="page"' : "";
    return '<a href="' + href + '"' + cls + ">" + item.label + "</a>";
  }

  var nav = document.createElement("nav");
  nav.className = "course-toc";
  nav.setAttribute("aria-label", "课程目录");
  nav.innerHTML =
    "<details>" +
      '<summary>课程目录 <span class="toc-meta">12 课 · 6 份速查</span></summary>' +
      '<div class="toc-grid">' +
        "<section>" +
          "<h3>课程</h3>" +
          '<ul class="toc-lessons">' + lessons.map(function (l) { return "<li>" + link(l, lessonBase) + "</li>"; }).join("") + "</ul>" +
        "</section>" +
        "<section>" +
          "<h3>速查</h3>" +
          "<ul>" + refs.map(function (r) { return "<li>" + link(r, refBase) + "</li>"; }).join("") + "</ul>" +
        "</section>" +
      "</div>" +
    "</details>";

  var main = document.querySelector("main");
  if (!main) return;
  main.insertBefore(nav, main.firstChild);

  var details = nav.querySelector("details");
  if (details) details.open = window.matchMedia("(min-width: 720px)").matches;
})();
