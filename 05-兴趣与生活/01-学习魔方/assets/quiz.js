/* 可复用测验组件 · Reusable multiple-choice quiz widget
   用法：
     <div id="my-quiz"></div>
     <script>CubeQuiz.mount(document.getElementById('my-quiz'), [
       { prompt: '……', options: ['一','二','三','四'], answer: 0, explain: '……' }
     ]);</script>
   选项按等长书写（作者的责任），组件只负责即时反馈。 */
(function () {
  "use strict";

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function mount(container, questions) {
    container.classList.add("quiz");
    var idx = 0;
    var score = 0;

    function render() {
      container.innerHTML = "";
      if (idx >= questions.length) {
        var done = el("div", "q-score");
        done.textContent =
          "测验完成：答对 " + score + " / " + questions.length +
          (score === questions.length ? " —— 全部掌握，可以进入下一步。" : " —— 建议回头再看一遍上面被打勾的概念。");
        container.appendChild(done);
        return;
      }

      var q = questions[idx];
      container.appendChild(el("div", "q-progress", "第 " + (idx + 1) + " 题 / 共 " + questions.length + " 题"));

      container.appendChild(el("div", "q-prompt", q.prompt));

      var opts = el("div", "q-options");
      var feedback = el("div", "q-feedback");
      var nextBtn = el("button", "q-next", idx === questions.length - 1 ? "完成" : "下一题");
      nextBtn.style.display = "none";

      q.options.forEach(function (text, i) {
        var btn = el("button", "q-opt", text);
        btn.addEventListener("click", function () {
          Array.prototype.forEach.call(opts.children, function (b) { b.disabled = true; });
          if (i === q.answer) {
            btn.classList.add("is-correct");
            score++;
            feedback.className = "q-feedback ok show";
            feedback.textContent = "正确。";
          } else {
            btn.classList.add("is-wrong");
            opts.children[q.answer].classList.add("is-correct");
            feedback.className = "q-feedback no show";
            feedback.textContent = "不对，正确答案已标出。";
          }
          if (q.explain) {
            var ex = el("div", "");
            ex.style.marginTop = "0.5em";
            ex.textContent = q.explain;
            feedback.appendChild(ex);
          }
          nextBtn.style.display = "inline-block";
        });
        opts.appendChild(btn);
      });

      nextBtn.addEventListener("click", function () { idx++; render(); });

      container.appendChild(opts);
      container.appendChild(feedback);
      container.appendChild(nextBtn);
    }

    render();
  }

  window.CubeQuiz = { mount: mount };
})();
