/* ==========================================================================
   Reusable decision-drill widget（二选一决策训练：剪/留、对/错、A/B……）。

   Usage: place a <div class="drill" data-drill='...'></div> in a lesson.
   The attribute is a JSON string:

   {
     "choices": ["留", "删"],            // 2-3 个按钮文案
     "items": [
       {
         "text": "题干（一段场景描述）",
         "answer": 1,                    // 正确选项的索引
         "explanation": "判定的理由。"
       }
     ]
   }

   一次显示一题 → 选后立即判分并给出解释 → 下一题 → 结束给总结。
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function init(root) {
    var data;
    try { data = JSON.parse(root.getAttribute('data-drill')); }
    catch (e) { root.textContent = 'Drill data parse error.'; return; }

    var items = data.items;
    var choices = data.choices;
    var idx = 0;
    var score = 0;
    var answered = 0;

    root.innerHTML = '';

    var scoreLine = el('div', 'drill-score');
    root.appendChild(scoreLine);

    var card = el('div', 'drill-card');
    root.appendChild(card);

    var actions = el('div', 'drill-actions');
    var buttons = choices.map(function (label) {
      var b = el('button', 'drill-choice', label);
      b.type = 'button';
      actions.appendChild(b);
      return b;
    });
    root.appendChild(actions);

    var feedback = el('div', 'drill-feedback');
    var verdict = el('span', 'verdict');
    var reason = el('span');
    feedback.appendChild(verdict);
    feedback.appendChild(reason);
    root.appendChild(feedback);

    var nextBtn = el('button', 'quiz-btn drill-next',
      idx === items.length - 1 ? '看总结' : '下一题');
    nextBtn.type = 'button';
    root.appendChild(nextBtn);

    var summary = el('div', 'drill-summary');

    function refreshScore() {
      scoreLine.textContent = answered === 0
        ? '第 1 / ' + items.length + ' 题'
        : '第 ' + (idx + 1) + ' / ' + items.length + ' 题 · 答对 ' + score;
    }

    function showItem() {
      card.textContent = items[idx].text;
      buttons.forEach(function (b) { b.disabled = false; b.classList.remove('correct', 'wrong'); });
      feedback.classList.remove('show');
      nextBtn.classList.remove('show');
      refreshScore();
    }

    function answer(picked) {
      var item = items[idx];
      var isCorrect = picked === item.answer;
      answered++;
      if (isCorrect) score++;

      buttons.forEach(function (b, i) {
        b.disabled = true;
        if (i === item.answer) b.classList.add('correct');
        else if (i === picked) b.classList.add('wrong');
      });

      verdict.textContent = isCorrect ? '✓ 判断正确' : '✗ 再想想';
      verdict.className = 'verdict ' + (isCorrect ? 'ok' : 'no');
      reason.textContent = item.explanation;
      feedback.classList.add('show');

      nextBtn.textContent = idx === items.length - 1 ? '看总结' : '下一题';
      nextBtn.classList.add('show');
      refreshScore();
    }

    function showSummary() {
      card.hidden = true;
      actions.hidden = true;
      feedback.hidden = true;
      nextBtn.hidden = true;
      scoreLine.hidden = true;

      var pct = Math.round(score / items.length * 100);
      var big = el('span', 'big', score + ' / ' + items.length);
      var line = el('p');
      line.textContent =
        pct === 100 ? '满分！你的剪辑直觉已经上线。' :
        pct >= 70  ? '不错，判断力基本成型。错的几题看一眼解释，那就是你的盲区。' :
                     '正常起点！把解释读一遍再练一轮，手感很快就来。';
      var again = el('button', 'quiz-btn ghost', '再来一轮');
      again.type = 'button';
      again.addEventListener('click', function () {
        idx = 0; score = 0; answered = 0;
        card.hidden = false; actions.hidden = false;
        feedback.hidden = false; nextBtn.hidden = false;
        scoreLine.hidden = false;
        summary.remove();
        showItem();
      });

      summary.appendChild(big);
      summary.appendChild(line);
      summary.appendChild(again);
      root.appendChild(summary);
    }

    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (!b.disabled) answer(i);
      });
    });
    nextBtn.addEventListener('click', function () {
      if (idx === items.length - 1) { showSummary(); return; }
      idx++;
      showItem();
    });

    showItem();
  }

  function boot() {
    var roots = document.querySelectorAll('.drill[data-drill]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
