/* ═══════════════════════════════════════════════════════════
   TeachQuiz — 课程可复用检索练习组件
   用法:
     TeachQuiz.render(document.querySelector('#quiz'), [
       { q: '题干', options: ['A文本','B文本','C文本','D文本'],
         answer: 0, explain: '解析(答后显示)' }, ...
     ]);
   行为:单选即时反馈 → 全部答完出分 → 可重做(选项顺序打乱)。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scoreMessage(ratio) {
    if (ratio === 1) return '全对!这不是流畅的错觉,是存储强度在真实增长。';
    if (ratio >= 0.5) return '不错——错的题恰恰是明天复习时最值钱的。';
    return '别灰心:检索失败留下的记忆痕迹,比顺利回忆更深。回去重读对应小节再试。';
  }

  function render(container, questions) {
    container.classList.add('quiz');
    container.textContent = '';

    const total = questions.length;
    let answered = 0;
    let score = 0;

    let scoreBox = null;

    questions.forEach(function (item, qi) {
      const card = document.createElement('div');
      card.className = 'quiz-q';

      const qText = document.createElement('p');
      qText.className = 'q-text';
      qText.textContent = 'Q' + (qi + 1) + ' · ' + item.q;
      card.appendChild(qText);

      const explain = document.createElement('div');
      explain.className = 'quiz-explain';
      explain.textContent = item.explain || '';

      // 为每题生成打乱后的选项(记录正确项)
      const opts = item.options.map(function (text, i) {
        return { text: text, correct: i === item.answer };
      });

      shuffle(opts).forEach(function (opt) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opt';
        btn.textContent = opt.text;
        btn.addEventListener('click', function () {
          if (card.dataset.done === '1') return;
          card.dataset.done = '1';
          answered++;
          if (opt.correct) score++;
          // 上色:选错的标红,正确项标绿
          Array.prototype.forEach.call(card.querySelectorAll('.quiz-opt'), function (b) {
            b.disabled = true;
            if (b.textContent === opt.text && !opt.correct) b.classList.add('wrong');
            if (b.textContent === opt.text && opt.correct) b.classList.add('correct');
          });
          // 正确项无论如何都标出(若用户选错)
          if (!opt.correct) {
            Array.prototype.forEach.call(card.querySelectorAll('.quiz-opt'), function (b) {
              const thisOpt = opts.find(function (o) { return o.text === b.textContent; });
              if (thisOpt && thisOpt.correct) b.classList.add('correct');
            });
          }
          explain.classList.add('show');
          maybeFinish();
        });
        card.appendChild(btn);
      });

      card.appendChild(explain);
      container.appendChild(card);
    });

    function maybeFinish() {
      if (answered < total) return;
      scoreBox = document.createElement('div');
      scoreBox.className = 'quiz-score';
      scoreBox.textContent = '得分 ' + score + ' / ' + total + ' — ' + scoreMessage(score / total);
      const retake = document.createElement('button');
      retake.type = 'button';
      retake.className = 'quiz-retake';
      retake.textContent = '隔一会儿再来一遍(选项会重新打乱)';
      retake.addEventListener('click', function () {
        render(container, questions);
      });
      container.appendChild(scoreBox);
      container.appendChild(retake);
    }
  }

  window.TeachQuiz = { render: render };
})();
