/* ═══════════════════════════════════════════════════════════
   TcsSimulator — TaskCompletionSource 交互模拟器(可复用)
   用法:
     TcsSimulator.render(el, {
       resultCall: 'tcs.SetResult("温度 = 36.5℃")',   // 生产者按钮文案里体现的调用
       resultEcho: '温度 = 36.5℃',                     // 消费者收到的值
       exceptionCall: 'tcs.SetException(...)',
       exceptionName: 'TimeoutException',
       exceptionEcho: 'TimeoutException: 设备未响应'
     });
   演示:Task 状态 WaitingForActivation → RanToCompletion / Faulted,
        以及"谁调 Set*,await 的续延就在谁的线程上恢复"。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    cfg = cfg || {};
    container.classList.add('sim');
    container.textContent = '';

    let state = 'waiting'; // waiting | completed | faulted

    // ── 头部:标题 + 状态徽章 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title || '模拟器:一张欠条(Task)的一生';
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.dataset.state = 'waiting';
    badge.textContent = 'Task 状态:WaitingForActivation';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    function setBadge(next) {
      state = next;
      badge.dataset.state = next;
      badge.textContent =
        next === 'waiting' ? 'Task 状态:WaitingForActivation' :
        next === 'completed' ? 'Task 状态:RanToCompletion' :
        'Task 状态:Faulted';
    }

    // ── 双面板:生产者 / 消费者 ──
    const panels = document.createElement('div');
    panels.className = 'sim-panels';

    function makePanel(name, codeHtml) {
      const p = document.createElement('div');
      p.className = 'sim-panel';
      const t = document.createElement('div');
      t.className = 'sim-panel-title';
      t.textContent = name;
      const code = document.createElement('pre');
      code.innerHTML = codeHtml;
      p.appendChild(t);
      p.appendChild(code);
      return p;
    }

    const producerCode =
      '<span class="cmt">// 生产者:亲手控制欠条何时销账</span>\n' +
      'var tcs = new TaskCompletionSource&lt;double&gt;();\n' +
      'sensor.Read(\n' +
      '    onSuccess: v =&gt; <span class="hl">tcs.SetResult(v)</span>,\n' +
      '    onError:   ex =&gt; <span class="hl">tcs.SetException(ex)</span>);';

    const consumerCode =
      '<span class="cmt">// 消费者:只管 await,不关心谁完成</span>\n' +
      'Console.WriteLine("发起读取…");\n' +
      'var result = <span class="hl">await tcs.Task;</span>\n' +
      'Console.WriteLine($"收到 {result}");';

    panels.appendChild(makePanel('生产者 · PRODUCER', producerCode));
    panels.appendChild(makePanel('消费者 · CONSUMER', consumerCode));
    container.appendChild(panels);

    // ── 操作按钮 ──
    const actions = document.createElement('div');
    actions.className = 'sim-actions';
    const btnOk = document.createElement('button');
    btnOk.className = 'sim-btn';
    btnOk.textContent = '✔ 回调到达:' + (cfg.resultCall || 'tcs.SetResult(36.5)');
    const btnErr = document.createElement('button');
    btnErr.className = 'sim-btn danger';
    btnErr.textContent = '✘ 回调出错:' + (cfg.exceptionCall || 'tcs.SetException(ex)');
    const btnAgain = document.createElement('button');
    btnAgain.className = 'sim-btn danger';
    btnAgain.textContent = '⚠ 再 Set 一次(试试?)';
    const btnReset = document.createElement('button');
    btnReset.className = 'sim-btn reset';
    btnReset.textContent = '↺ 重置';
    actions.appendChild(btnOk);
    actions.appendChild(btnErr);
    actions.appendChild(btnAgain);
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
      setBadge('waiting');
      consoleBox.textContent = '';
      btnOk.disabled = false;
      btnErr.disabled = false;
      btnAgain.disabled = false;
      line('> 发起读取…(消费者线程 await 处暂停,自己回线程池干别的活了 —— 没有线程在干等)');
    }
    btnReset.addEventListener('click', reset);

    function complete(kind) {
      if (state !== 'waiting') {
        line('✗ InvalidOperationException: Task 已完成,不能再次 Set*!这就是"欠条只能销一次账"。', 'ln-err');
        return;
      }
      if (kind === 'ok') {
        setBadge('completed');
        btnOk.disabled = true;
        btnErr.disabled = true;
        btnAgain.disabled = true;
        line('> 回调到达,生产者调用 ' + (cfg.resultCall || 'tcs.SetResult(36.5)'), 'ln-hi');
        line('↳ Task → RanToCompletion;await 处的续延默认在【回调线程】上恢复执行', 'ln-dim');
        line('收到 ' + (cfg.resultEcho || '36.5'), 'ln-ok');
      } else {
        setBadge('faulted');
        btnOk.disabled = true;
        btnErr.disabled = true;
        btnAgain.disabled = true;
        line('> 回调出错,生产者调用 ' + (cfg.exceptionCall || 'tcs.SetException(ex)'), 'ln-hi');
        line('↳ Task → Faulted;await 处重新抛出异常(而不是返回默认值)', 'ln-dim');
        line('Unhandled exception. ' + (cfg.exceptionEcho || 'TimeoutException: 设备未响应'), 'ln-err');
      }
    }
    btnOk.addEventListener('click', function () { complete('ok'); });
    btnErr.addEventListener('click', function () { complete('err'); });
    btnAgain.addEventListener('click', complete);

    reset();
  }

  window.TcsSimulator = { render: render };
})();
