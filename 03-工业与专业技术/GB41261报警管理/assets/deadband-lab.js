/* ==========================================================================
   Deadband lab — interactive chattering-alarm tuner.
   (New component for the GB/T 41261 alarm-management course.)

   Usage: <div class="deadlab" data-lab='{"limit":250,"unit":"℃"}'></div>

   Deterministic synthetic signal (seeded PRNG): a slow wander that hovers
   around the limit plus two fast spikes. The student tunes deadband and
   on-delay and watches the annunciation count change on the SAME signal —
   same process, different design.

   Canvas follows the course dataviz rules: 2px ink signal line, recessive
   hairline grid, dashed reference line, direct labels (no legend box),
   status strip in red vs neutral gray (CVD-validated pair) with the state
   always also carried by a text badge and the count.
   ========================================================================== */
(function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  var COLORS = {
    ink: '#1c1b1a', muted: '#6f6a63', faint: '#9a948c',
    rule: '#e4ded6', accent: '#b45309', accentSoft: '#f9efdd',
    alarm: '#b3261e', calm: '#d8d2c9', paper: '#fffffb'
  };

  var DURATION = 60, DT = 0.1, N = 601, SPEED = 6; // 60 sim-seconds ≈ 10 real seconds

  function makeSignal() {
    var rnd = mulberry32(11);
    function gauss() {
      var u = 0, v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    var w = 0, vals = [];
    for (var i = 0; i < N; i++) {
      var t = i * DT;
      w += (0 - w) * 0.06 + gauss() * 0.26;
      w = Math.max(-1.2, Math.min(1.2, w));
      var wander = 2.6 * Math.sin(2 * Math.PI * t / 38) + 2.0 * Math.sin(2 * Math.PI * t / 13 + 2.1);
      var spiky = (t > 18 && t < 18.9 ? 2.6 : 0) + (t > 41 && t < 41.6 ? 2.4 : 0);
      vals.push(247.4 + wander * 0.95 + w + spiky);
    }
    return vals;
  }

  function init(root) {
    var cfg;
    try { cfg = JSON.parse(root.getAttribute('data-lab')); }
    catch (e) { root.textContent = 'Lab data parse error.'; return; }

    var limit = cfg.limit;
    var unit = cfg.unit || '';
    var vals = makeSignal();

    var vMin = 245, vMax = 254; // fixed scale keeps the comparison honest

    var deadband = 0, onDelay = 0;
    var cursor = 0, playing = true, lastTick = null;
    var idx = 0, inAlarm = false, over = 0, count = 0, spans = [];

    // ---- DOM skeleton ----
    var stats = el('div', 'lab-stats');
    var valueTile = el('div', 'lab-tile');  valueTile.appendChild(el('div', 'lab-k', '当前值'));
    var valOut = el('div', 'lab-v', '—');   valueTile.appendChild(valOut);
    var countTile = el('div', 'lab-tile');  countTile.appendChild(el('div', 'lab-k', '60 秒报警次数'));
    var cntOut = el('div', 'lab-v big', '0'); countTile.appendChild(cntOut);
    var stateTile = el('div', 'lab-tile');  stateTile.appendChild(el('div', 'lab-k', '状态'));
    var stOut = el('div', 'lab-badge calm', '正常'); stateTile.appendChild(stOut);
    stats.appendChild(valueTile); stats.appendChild(countTile); stats.appendChild(stateTile);

    var canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 240;
    canvas.className = 'lab-canvas';

    var readout = el('div', 'lab-readout', '悬停查看曲线读数');

    var controls = el('div', 'lab-controls');
    function slider(labelText, min, max, step, val, onInput) {
      var wrap = el('label', 'lab-slider');
      wrap.appendChild(el('span', 'lab-slider-name', labelText));
      var input = document.createElement('input');
      input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = val;
      var out = el('span', 'lab-slider-out', val);
      input.addEventListener('input', function () {
        out.textContent = input.value;
        onInput(parseFloat(input.value));
      });
      wrap.appendChild(input); wrap.appendChild(out);
      controls.appendChild(wrap);
      return input;
    }
    slider('死区（回差）', 0, 3, 0.5, 0, function (v) { deadband = v; restart(); });
    slider('触发延时', 0, 3, 0.5, 0, function (v) { onDelay = v; restart(); });

    var btnRow = el('div', 'lab-btns');
    var btnRun = el('button', 'lab-btn', '重跑');
    btnRun.type = 'button';
    btnRun.addEventListener('click', function () { restart(); playing = true; btnPause.textContent = '暂停'; });
    var btnPause = el('button', 'lab-btn ghost', '暂停');
    btnPause.type = 'button';
    btnPause.addEventListener('click', function () {
      playing = !playing;
      btnPause.textContent = playing ? '暂停' : '继续';
    });
    btnRow.appendChild(btnRun); btnRow.appendChild(btnPause);

    root.appendChild(stats);
    root.appendChild(canvas);
    root.appendChild(readout);
    root.appendChild(controls);
    root.appendChild(btnRow);

    // ---- simulation ----
    var alarmSpans = []; // [start, end] in sim-seconds
    function restart() {
      cursor = 0; idx = 0; inAlarm = false; over = 0; count = 0;
      spans = []; alarmSpans = [];
    }

    function advanceTo(t) {
      while (idx < N && idx * DT <= t) {
        var v = vals[idx];
        if (!inAlarm) {
          if (v > limit) {
            over += DT;
            if (over >= onDelay) {
              inAlarm = true; count++;
              alarmSpans.push([idx * DT - Math.min(over, onDelay), null]);
              over = 0;
            }
          } else over = 0;
        } else {
          if (v < limit - deadband) {
            inAlarm = false;
            if (alarmSpans.length && alarmSpans[alarmSpans.length - 1][1] === null)
              alarmSpans[alarmSpans.length - 1][1] = idx * DT;
          }
        }
        idx++;
      }
      if (inAlarm && alarmSpans.length && alarmSpans[alarmSpans.length - 1][1] === null)
        alarmSpans[alarmSpans.length - 1][1] = t;
      cursor = t;
    }

    // ---- drawing ----
    var ctx = canvas.getContext('2d');
    var PADL = 34, PADR = 58, PADT = 10, STRIP_H = 14, STRIP_GAP = 8;
    var plotH = 240 - PADT - STRIP_H - STRIP_GAP - 22;
    var plotW = 640 - PADL - PADR;

    function xOf(t) { return PADL + (t / DURATION) * plotW; }
    function yOf(v) { return PADT + (1 - (v - vMin) / (vMax - vMin)) * plotH; }

    function draw() {
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(0, 0, 640, 240);

      // deadband band (also the sensitivity blind zone)
      if (deadband > 0) {
        ctx.fillStyle = COLORS.accentSoft;
        ctx.fillRect(PADL, yOf(limit), plotW, yOf(limit - deadband) - yOf(limit));
      }

      // recessive grid: horizontal hairlines at 246/248/250/252/254
      ctx.strokeStyle = COLORS.rule; ctx.lineWidth = 1;
      for (var gv = 246; gv <= 254; gv += 2) {
        ctx.beginPath();
        ctx.moveTo(PADL, yOf(gv)); ctx.lineTo(PADL + plotW, yOf(gv));
        ctx.stroke();
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(String(gv), PADL - 5, yOf(gv) + 4);
      }
      // x ticks
      ctx.textAlign = 'center';
      for (var gt = 0; gt <= 60; gt += 15) {
        ctx.fillText(gt + 's', xOf(gt), 240 - 6);
      }

      // limit line (dashed) + direct label
      ctx.strokeStyle = COLORS.faint; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(PADL, yOf(limit)); ctx.lineTo(PADL + plotW, yOf(limit));
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COLORS.muted; ctx.textAlign = 'left';
      ctx.fillText('限值 ' + limit + unit, PADL + plotW + 5, yOf(limit) + 4);
      if (deadband > 0) {
        ctx.fillText('死区 ' + deadband + unit, PADL + plotW + 5, (yOf(limit) + yOf(limit - deadband)) / 2 + 4);
      }

      // signal line up to cursor (2px ink)
      var upto = Math.min(N - 1, Math.floor(cursor / DT));
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= upto; i++) {
        var x = xOf(i * DT), y = yOf(vals[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (upto >= 0) {
        ctx.fillStyle = COLORS.ink;
        ctx.beginPath();
        ctx.arc(xOf(upto * DT), yOf(vals[upto]), 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // alarm strip: red spans on neutral gray
      var sy = PADT + plotH + STRIP_GAP;
      ctx.fillStyle = COLORS.calm;
      ctx.fillRect(PADL, sy, plotW, STRIP_H);
      ctx.fillStyle = COLORS.alarm;
      for (var s = 0; s < alarmSpans.length; s++) {
        var a = alarmSpans[s][0], b = alarmSpans[s][1] === null ? cursor : alarmSpans[s][1];
        ctx.fillRect(xOf(a), sy, Math.max(2, xOf(b) - xOf(a)), STRIP_H);
      }
      ctx.fillStyle = COLORS.muted; ctx.textAlign = 'left'; ctx.font = '11px sans-serif';
      ctx.fillText('报警区间', PADL + plotW + 5, sy + STRIP_H - 3);

      // hover crosshair (readout below, not a floating tooltip)
      if (hoverT !== null) {
        ctx.strokeStyle = COLORS.faint; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xOf(hoverT), PADT); ctx.lineTo(xOf(hoverT), PADT + plotH);
        ctx.stroke();
      }
    }

    // ---- hover readout ----
    var hoverT = null;
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      var x = (e.clientX - r.left) * (640 / r.width);
      if (x < PADL || x > PADL + plotW) { hoverT = null; return; }
      hoverT = (x - PADL) / plotW * DURATION;
      var i = Math.min(N - 1, Math.round(hoverT / DT));
      var shown = i <= Math.floor(cursor / DT)
        ? 't=' + hoverT.toFixed(1) + 's  值=' + vals[i].toFixed(1) + unit
        : 't=' + hoverT.toFixed(1) + 's  尚未播放到';
      readout.textContent = shown;
    });
    canvas.addEventListener('mouseleave', function () {
      hoverT = null; readout.textContent = '悬停查看曲线读数';
    });

    // ---- stats + verdict ----
    function refreshStats() {
      var shown = Math.min(N - 1, Math.floor(cursor / DT));
      valOut.textContent = shown >= 0 ? vals[shown].toFixed(1) + unit : '—';
      cntOut.textContent = String(count);
      if (inAlarm) { stOut.className = 'lab-badge hot'; stOut.textContent = '报警中'; }
      else { stOut.className = 'lab-badge calm2'; stOut.textContent = '正常'; }
      if (cursor >= DURATION) {
        if (count >= 3) {
          stOut.className = 'lab-badge hot';
          stOut.textContent = '颤抖：' + count + ' 次 ≥ 3/60s';
        } else {
          stOut.className = 'lab-badge ok';
          stOut.textContent = '低于颤抖线（' + count + ' 次）';
        }
      }
    }

    // ---- loop ----
    function frame(ts) {
      if (lastTick === null) lastTick = ts;
      var real = (ts - lastTick) / 1000;
      lastTick = ts;
      if (playing && cursor < DURATION) {
        advanceTo(Math.min(DURATION, cursor + real * SPEED));
      }
      draw();
      refreshStats();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    var roots = document.querySelectorAll('.deadlab[data-lab]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
