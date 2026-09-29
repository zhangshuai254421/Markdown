/* ============================================================
   共享交互组件 — 地产下行与日本镜鉴
   课程页面在 </body> 前引入本文件即可，无需在页面里写脚本。

   1) 单选测验
      <div class="quiz" data-answer="b">
        <p class="quiz-question">题干？</p>
        <button class="opt" data-key="a">选项一</button>
        <button class="opt" data-key="b">选项二</button>
        <p class="feedback" hidden></p>
      </div>
      可选 data-explain-good / data-explain-bad 自定义反馈文案；
      未提供时给出通用反馈。

   2) 自由回忆
      <button class="reveal-btn" data-reveal="a1">显示参考答案</button>
      <div class="answer" id="a1" hidden>…</div>

   3) 旧式 toggle（兼容其他工作区写法）
      <button onclick="reveal('id')">…</button>
   ============================================================ */

(function () {
  "use strict";

  /* ---- 1) 单选测验 ---- */
  function initQuiz(quiz) {
    var answerKey = quiz.getAttribute("data-answer");
    var opts = Array.prototype.slice.call(quiz.querySelectorAll(".opt"));
    var feedback = quiz.querySelector(".feedback");

    opts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        var picked = opt.getAttribute("data-key");
        var isRight = picked === answerKey;

        // 锁定所有选项，并标出对错
        opts.forEach(function (o) {
          o.disabled = true;
          var mark = document.createElement("span");
          mark.className = "mark";
          if (o.getAttribute("data-key") === answerKey) {
            o.classList.add("correct");
            mark.textContent = "✓";
          } else if (o === opt) {
            o.classList.add("wrong");
            mark.textContent = "✕";
          }
          o.appendChild(mark);
        });

        if (feedback) {
          var custom = quiz.getAttribute(
            isRight ? "data-explain-good" : "data-explain-bad"
          );
          feedback.hidden = false;
          feedback.className = "feedback " + (isRight ? "good" : "bad");
          feedback.textContent =
            custom ||
            (isRight
              ? "正确。这个结论在下一课还会用到——先记住它。"
              : "不对。正确答案已在上面标出。想清楚它为什么对，比记住答案更重要；" +
                "不确定就回去问老师。");
        }
      });
    });
  }

  /* ---- 2) 自由回忆 ---- */
  function initRevealBtn(btn) {
    var target = document.getElementById(btn.getAttribute("data-reveal"));
    if (!target) return;
    btn.addEventListener("click", function () {
      target.hidden = !target.hidden;
      btn.textContent = target.hidden ? "显示参考答案" : "收起参考答案";
    });
  }

  /* ---- 初始化 ---- */
  function init() {
    document.querySelectorAll(".quiz").forEach(initQuiz);
    document.querySelectorAll(".reveal-btn[data-reveal]").forEach(initRevealBtn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* 兼容旧写法：<button onclick="reveal('id')"> */
function reveal(id) {
  var el = document.getElementById(id);
  if (el) el.hidden = !el.hidden;
}
