/* ═══════════════════════════════════════════════════════════
   RaceSimulator — TrySet* 竞态模拟器(可复用)
   用法:
     RaceSimulator.render(el, {
       pathA: { name: '路径 A · 结果到达', call: 'tcs.TrySetResult(36.5)',
                okLine: 'TrySetResult 返回 true', winEcho: '收到 36.5' },
       pathB: { name: '路径 B · 超时到点', call: 'tcs.TrySetException(new TimeoutException())',
                okLine: 'TrySetException 返回 true', winEcho: 'Unhandled exception. TimeoutException' }
     });
   演示:两条路径竞速销账;完成后另一路径 TrySet* 返回 false、静默放弃。
   按钮始终可点(鼓励反复实验),只有"重置"恢复初始态。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    container.classList.add('sim');
    container.textContent = '';

    let state = 'waiting'; // waiting | completed | faulted

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title || '竞态实验:两条路径抢一张欠条';
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.dataset.state = 'waiting';
    badge.textContent = 'Task 状态:WaitingForActivation';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    function setBadge(next, who) {
      state = next;
      badge.dataset.state = next;
      badge.textContent =
        next === 'waiting' ? 'Task 状态:WaitingForActivation' :
        next === 'completed' ? 'RanToCompletion(赢家:' + who + ')' :
        'Faulted(赢家:' + who + ')';
    }

    // ── 两条竞速路径按钮 ──
    const actions = document.createElement('div');
    actions.className = 'sim-actions';
    const btnA = document.createElement('button');
    btnA.className = 'sim-btn';
    btnA.textContent = '⚡ ' + cfg.pathA.name;
    const btnB = document.createElement('button');
    btnB.className = 'sim-btn danger';
    btnB.textContent = '⏱ ' + cfg.pathB.name;
    const btnReset = document.createElement('button');
    btnReset.className = 'sim-btn reset';
    btnReset.textContent = '↺ 重置';
    actions.appendChild(btnA);
    actions.appendChild(btnB);
    actions.appendChild(btnReset);
    container.appendChild(actions);

    // ── 控制台 ──
    const consoleBox = document.createElement('div');
    consoleBox.className = 'sim-console';
    container.appendChild(consoleBox);

    function line(text, cls) {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = text;
      consoleBox.appendChild(div);
    }

    function attempt(which) {
      const p = which === 'a' ? cfg.pathA : cfg.pathB;
      const btn = which === 'a' ? btnA : btnB;
      line('> ' + p.name + ' 调用 ' + p.call, 'ln-hi');

      if (state === 'waiting') {
        // 抢到销账权
        const completed = which === 'a';
        setBadge(completed ? 'completed' : 'faulted', which === 'a' ? '结果路径' : '超时路径');
        line((completed ? p.okLine : p.okLine) + ' → 抢到销账权,Task → ' +
          (completed ? 'RanToCompletion' : 'Faulted'), 'ln-dim');
        line(p.winEcho, completed ? 'ln-ok' : 'ln-err');
      } else {
        // 被抢先
        line('↳ TrySet* 返回 false → 欠条已被抢先销账。不抛异常、静默放弃,调用方毫无感知。', 'ln-dim');
        line('(这条路径的"完成"被丢弃了 —— 这正是 Try* 的容错语义)', 'ln-dim');
      }
    }

    btnA.addEventListener('click', function () { attempt('a'); });
    btnB.addEventListener('click', function () { attempt('b'); });
    btnReset.addEventListener('click', function () {
      setBadge('waiting', '');
      consoleBox.textContent = '';
      line('> await tcs.Task;(消费者挂起,不占线程,两条路径随时可以开抢)');
    });

    // 初始
    line('> await tcs.Task;(消费者挂起,不占线程,两条路径随时可以开抢)');
  }

  window.RaceSimulator = { render: render };
})();
