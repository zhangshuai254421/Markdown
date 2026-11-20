/* ═══════════════════════════════════════════════════════════
   PoolSimulator — 线程池饥饿模拟器(数据驱动,可复用)
   用法:
     PoolSimulator.render(el, {
       title, workerCount,
       scenarios: [ { name, summary,
         jobs: [ { at: 到达拍, len: 占用拍数(0=零线程), block: 是否阻塞干等, label } ] } ]
     });
   播放:按拍推进——任务到达、进队列、占工人、完成/释放;
   账本面板实时记录"完成 / 排队 / 阻塞工人"。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    container.classList.add('sim');
    container.textContent = '';

    const workerCount = cfg.workerCount || 4;
    let timer = null;

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title;
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.textContent = '状态:—';
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

    // 池面板
    const poolPanel = document.createElement('div');
    poolPanel.className = 'sim-panel';
    const poolTitle = document.createElement('div');
    poolTitle.className = 'sim-panel-title';
    poolTitle.textContent = '线程池 · ' + workerCount + ' 名工人 + 队列';
    poolPanel.appendChild(poolTitle);

    const workersBox = document.createElement('div');
    workersBox.className = 'ps-workers';
    const workerEls = [];
    for (let i = 0; i < workerCount; i++) {
      const w = document.createElement('div');
      w.className = 'ps-worker';
      const wn = document.createElement('div');
      wn.className = 'ps-wname';
      wn.textContent = '工人 ' + (i + 1);
      const wj = document.createElement('div');
      wj.className = 'ps-wjob';
      wj.textContent = '空闲';
      w.appendChild(wn); w.appendChild(wj);
      workersBox.appendChild(w);
      workerEls.push({ el: w, jobEl: wj });
    }
    poolPanel.appendChild(workersBox);

    const queueBox = document.createElement('div');
    queueBox.className = 'ps-queue';
    const qLabel = document.createElement('span');
    qLabel.className = 'ps-queue-label';
    qLabel.textContent = '队列:';
    queueBox.appendChild(qLabel);
    poolPanel.appendChild(queueBox);

    const stats = document.createElement('div');
    stats.className = 'ps-stats';
    poolPanel.appendChild(stats);
    panels.appendChild(poolPanel);

    // 账本面板
    const bookPanel = document.createElement('div');
    bookPanel.className = 'sim-panel';
    const bookTitle = document.createElement('div');
    bookTitle.className = 'sim-panel-title';
    bookTitle.textContent = '账本 · 逐拍记录';
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

    function setWorker(i, cls, jobText) {
      const w = workerEls[i];
      w.el.classList.remove('busy', 'blocked');
      if (cls) w.el.classList.add(cls);
      w.jobEl.textContent = jobText;
    }

    function renderQueue(queue) {
      queueBox.querySelectorAll('.ps-job').forEach(function (j) { j.remove(); });
      queue.forEach(function (job) {
        const chip = document.createElement('span');
        chip.className = 'ps-job';
        chip.textContent = job.label;
        queueBox.appendChild(chip);
      });
    }

    function renderStats(done, queueLen, blockedCount) {
      stats.textContent = '已完成 ' + done + ' · 排队 ' + queueLen +
        ' · 被占工人 ' + blockedCount + ' / ' + workerCount;
    }

    function resetView() {
      if (timer) { clearInterval(timer); timer = null; }
      for (let i = 0; i < workerCount; i++) setWorker(i, null, '空闲');
      renderQueue([]);
      renderStats(0, 0, 0);
      consoleBox.textContent = '';
      setBadge('状态:—');
      log('> 选场景播放,对比三种姿势的工人占用与队列积压。', 'ln-dim');
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
      for (let i = 0; i < workerCount; i++) setWorker(i, null, '空闲');
      renderQueue([]);
      renderStats(0, 0, 0);
      consoleBox.textContent = '';
      log('> 场景:' + sc.name, 'ln-hi');

      let t = 0;
      let done = 0;
      const pending = sc.jobs.slice().sort(function (a, b) { return a.at - b.at; });
      const queue = [];
      const active = [];   // {job, worker, remaining}

      function currentBlocked() {
        return active.filter(function (a) { return a.job.block; }).length;
      }

      function step() {
        // 1) 到达
        while (pending.length && pending[0].at <= t) {
          const job = pending.shift();
          if (job.len === 0) {
            done++;
            log('T' + t + ' 【' + job.label + '】真异步:零线程占用,欠条在外部完成', 'ln-ok');
          } else {
            queue.push(job);
            log('T' + t + ' 【' + job.label + '】到达 → 入队(' + (job.block ? '将干等' : '真干活') + ')');
          }
        }
        // 2) 派工
        for (let w = 0; w < workerCount && queue.length; w++) {
          if (active.some(function (a) { return a.worker === w; })) continue;
          const job = queue.shift();
          active.push({ job: job, worker: w, remaining: job.len });
          setWorker(w, job.block ? 'blocked' : 'busy', job.label + (job.block ? '(干等)' : '(干活)'));
          log('T' + t + ' 【' + job.label + '】→ 工人 ' + (w + 1) +
              (job.block ? ',开始同步干等(占着不干活)' : ',开始干活'));
        }
        // 3) 推进
        for (let i = active.length - 1; i >= 0; i--) {
          active[i].remaining--;
          if (active[i].remaining <= 0) {
            const a = active.splice(i, 1)[0];
            done++;
            setWorker(a.worker, null, '空闲');
            log('T' + t + ' 【' + a.job.label + '】完成,工人 ' + (a.worker + 1) + ' 释放');
          }
        }
        renderQueue(queue);
        renderStats(done, queue.length, currentBlocked());
        const starving = currentBlocked() >= workerCount && queue.length > 0;
        setBadge('T=' + t + ' · 排队 ' + queue.length + (starving ? ' · 饥饿!' : ''),
                 starving ? 'faulted' : (queue.length ? 'waiting' : (active.length ? 'run' : '')));

        // 4) 终止判定
        if (!pending.length && !queue.length && !active.length && t > (sc.jobs[sc.jobs.length - 1] ? sc.jobs[sc.jobs.length - 1].at : 0) + 1) {
          clearInterval(timer); timer = null;
          log('▟ 场景结束:' + sc.summary, 'ln-ok');
          setBadge('完成 · 共 ' + done + ' 件', 'completed');
          return;
        }
        t++;
      }

      step();
      timer = setInterval(step, 850);
    }

    resetView();
  }

  window.PoolSimulator = { render: render };
})();
