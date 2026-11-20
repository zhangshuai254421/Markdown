/* ═══════════════════════════════════════════════════════════
   CombinatorLab — Task 组合器实验室(数据驱动,可复用)
   用法:
     CombinatorLab.render(el, {
       title,
       scenarios: [ { name, mode: 'WhenAll'|'WhenAny', summary,
         tasks: [ { name, ms, fail } ] } ]
     });
   播放:时间条按比例生长;每张欠条完成/故障即记账;
   WhenAll = 全部结束才结算;WhenAny = 第一张结束(含故障)即结算,其余继续跑。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    container.classList.add('sim');
    container.textContent = '';

    let timer = null;
    let taskViews = [];

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title;
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.textContent = '合成欠条:—';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    function setBadge(text, state) {
      badge.dataset.state = state || '';
      badge.textContent = text;
    }

    // ── 双面板 ──
    const panels = document.createElement('div');
    panels.className = 'sim-panels';

    // 时间条面板
    const barPanel = document.createElement('div');
    barPanel.className = 'sim-panel';
    const barTitle = document.createElement('div');
    barTitle.className = 'sim-panel-title';
    barTitle.textContent = '并发欠条 · 时间条(右侧完成态)';
    barPanel.appendChild(barTitle);
    const barsBox = document.createElement('div');
    barPanel.appendChild(barsBox);
    panels.appendChild(barPanel);

    // 账本面板
    const bookPanel = document.createElement('div');
    bookPanel.className = 'sim-panel';
    const bookTitle = document.createElement('div');
    bookTitle.className = 'sim-panel-title';
    bookTitle.textContent = '账本 · 逐事件记录';
    bookPanel.appendChild(bookTitle);
    const consoleBox = document.createElement('div');
    consoleBox.className = 'sim-console';
    consoleBox.style.minHeight = '13rem';
    consoleBox.style.border = '0';
    bookPanel.appendChild(consoleBox);
    panels.appendChild(bookPanel);
    container.appendChild(panels);

    function log(text, cls) {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = text;
      consoleBox.appendChild(div);
    }

    function resetView() {
      if (timer) { clearInterval(timer); timer = null; }
      barsBox.textContent = '';
      taskViews = [];
      consoleBox.textContent = '';
      setBadge('合成欠条:—');
      log('> 选场景播放:观察合成欠条何时结算、故障是否传染、其余欠条收尾。', 'ln-dim');
    }

    // ── 场景按钮 ──
    const actions = document.createElement('div');
    actions.className = 'sim-actions';
    cfg.scenarios.forEach(function (sc) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sim-btn';
      b.textContent = '▶ ' + sc.name;
      b.addEventListener('click', function () { play(sc); });
      actions.appendChild(b);
    });
    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'sim-btn reset';
    btnReset.textContent = '↺ 重置';
    btnReset.addEventListener('click', resetView);
    actions.appendChild(btnReset);
    container.appendChild(actions);

    function play(sc) {
      if (timer) { clearInterval(timer); timer = null; }
      barsBox.textContent = '';
      consoleBox.textContent = '';
      log('> 场景:' + sc.name + '(模式:' + sc.mode + ')', 'ln-hi');

      const maxMs = Math.max.apply(null, sc.tasks.map(function (t) { return t.ms; }));
      taskViews = sc.tasks.map(function (t) {
        const row = document.createElement('div');
        row.className = 'cb-task';
        const name = document.createElement('span');
        name.className = 'cb-name';
        name.textContent = t.name;
        const rail = document.createElement('div');
        rail.className = 'cb-rail';
        const bar = document.createElement('div');
        bar.className = 'cb-bar';
        rail.appendChild(bar);
        const status = document.createElement('span');
        status.className = 'cb-status';
        status.textContent = '运行中…';
        row.appendChild(name); row.appendChild(rail); row.appendChild(status);
        barsBox.appendChild(row);
        return { task: t, bar: bar, rail: rail, status: status, finished: false };
      });

      setBadge('合成欠条:等待中', 'waiting');
      let t = 0;
      let settled = false;
      const TICK = 40;

      timer = setInterval(function () {
        t += TICK;
        // 推进时间条
        taskViews.forEach(function (v) {
          if (v.finished) return;
          const pct = Math.min(100, (t / v.task.ms) * 100);
          v.bar.style.width = pct + '%';
        });
        // 结算完成/故障事件(按传入顺序)
        taskViews.forEach(function (v) {
          if (v.finished || t < v.task.ms) return;
          v.finished = true;
          v.bar.style.width = '100%';
          const isWinner = sc.mode === 'WhenAny' &&
            !settled;
          if (v.task.fail) {
            v.bar.classList.add('fail');
            v.status.textContent = '故障!';
            log('【' + v.task.name + '】故障(欠条以 Faulted 完成)' +
                (isWinner ? ' ← 合成欠条此刻即结算:完成 ≠ 成功!' : ''), 'ln-err');
          } else {
            if (isWinner) v.bar.classList.add('win');
            v.status.textContent = '已完成';
            log('【' + v.task.name + '】完成');
          }
          if (isWinner) {
            settled = true;
            v.rail.classList.add('win');
            if (!v.task.fail) {
              log('▶ WhenAny:合成欠条在第一张完成瞬间即结算(' + v.task.name + ' 胜)', 'ln-hi');
              log('  其余欠条仍在跑——生产代码此刻应取消/收尾(0003 竞速模板)');
            }
            setBadge(v.task.fail ? '合成欠条:已结算(胜者故障)' : '合成欠条:已结算(' + v.task.name + ' 胜)', '');
          }
        });
        // WhenAll 结算
        if (sc.mode === 'WhenAll' && !settled &&
            taskViews.every(function (v) { return v.finished; })) {
          settled = true;
          const anyFail = taskViews.some(function (v) { return v.task.fail; });
          if (anyFail) {
            setBadge('合成欠条:已故障', 'faulted');
            log('▶ WhenAll:等全部结束后才故障——失败不传染,其余任务照样跑完', 'ln-err');
            log('  await 处重抛第一个异常;全部异常在 AggregateException 里(0010 展开)');
          } else {
            setBadge('合成欠条:已完成', 'completed');
            log('▶ WhenAll:全部完成才结算——结果按传入顺序排列', 'ln-hi');
          }
        }
        // 收尾
        if (taskViews.every(function (v) { return v.finished; })) {
          clearInterval(timer); timer = null;
          if (sc.mode === 'WhenAny') {
            log('  其余欠条全部结束,场景终了(若无人收尾,它们白跑了一路)', 'ln-dim');
          }
          log('▟ ' + sc.summary, 'ln-ok');
        }
      }, TICK);
    }

    function firstWinner(sc, views) {
      // WhenAny 的胜者 = 最早结束的那张(按 ms,同毫秒按传入顺序)
      let w = views[0];
      views.forEach(function (v) { if (v.task.ms < w.task.ms) w = v; });
      return w.task;
    }

    resetView();
  }

  window.CombinatorLab = { render: render };
})();
