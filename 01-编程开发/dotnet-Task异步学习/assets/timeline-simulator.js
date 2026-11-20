/* ═══════════════════════════════════════════════════════════
   TimelineSimulator — 超时时间线模拟器(可复用)
   用法:
     TimelineSimulator.render(el, {
       timeoutAt: 5,          // 超时点(模拟秒)
       durations: [3, 8],     // 可选的工作耗时档位(模拟秒)
       axisMax: 10            // 横轴总长(模拟秒)
     });
   演示:消费者 await Work.WaitAsync(5s);
        工作先完成 → 正常返回,计时器释放;
        工作后完成 → 消费者 5s 处拿到 TimeoutException 离开,
                    8s 处工作完成但结果被丢弃 —— 超时 ≠ 取消。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function render(container, cfg) {
    cfg = cfg || {};
    const timeoutAt = cfg.timeoutAt || 5;
    const durations = cfg.durations || [3, 8];
    const axisMax = cfg.axisMax || 10;
    const TICK = 60;          // ms per tick
    const SPEED = 0.12;       // sim-seconds per tick (≈2x realtime)

    container.classList.add('sim');
    container.textContent = '';

    let duration = durations[durations.length - 1];
    let timer = null;
    let t = 0;
    let workFired = false;
    let timeoutFired = false;

    const pct = function (sec) { return (sec / axisMax) * 100 + '%'; };

    // ── 头部 ──
    const head = document.createElement('div');
    head.className = 'sim-head';
    const title = document.createElement('span');
    title.className = 'sim-title';
    title.textContent = cfg.title || '超时时间线:消费者等 5 秒,底层工作呢?';
    const badge = document.createElement('span');
    badge.className = 'sim-badge';
    badge.dataset.state = 'waiting';
    badge.textContent = 'await 进行中…';
    head.appendChild(title);
    head.appendChild(badge);
    container.appendChild(head);

    function setBadge(kind, text) {
      badge.dataset.state = kind; // waiting | completed | faulted
      badge.textContent = text;
    }

    // ── 控制区 ──
    const controls = document.createElement('div');
    controls.className = 'tl-controls';
    const durLabel = document.createElement('span');
    durLabel.className = 'muted';
    durLabel.style.fontSize = '.82rem';
    durLabel.textContent = '底层工作耗时:';
    controls.appendChild(durLabel);

    const durBtns = [];
    durations.forEach(function (d) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sim-btn' + (d === duration ? ' active' : '');
      b.textContent = d + ' 秒';
      b.addEventListener('click', function () {
        if (timer) return; // 播放中不可切换
        duration = d;
        durBtns.forEach(function (x) { x.el.classList.toggle('active', x.d === d); });
        reset();
      });
      durBtns.push({ d: d, el: b });
      controls.appendChild(b);
    });

    const gap = document.createElement('span');
    gap.className = 'tl-gap';
    controls.appendChild(gap);

    const btnPlay = document.createElement('button');
    btnPlay.type = 'button';
    btnPlay.className = 'sim-btn';
    btnPlay.textContent = '▶ 播放';
    controls.appendChild(btnPlay);

    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'sim-btn reset';
    btnReset.textContent = '↺ 重置';
    controls.appendChild(btnReset);
    container.appendChild(controls);

    // ── 两条时间线 ──
    function makeTrack(label, barCls) {
      const wrap = document.createElement('div');
      wrap.className = 'tl-track';
      const lab = document.createElement('div');
      lab.className = 'tl-track-label';
      lab.textContent = label;
      const rail = document.createElement('div');
      rail.className = 'tl-rail';
      const bar = document.createElement('div');
      bar.className = 'tl-bar ' + barCls;
      rail.appendChild(bar);
      wrap.appendChild(lab);
      wrap.appendChild(rail);
      return { rail: rail, bar: bar };
    }

    const consumerTrack = makeTrack('消费者 · await … .WaitAsync(5s)', 'consumer');
    const workTrack = makeTrack('底层工作 · 硬件读取/HTTP 请求…', 'work');
    container.appendChild(consumerTrack.rail.parentElement);
    container.appendChild(workTrack.rail.parentElement);

    // 超时标记线(两条轨道都有)
    [consumerTrack, workTrack].forEach(function (tr) {
      const m = document.createElement('div');
      m.className = 'tl-marker';
      m.style.left = pct(timeoutAt);
      m.dataset.label = '超时 ' + timeoutAt + 's';
      tr.rail.appendChild(m);
    });

    function placeFlag(track, atSec, text, cls) {
      const f = document.createElement('div');
      f.className = 'tl-flag ' + cls;
      f.style.left = 'calc(' + pct(atSec) + ' - 4px)';
      f.textContent = text;
      track.rail.appendChild(f);
    }

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

    // ── 播放逻辑 ──
    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      t = 0; workFired = false; timeoutFired = false;
      consumerTrack.bar.style.width = '0%';
      workTrack.bar.style.width = '0%';
      [consumerTrack, workTrack].forEach(function (tr) {
        tr.rail.querySelectorAll('.tl-flag').forEach(function (f) { f.remove(); });
      });
      setBadge('waiting', 'await 进行中…');
      btnPlay.disabled = false;
      consoleBox.textContent = '';
      line('> double temp = await 工作.WaitAsync(TimeSpan.FromSeconds(' + timeoutAt + '));');
    }
    btnReset.addEventListener('click', reset);
    btnPlay.addEventListener('click', function () {
      btnPlay.disabled = true;
      timer = setInterval(tick, TICK);
    });

    function tick() {
      t += SPEED;
      const cap = Math.max(duration, timeoutAt);
      consumerTrack.bar.style.width = pct(Math.min(t, timeoutAt));
      workTrack.bar.style.width = pct(Math.min(t, duration));

      if (!timeoutFired && t >= timeoutAt) {
        timeoutFired = true;
        if (duration > timeoutAt) {
          setBadge('faulted', 'TimeoutException');
          placeFlag(consumerTrack, timeoutAt, '抛 TimeoutException,消费者离开', 'bad');
          line('[t=' + timeoutAt.toFixed(1) + 's] 超时!WaitAsync 让 await 抛出 TimeoutException —— 消费者已离开', 'ln-err');
        } else {
          line('[t=' + timeoutAt.toFixed(1) + 's] (工作早已完成,超时线安然划过,无事发生)', 'ln-dim');
        }
      }

      if (!workFired && t >= duration) {
        workFired = true;
        if (duration <= timeoutAt) {
          setBadge('completed', 'RanToCompletion');
          placeFlag(consumerTrack, duration, 'await 返回 ✓', 'ok');
          placeFlag(workTrack, duration, 'TrySetResult → true', 'ok');
          line('[t=' + duration.toFixed(1) + 's] 工作完成 → TrySetResult(36.5) 返回 true', 'ln-hi');
          line('[t=' + duration.toFixed(1) + 's] 消费者拿到结果,await 正常返回 ✓', 'ln-ok');
          line('[t=' + duration.toFixed(1) + 's] 计时器随之释放,零泄漏 ✓', 'ln-dim');
        } else {
          placeFlag(workTrack, duration, 'TrySetResult → false', 'bad');
          line('[t=' + duration.toFixed(1) + 's] 底层工作终于完成 → TrySetResult 返回 false,结果被静默丢弃', 'ln-dim');
          line('注意:底层操作从未被"终止",只是没有人再等它了 —— 超时 ≠ 取消', 'ln-err');
        }
      }

      if ((timeoutFired && workFired) || t >= cap + 0.5) {
        clearInterval(timer);
        timer = null;
      }
    }

    reset();
  }

  window.TimelineSimulator = { render: render };
})();
