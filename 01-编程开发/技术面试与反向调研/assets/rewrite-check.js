/* ============================================================
   改写练习组件 — 技术面试与反向调研
   用法：
     <div class="rewrite"
          data-anchors="最近,上次,上一次"
          data-details="例子,具体,怎么,后来,发现"
          data-closed="有没有,是否">
       <label class="rewrite-label" for="r1">你的改写：</label>
       <textarea id="r1" class="rewrite-input" rows="3"></textarea>
       <div class="rewrite-actions">
         <button type="button" class="check-btn">检查我的问法</button>
         <button type="button" class="rewrite-reveal" data-reveal="m1">看参考改写</button>
       </div>
       <p class="feedback" hidden></p>
       <div class="answer" id="m1" hidden>…</div>
     </div>
   反馈基于关键词，是教学提示，不是自动评分。
   ============================================================ */

(function () {
  "use strict";

  function splitWords(value) {
    return (value || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function containsAny(text, words) {
    return words.some(function (w) { return w && text.indexOf(w) !== -1; });
  }

  function initRewrite(box) {
    var input = box.querySelector(".rewrite-input");
    var check = box.querySelector(".check-btn");
    var feedback = box.querySelector(".feedback");
    var anchors = splitWords(box.getAttribute("data-anchors"));
    var details = splitWords(box.getAttribute("data-details"));
    var closed = splitWords(box.getAttribute("data-closed"));

    if (!input || !check || !feedback) return;

    check.addEventListener("click", function () {
      var text = input.value.trim();
      var hasAnchor = containsAny(text, anchors);
      var hasDetail = containsAny(text, details);
      var hasClosed = containsAny(text, closed);

      feedback.hidden = false;

      if (!text) {
        feedback.className = "feedback bad";
        feedback.textContent = "先写一句，再检查。哪怕写得不好，也比只看答案强。";
        return;
      }

      if (closed.length && hasClosed && hasAnchor && hasDetail) {
        feedback.className = "feedback bad";
        feedback.textContent =
          "方向对了，但句子里还留着封闭问法（有没有 / 是否）。把前半句删掉，" +
          "直接从“最近一次……”开始，信息量会更高。";
        return;
      }

      if (hasAnchor && hasDetail) {
        feedback.className = "feedback good";
        feedback.textContent =
          "这已经是一句证据题了。再补一句追问：“后来你们改了什么？”——" +
          "好问题不是一次问完，而是能继续往下挖。";
        return;
      }

      if (hasAnchor && !hasDetail) {
        feedback.className = "feedback bad";
        feedback.textContent =
          "有时间锚点了，但还没要求对方讲具体事件。加上“怎么发现的”或" +
          "“后来怎么处理”，让对方无法只给概括。";
        return;
      }

      if (!hasAnchor && hasDetail) {
        feedback.className = "feedback bad";
        feedback.textContent =
          "有具体追问，但缺时间锚点。加上“最近一次”或“上一次”，" +
          "对方更难用“我们一直……”打发你。";
        return;
      }

      feedback.className = "feedback bad";
      feedback.textContent =
        "还像概括题。试试这个骨架：“最近一次［具体事件］是怎么发生的？" +
        "后来你们做了什么？”";
    });

    var reveal = box.querySelector(".rewrite-reveal");
    var target = reveal && document.getElementById(reveal.getAttribute("data-reveal"));
    if (reveal && target) {
      reveal.addEventListener("click", function () {
        target.hidden = !target.hidden;
        reveal.textContent = target.hidden ? "看参考改写" : "收起参考改写";
      });
    }
  }

  function init() {
    document.querySelectorAll(".rewrite").forEach(initRewrite);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
