/* ═══════════════════════════════════════════════════════════
   DeadlockLoop — 死锁环播放器(数据驱动,可复用)
   用法:
     DeadlockLoop.render(el, {
       title, badgeLabel, ringTitle, rightTitle,
       nodes:  [{ id, name, sub }],   // 4 个,顺序:左上, 右上, 右下, 左下
       arrows: [{ id, label }],       // 4 支,顺序:上(→), 右(↓), 下(←), 左(↑)
       scenarios: [ { name, steps: [ { focus:[ids], alarm, badge, note } ] } ]
     });
   播放:逐步高亮环上节点/箭头,右侧控制台解说,徽章显示状态。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    container.classList.add('sim');
    container.textContent = '';

    let playTimer = null;
    const items = {};   // id → element

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title;
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.textContent = cfg.badgeLabel || '状态:—';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    function setBadge(text, alarm) {
      badge.dataset.state = alarm ? 'faulted' : (text ? 'run' : '');
      badge.textContent = text || (cfg.badgeLabel || '状态:—');
    }

    // ── 双面板 ──
    const panels = document.createElement('div');
    panels.className = 'sim-panels';

    // 环面板:网格 3×3(节点在四角,箭头在四边)
    const ringPanel = document.createElement('div');
    ringPanel.className = 'sim-panel';
    const ringTitle = document.createElement('div');
    ringTitle.className = 'sim-panel-title';
    ringTitle.textContent = cfg.ringTitle || '死锁环 · 四节点';
    ringPanel.appendChild(ringTitle);

    const ring = document.createElement('div');
    ring.className = 'dl-ring';
    const n = cfg.nodes, a = cfg.arrows;
    const layout = [
      { kind: 'node',  data: n[0] }, { kind: 'arrow',  data: a[0] }, { kind: 'node', data: n[1] },
      { kind: 'arrow', data: a[3] }, { kind: 'spacer' },             { kind: 'arrow', data: a[1] },
      { kind: 'node',  data: n[3] }, { kind: 'arrow',  data: a[2] }, { kind: 'node', data: n[2] }
    ];
    layout.forEach(function (cell) {
      const el = document.createElement('div');
      if (cell.kind === 'spacer') {
        el.className = 'dl-spacer';
      } else if (cell.kind === 'node') {
        el.className = 'dl-node';
        const name = document.createElement('div');
        name.className = 'dl-name';
        name.textContent = cell.data.name;
        el.appendChild(name);
        const sub = document.createElement('div');
        sub.className = 'dl-sub';
        sub.innerHTML = cell.data.sub;
        el.appendChild(sub);
        items[cell.data.id] = el;
      } else {
        el.className = 'dl-arrow';
        el.innerHTML = cell.data.label;
        items[cell.data.id] = el;
      }
      ring.appendChild(el);
    });
    ringPanel.appendChild(ring);
    panels.appendChild(ringPanel);

    // 解说面板
    const rightPanel = document.createElement('div');
    rightPanel.className = 'sim-panel';
    const rt = document.createElement('div');
    rt.className = 'sim-panel-title';
    rt.textContent = cfg.rightTitle || '解剖 · 逐步推进';
    rightPanel.appendChild(rt);
    const consoleBox = document.createElement('div');
    consoleBox.className = 'sim-console';
    consoleBox.style.minHeight = '12rem';
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

    function clearMarks() {
      Object.keys(items).forEach(function (k) {
        items[k].classList.remove('focus', 'alarm');
      });
    }

    function resetView() {
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
      clearMarks();
      consoleBox.textContent = '';
      setBadge('');
      log('> 选场景播放:死锁版看环如何闭合;', 'ln-dim');
      log('> 修复版看 ConfigureAwait(false) 如何把环拆掉。', 'ln-dim');
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
      clearMarks();
      consoleBox.textContent = '';
      setBadge('');
      log('> 场景:' + sc.name, 'ln-hi');
      let i = 0;
      const step = function () {
        if (i >= sc.steps.length) {
          clearInterval(playTimer); playTimer = null;
          log('(播放完毕——切另一条路径对照)', 'ln-dim');
          return;
        }
        const st = sc.steps[i];
        clearMarks();
        (st.focus || []).forEach(function (id) {
          if (items[id]) items[id].classList.add(st.alarm ? 'alarm' : 'focus');
        });
        if (st.badge) setBadge(st.badge, st.alarm);
        log((i + 1) + '. ' + st.note,
            st.alarm ? 'ln-err' : (i === sc.steps.length - 1 ? 'ln-ok' : ''));
        i++;
      };
      step();
      playTimer = setInterval(step, 2400);
    }

    resetView();
  }

  window.DeadlockLoop = { render: render };
})();
