/* ═══════════════════════════════════════════════════════════
   StateMachineStepper — await 状态机单步播放器(数据驱动,可复用)
   用法:
     StateMachineStepper.render(el, {
       title, badgeLabel,
       codeTitle, codeLines: ['<span>…</span>', ...],   // HTML 行
       rightTitle,
       scenarios: [ { name, steps: [ { line: 0|-1, status, note } ] } ]
     });
   播放:逐步高亮代码行,右侧控制台解说,徽章实时显示欠条状态。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    container.classList.add('sim');
    container.textContent = '';

    let playTimer = null;
    let lineEls = [];

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title;
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.textContent = cfg.badgeLabel || '欠条状态:—';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    function setBadge(status) {
      badge.dataset.state =
        status === 'RanToCompletion' ? 'completed' :
        status === 'Faulted' || status === 'Canceled' ? 'faulted' :
        status === 'WaitingForActivation' ? 'waiting' :
        status === 'Running' ? 'run' : '';
      badge.textContent = '欠条状态:' + (status || '—');
    }

    // ── 双面板 ──
    const panels = document.createElement('div');
    panels.className = 'sim-panels';

    function makePanel(name) {
      const p = document.createElement('div');
      p.className = 'sim-panel';
      const t = document.createElement('div');
      t.className = 'sim-panel-title';
      t.textContent = name;
      p.appendChild(t);
      return p;
    }

    const codePanel = makePanel(cfg.codeTitle || '编译器产物 · MoveNext 骨架');
    const codeBox = document.createElement('div');
    codeBox.className = 'asm-code';
    cfg.codeLines.forEach(function (html, i) {
      const el = document.createElement('span');
      el.className = 'asm-line';
      el.innerHTML = '<span class="ln-no">' + (i + 1) + '</span>' + html;
      codeBox.appendChild(el);
      lineEls.push(el);
    });
    codePanel.appendChild(codeBox);
    panels.appendChild(codePanel);

    const rightPanel = makePanel(cfg.rightTitle || '解说 · 线程与欠条视角');
    const consoleBox = document.createElement('div');
    consoleBox.className = 'sim-console';
    consoleBox.style.minHeight = '10rem';
    consoleBox.style.border = '0';
    rightPanel.appendChild(consoleBox);
    panels.appendChild(rightPanel);
    container.appendChild(panels);

    function log(text, cls) {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = text;
      consoleBox.appendChild(div);
    }

    function highlight(idx) {
      lineEls.forEach(function (el, i) { el.classList.toggle('current', i === idx); });
    }

    function resetView() {
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
      highlight(-1);
      consoleBox.textContent = '';
      setBadge('');
      log('> 选一个场景播放。慢路径 = 欠条未完成(await 真正"暂停");');
      log('> 快路径 = 欠条早已完成(同步直通,零调度)。', 'ln-dim');
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
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
      highlight(-1);
      consoleBox.textContent = '';
      setBadge('');
      log('> 场景:' + sc.name, 'ln-hi');
      let i = 0;
      const step = function () {
        if (i >= sc.steps.length) {
          clearInterval(playTimer); playTimer = null;
          log('(播放完毕——切换另一条路径对比)', 'ln-dim');
          return;
        }
        const st = sc.steps[i];
        highlight(st.line);
        if (st.status) setBadge(st.status);
        log((i + 1) + '. ' + st.note, i === sc.steps.length - 1 ? 'ln-ok' : '');
        i++;
      };
      step();
      playTimer = setInterval(step, 2200);
    }

    resetView();
  }

  window.StateMachineStepper = { render: render };
})();
