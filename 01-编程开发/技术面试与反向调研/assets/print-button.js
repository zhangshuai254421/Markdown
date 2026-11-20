/* ============================================================
   打印按钮组件 — 技术面试与反向调研
   用法：
     <button class="print-btn" type="button">打印这张备忘录</button>
   点击后调用浏览器打印；打印时按钮自动隐藏（见 style.css）。
   ============================================================ */

(function () {
  "use strict";

  function init() {
    document.querySelectorAll(".print-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.print();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
