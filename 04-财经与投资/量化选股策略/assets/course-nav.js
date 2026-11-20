/* ============================================================
   课程目录组件 — 量化选股策略
   在每页末尾引入：
     <script src="../assets/course-nav.js"></script>
   自动在 <main> 顶部插入可折叠目录，并高亮当前页。
   未发布的课程显示为"待发布"，不生成链接。
   ============================================================ */
(function () {
  "use strict";

  if (document.querySelector(".course-toc")) return;

  var lessons = [
    { file: "0001-stock-selection-landscape.html", label: "第 1 课 · 选股策略地图", published: true },
    { file: null, label: "第 2 课 · 横截面回测引擎" },
    { file: null, label: "第 3 课 · 价值因子" },
    { file: null, label: "第 4 课 · 质量因子" },
    { file: null, label: "第 5 课 · 动量与反转" },
    { file: null, label: "第 6 课 · 低波、红利与小市值" },
    { file: null, label: "第 7 课 · 成长因子" },
    { file: null, label: "第 8 课 · 多因子合成" },
    { file: null, label: "第 9 课 · 组合构建" },
    { file: null, label: "第 10 课 · 回测陷阱与 A 股物理" },
    { file: null, label: "第 11 课 · 因子评估与归因" },
    { file: null, label: "第 12 课 · 毕业：模拟盘与监控" }
  ];

  var refs = [
    { file: "course-map.html", label: "R1 · 课程地图与策略家族" }
  ];

  var path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");
  var inLessons = path.indexOf("/lessons/") !== -1;
  var current = path.split("/").pop() || "";
  var lessonBase = inLessons ? "" : "../lessons/";
  var refBase = inLessons ? "../reference/" : "";

  function lessonItem(item) {
    if (!item.file) {
      return '<li><span class="toc-planned">' + item.label + "</span></li>";
    }
    var cls = item.file === current ? ' class="toc-current" aria-current="page"' : "";
    return '<li><a href="' + lessonBase + item.file + '"' + cls + ">" + item.label + "</a></li>";
  }

  function refItem(item) {
    var cls = item.file === current ? ' class="toc-current" aria-current="page"' : "";
    return '<li><a href="' + refBase + item.file + '"' + cls + ">" + item.label + "</a></li>";
  }

  var nav = document.createElement("nav");
  nav.className = "course-toc";
  nav.setAttribute("aria-label", "课程目录");
  nav.innerHTML =
    "<details>" +
      '<summary>课程目录 <span class="toc-meta">1 课已发布 · 11 课待发布</span></summary>' +
      '<div class="toc-grid">' +
        "<section>" +
          "<h3>课程</h3>" +
          '<ul class="toc-lessons">' + lessons.map(lessonItem).join("") + "</ul>" +
        "</section>" +
        "<section>" +
          "<h3>速查</h3>" +
          "<ul>" + refs.map(refItem).join("") + "</ul>" +
          '<p class="toc-foot"><a href="../../量化交易入门/lessons/0001-why-backtests-die-to-fees.html">先修：量化交易入门</a></p>' +
        "</section>" +
      "</div>" +
    "</details>";

  var main = document.querySelector("main");
  if (!main) return;
  main.insertBefore(nav, main.firstChild);

  var details = nav.querySelector("details");
  if (details) details.open = window.matchMedia("(min-width: 720px)").matches;
})();
