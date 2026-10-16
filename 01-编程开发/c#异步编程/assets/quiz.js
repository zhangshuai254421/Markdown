/* ==========================================================================
   Reusable quiz widget.
   Usage: place a <div class="quiz" data-quiz='...'></div> in a lesson, where
   the attribute is a JSON string:

   {
     "questions": [
       {
         "type": "single" | "multiple",
         "prompt": "...",
         "options": ["...", "..."],
         "answer": 0            // single: index; multiple: [i, j]
         "explanation": "..."
       }
     ]
   }

   Immediate feedback, score tracking, per-question reset.
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderQuestion(q, onGrade) {
    var wrap = el('div', 'quiz-q');
    wrap.appendChild(el('div', 'quiz-prompt', q.prompt));

    var list = el('ul', 'quiz-options');
    var options = [];
    var correct = q.type === 'multiple' ? q.answer : [q.answer];
    var selected = [];

    q.options.forEach(function (text, i) {
      var li = el('li');
      var btn = el('button', 'quiz-option', text);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        if (q.type === 'multiple') {
          var idx = selected.indexOf(i);
          if (idx >= 0) { selected.splice(idx, 1); btn.classList.remove('selected'); }
          else { selected.push(i); btn.classList.add('selected'); }
        } else {
          grade([i], btn);
        }
      });
      li.appendChild(btn);
      list.appendChild(li);
      options.push(btn);
    });
    wrap.appendChild(list);

    var explain = el('div', 'quiz-explain', q.explanation);

    function grade(picked, triggerBtn) {
      var isCorrect = picked.length === correct.length &&
        correct.every(function (c) { return picked.indexOf(c) >= 0; });

      options.forEach(function (b, i) {
        b.disabled = true;
        if (correct.indexOf(i) >= 0) b.classList.add('correct');
        else if (picked.indexOf(i) >= 0) b.classList.add('wrong');
      });

      explain.classList.add('show');
      onGrade(isCorrect);
    }

    if (q.type === 'multiple') {
      var actions = el('div', 'quiz-actions');
      var check = el('button', 'quiz-btn', '确认');
      check.type = 'button';
      check.addEventListener('click', function () {
        if (selected.length === 0) return;
        grade(selected.slice(), check);
        check.disabled = true;
      });
      actions.appendChild(check);
      wrap.appendChild(actions);
    }

    wrap.appendChild(explain);
    return wrap;
  }

  function init(root) {
    var data;
    try { data = JSON.parse(root.getAttribute('data-quiz')); }
    catch (e) { root.textContent = 'Quiz data parse error.'; return; }

    root.innerHTML = '';

    var scoreLine = el('div', 'quiz-score');
    var correctCount = 0;
    var answeredCount = 0;

    function refreshScore() {
      scoreLine.textContent = '答对 ' + correctCount + ' / ' + answeredCount;
    }
    refreshScore();
    root.appendChild(scoreLine);

    data.questions.forEach(function (q) {
      root.appendChild(renderQuestion(q, function (isCorrect) {
        answeredCount++;
        if (isCorrect) correctCount++;
        refreshScore();
      }));
    });
  }

  function boot() {
    var roots = document.querySelectorAll('.quiz[data-quiz]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
