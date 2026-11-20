/* ═══════════════════════════════════════════════════════════
   EventRaceSimulator — "先订阅 vs 先检查"竞态模拟器(可复用)
   用法:
     EventRaceSimulator.render(el, { eventName: 'Connected' });
   演示:一次性事件可能在"检查状态"与"订阅事件"两行之间触发。
        A 版(先检查后订阅)→ 事件溜走 → 永久悬挂;
        B 版(先订阅后检查)→ 检查兜底 → 立即返回。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    cfg = cfg || {};
    const eventName = cfg.eventName || 'Connected';

    container.classList.add('sim');
    container.textContent = '';

    let eventFired = false;
    const st = {
      a: 'idle',  // idle | suspended | ok
      b: 'idle'
    };

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = '实验:' + eventName + ' 事件,会在任意时刻触发一次';
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.dataset.state = 'waiting';
    badge.textContent = eventName + ' 事件:未触发';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    // ── 按钮 ──
    const actions = document.createElement('div');
    actions.className = 'sim-actions';
    const btnEvent = document.createElement('button');
    btnEvent.className = 'sim-btn';
    btnEvent.textContent = '⚡ ' + eventName + ' 事件触发(随时点)';
    const btnA = document.createElement('button');
    btnA.className = 'sim-btn danger';
    btnA.textContent = 'A 版调用:先检查,后订阅';
    const btnB = document.createElement('button');
    btnB.className = 'sim-btn';
    btnB.textContent = 'B 版调用:先订阅,后检查';
    const btnReset = document.createElement('button');
    btnReset.className = 'sim-btn reset';
    btnReset.textContent = '↺ 重置';
    actions.appendChild(btnEvent);
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

    function reset() {
      eventFired = false;
      st.a = 'idle'; st.b = 'idle';
      badge.dataset.state = 'waiting';
      badge.textContent = eventName + ' 事件:未触发';
      consoleBox.textContent = '';
      line('> 场景:客户端 ' + eventName + ' 事件只触发一次,时机不由你控制。');
      line('> 两种写法,谁能安全等到它?', 'ln-dim');
    }
    btnReset.addEventListener('click', reset);

    function runA() {
      if (st.a !== 'idle') { line('【A 版】已在执行中(重置后再试)', 'ln-dim'); return; }
      line('【A 版】① 检查 IsConnected → ' + (eventFired ? 'true' : 'false'), 'ln-hi');
      if (eventFired) {
        st.a = 'ok';
        line('【A 版】已连接 → TrySetResult → await 立即返回 ✓', 'ln-ok');
      } else {
        st.a = 'suspended';
        line('【A 版】② 未连接 → 订阅事件 → await 挂起…', 'ln-dim');
        line('⚠ 但事件此刻已经放完了!若不再有下一次连接,A 版将永久悬挂', 'ln-err');
      }
    }

    function runB() {
      if (st.b !== 'idle') { line('【B 版】已在执行中(重置后再试)', 'ln-dim'); return; }
      line('【B 版】① 先订阅 ' + eventName + ' 事件', 'ln-hi');
      if (eventFired) {
        st.b = 'ok';
        line('【B 版】② 检查 IsConnected → true → 退订 → TrySetResult → 立即返回 ✓', 'ln-ok');
        line('这就是"先订阅后检查"的价值:事件来早了也接得住', 'ln-dim');
      } else {
        st.b = 'suspended';
        line('【B 版】② 检查未连接 → await 挂起(事件将来触发时会被唤醒)', 'ln-dim');
      }
    }

    function fireEvent() {
      if (eventFired) {
        line('⚡ ' + eventName + ' 再次触发(一次性等待只认第一次,后续触发被退订挡住)', 'ln-dim');
        return;
      }
      eventFired = true;
      badge.dataset.state = 'completed';
      badge.textContent = eventName + ' 事件:已触发';
      line('⚡ ' + eventName + ' 事件触发!', 'ln-hi');
      if (st.b === 'suspended') {
        st.b = 'ok';
        line('【B 版】处理器被调用 → 退订 → TrySetResult → await 恢复 ✓', 'ln-ok');
      }
      if (st.a === 'suspended') {
        st.a = 'ok';
        line('【A 版】处理器也被调用了(它订阅晚了,但还赶上了这一次)→ 恢复 ✓', 'ln-dim');
        line('注意:A 版真正的死穴是"事件先于订阅"的场景——先点⚡,再点 A 版看看', 'ln-dim');
      }
      if (st.a === 'idle' && st.b === 'idle') {
        line('(此刻没有任何等待者订阅——事件就这样白白放走了。先触发再调用试试?)', 'ln-dim');
      }
    }

    btnEvent.addEventListener('click', fireEvent);
    btnA.addEventListener('click', runA);
    btnB.addEventListener('click', runB);

    reset();
  }

  window.EventRaceSimulator = { render: render };
})();
