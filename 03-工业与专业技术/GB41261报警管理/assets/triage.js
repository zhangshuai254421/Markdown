/* ==========================================================================
   Reusable triage widget — classify scenario cards as 报警 / 事件 / 提示.
   (New component for the GB/T 41261 alarm-management course.)

   Usage: place a <div class="triage" data-triage='...'></div> in a lesson,
   where the attribute is a JSON string:

   {
     "items": [
       {
         "scenario": "...",      // one-line situation
         "detail": "...",        // supporting detail (optional)
         "answer": "alarm",      // "alarm" | "event" | "notice"
         "explanation": "..."
       }
     ]
   }

   Immediate feedback per card, score tracking.
   ========================================================================== */
(function () {
  'use strict';

  var LABELS = { alarm: '报警', event: '事件', notice: '提示' };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderItem(item) {
    var card = el('div', 'triage-card');
    card.appendChild(el('div', 'triage-scenario', item.scenario));
    if (item.detail) card.appendChild(el('div', 'triage-detail', item.detail));

    var choices = el('div', 'triage-choices');
    var explain = el('div', 'triage-explain', item.explanation);

    Object.keys(LABELS).forEach(function (key) {
      var btn = el('button', 'triage-btn', LABELS[key]);
      btn.type = 'button';
      btn.dataset.key = key;
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var isCorrect = key === item.answer;
        card.classList.add(isCorrect ? 'correct' : 'wrong');

        Array.prototype.forEach.call(choices.children, function (b) {
          b.disabled = true;
          if (b.dataset.key === item.answer) b.classList.add('right');
          else if (b === btn) b.classList.add('miss');
        });

        explain.classList.add('show');
        card.dispatchEvent(new CustomEvent('triage:graded', {
          bubbles: true,
          detail: { correct: isCorrect }
        }));
      });
      choices.appendChild(btn);
    });

    card.appendChild(choices);
    card.appendChild(explain);
    return card;
  }

  function init(root) {
    var data;
    try { data = JSON.parse(root.getAttribute('data-triage')); }
    catch (e) { root.textContent = 'Triage data parse error.'; return; }

    root.innerHTML = '';

    var scoreLine = el('div', 'triage-score');
    var correctCount = 0;
    var answeredCount = 0;

    function refreshScore() {
      scoreLine.textContent = '判断正确 ' + correctCount + ' / ' + answeredCount;
    }
    refreshScore();
    root.appendChild(scoreLine);

    data.items.forEach(function (item) {
      var card = renderItem(item);
      card.addEventListener('triage:graded', function (evt) {
        answeredCount++;
        if (evt.detail.correct) correctCount++;
        refreshScore();
      });
      root.appendChild(card);
    });
  }

  function boot() {
    var roots = document.querySelectorAll('.triage[data-triage]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
