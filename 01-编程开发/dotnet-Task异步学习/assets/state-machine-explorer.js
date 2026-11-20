/* ═══════════════════════════════════════════════════════════
   StateExplorer — Task 状态机探索器(数据驱动,可复用)
   用法:
     StateExplorer.render(el, {
       states: [ { id, zone: 'birth'|'run'|'final', label, title,
                   desc, who, exit } ... ],
       scenarios: [ { name, steps: [ { state: id, note } ... ] } ... ]
     });
   交互:点状态胶囊 → 查看详情;点场景 → 逐步播放状态流转与解说。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    container.classList.add('sim');
    container.textContent = '';

    const stateById = {};
    cfg.states.forEach(function (s) { stateById[s.id] = s; });

    let playTimer = null;
    let current = null;

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title || 'Task 状态机:点状态看详情,或播放一个场景';
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.textContent = '未选中状态';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    // ── 状态胶囊 ──
    const chips = document.createElement('div');
    chips.className = 'ste-chips';
    const chipById = {};
    cfg.states.forEach(function (s) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'ste-chip' +
        (s.zone === 'birth' ? ' z-birth' : '') +
        (s.zone === 'final' ? ' z-final' : '');
      c.textContent = s.label;
      c.addEventListener('click', function () {
        stopPlay();
        select(s.id, null);
      });
      chipById[s.id] = c;
      chips.appendChild(c);
    });
    container.appendChild(chips);

    // ── 详情卡 ──
    const detail = document.createElement('div');
    detail.className = 'ste-detail';
    container.appendChild(detail);

    function select(id, note) {
      const s = stateById[id];
      if (!s) return;
      current = id;
      Object.keys(chipById).forEach(function (k) {
        chipById[k].classList.toggle('active', k === id);
      });
      badge.textContent = '当前:' + s.label;
      detail.innerHTML =
        '<div class="d-title">' + s.title + '</div>' +
        '<div class="d-row"><b>含义:</b>' + s.desc + '</div>' +
        '<div class="d-row"><b>谁在这里:</b>' + s.who + '</div>' +
        '<div class="d-row"><b>怎么离开:</b>' + s.exit + '</div>';
      if (note) {
        const n = document.createElement('div');
        n.className = 'd-row';
        n.innerHTML = '<b>此刻:</b>' + note;
        detail.appendChild(n);
      }
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
    btnReset.addEventListener('click', function () { stopPlay(); resetView(); });
    actions.appendChild(btnReset);
    container.appendChild(actions);

    // ── 控制台 ──
    const consoleBox = document.createElement('div');
    consoleBox.className = 'sim-console';
    container.appendChild(consoleBox);

    function log(text, cls) {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = text;
      consoleBox.appendChild(div);
    }

    function resetView() {
      current = null;
      Object.keys(chipById).forEach(function (k) { chipById[k].classList.remove('active'); });
      badge.textContent = '未选中状态';
      detail.innerHTML = '<div class="d-title">提示</div>' +
        '<div class="d-row">点上方胶囊浏览状态,或播放一个场景看完整流转。</div>';
      consoleBox.textContent = '';
    }

    function stopPlay() {
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
    }

    function play(sc) {
      stopPlay();
      resetView();
      log('> 场景:' + sc.name, 'ln-hi');
      let i = 0;
      const step = function () {
        if (i >= sc.steps.length) { stopPlay(); log('(场景播放完毕——重置后再试其他场景)', 'ln-dim'); return; }
        const st = sc.steps[i];
        select(st.state, st.note);
        log('[' + (i + 1) + '] ' + stateById[st.state].label + ' — ' + st.note,
          stateById[st.state].zone === 'final' ? 'ln-ok' : 'ln-dim');
        i++;
      };
      step();
      playTimer = setInterval(step, 1400);
    }

    resetView();
  }

  window.StateExplorer = { render: render };
})();
