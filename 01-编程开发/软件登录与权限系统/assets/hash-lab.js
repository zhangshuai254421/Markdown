/* ==========================================================================
   密码哈希实验台（reusable lab widget）— 软件登录与权限系统课程
   Usage: <div id="hash-lab"></div> + <script src="../assets/hash-lab.js"></script>

   Demonstrates three ideas hands-on:
   1. Fast hash (SHA-256) vs slow KDF (PBKDF2-SHA256) — wall-clock difference
   2. Per-password random salt — same password, different hash each run
   3. Same password without salt — identical hash (rainbow-table food)

   Uses WebCrypto (crypto.subtle); file:// counts as a secure context in
   current Chrome/Edge, but guard anyway. Self-contained injected styles.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = [
    '.hashlab{border:1px solid var(--rule);border-radius:8px;padding:1.2rem 1.4rem;background:var(--code-bg);margin:1.5rem 0;}',
    '.hashlab-title{font-family:var(--sans);font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:.9rem;}',
    '.hashlab-controls{display:flex;flex-wrap:wrap;gap:.8rem;align-items:flex-end;}',
    '.hashlab-field{display:flex;flex-direction:column;gap:.25rem;}',
    '.hashlab-field label{font-family:var(--sans);font-size:.75rem;color:var(--muted);}',
    '.hashlab-field input,.hashlab-field select{font-family:var(--mono);font-size:.9rem;padding:.35rem .5rem;border:1px solid var(--rule);border-radius:4px;background:var(--paper);color:var(--ink);}',
    '.hashlab-field input{width:14rem;}',
    '.hashlab-btns{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.9rem;}',
    '.hashlab-btn{font-family:var(--sans);font-size:.85rem;padding:.4rem .9rem;border:1px solid var(--accent);border-radius:4px;background:var(--paper);color:var(--accent);cursor:pointer;}',
    '.hashlab-btn:hover{background:var(--accent-soft);}',
    '.hashlab-btn.primary{background:var(--accent);color:#fff;}',
    '.hashlab-btn:disabled{opacity:.45;cursor:wait;}',
    '.hashlab-results{margin-top:1rem;border-top:1px solid var(--rule);}',
    '.hashlab-results table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:.8rem;}',
    '.hashlab-results th{font-family:var(--sans);font-size:.72rem;color:var(--muted);text-align:left;font-weight:normal;padding:.45rem .4rem;border-bottom:1px solid var(--rule);}',
    '.hashlab-results td{padding:.4rem;border-bottom:1px solid var(--rule);color:var(--code-ink);}',
    '.hashlab-results td.t{color:var(--accent);white-space:nowrap;}',
    '.hashlab-verdict{margin-top:.8rem;font-size:.85rem;color:var(--ink);background:var(--accent-soft);border-radius:4px;padding:.6rem .8rem;display:none;}',
    '.hashlab-verdict.show{display:block;}',
    '.hashlab-warn{margin-top:.6rem;font-size:.8rem;color:var(--bad);}'
  ].join('\n');

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  var enc = new TextEncoder();

  function toHex(buf, limit) {
    var v = new Uint8Array(buf), s = '';
    for (var i = 0; i < v.length; i++) s += ('0' + v[i].toString(16)).slice(-2);
    return limit ? s.slice(0, limit) : s;
  }

  function concatBytes(a, b) {
    var out = new Uint8Array(a.length + b.length);
    out.set(a, 0); out.set(b, a.length);
    return out;
  }

  function randomSalt() {
    var s = new Uint8Array(16);
    crypto.getRandomValues(s);
    return s;
  }

  function sha256(pw, salt) {
    return crypto.subtle.digest('SHA-256', concatBytes(enc.encode(pw), salt));
  }

  function pbkdf2(pw, salt, iterations) {
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return crypto.subtle.deriveBits(
          { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations },
          key, 256);
      });
  }

  function init(root) {
    if (!window.crypto || !crypto.subtle) {
      root.appendChild(el('div', 'hashlab-warn', '此实验需要 WebCrypto 支持，请用较新的 Edge / Chrome 打开本页。'));
      return;
    }

    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    root.classList.add('hashlab');
    root.appendChild(el('div', 'hashlab-title', '实验 · 密码哈希计时器（真实计算，就在本页运行）'));

    var pwField = el('div', 'hashlab-field');
    pwField.appendChild(el('label', null, '密码'));
    var pwInput = el('input');
    pwInput.type = 'text';
    pwInput.value = 'Operator@2026';
    pwField.appendChild(pwInput);

    var algField = el('div', 'hashlab-field');
    algField.appendChild(el('label', null, '算法'));
    var algSel = el('select');
    [['sha256', 'SHA-256（快哈希）'], ['pbkdf2', 'PBKDF2-SHA256（慢哈希）']].forEach(function (p) {
      var o = el('option', null, p[1]); o.value = p[0]; algSel.appendChild(o);
    });
    algField.appendChild(algSel);

    var iterField = el('div', 'hashlab-field');
    iterField.appendChild(el('label', null, '迭代次数（仅 PBKDF2）'));
    var iterSel = el('select');
    [[1000, '1,000'], [10000, '10,000'], [100000, '100,000（Identity 默认）'], [600000, '600,000（OWASP 建议）']]
      .forEach(function (p) { var o = el('option', null, p[1]); o.value = String(p[0]); iterSel.appendChild(o); });
    iterSel.value = '100000';
    iterField.appendChild(iterSel);

    var saltField = el('div', 'hashlab-field');
    saltField.appendChild(el('label', null, '盐'));
    var saltSel = el('select');
    [['no', '不加盐'], ['yes', '每次随机盐（16 字节）']].forEach(function (p) {
      var o = el('option', null, p[1]); o.value = p[0]; saltSel.appendChild(o);
    });
    saltField.appendChild(saltSel);

    var controls = el('div', 'hashlab-controls');
    [pwField, algField, iterField, saltField].forEach(function (f) { controls.appendChild(f); });
    root.appendChild(controls);

    var btns = el('div', 'hashlab-btns');
    var runBtn = el('button', 'hashlab-btn primary', '运行一次');
    var demoNoSalt = el('button', 'hashlab-btn', '演示：同密码无盐跑两次');
    var demoSalt = el('button', 'hashlab-btn', '演示：同密码加盐跑两次');
    btns.appendChild(runBtn); btns.appendChild(demoNoSalt); btns.appendChild(demoSalt);
    root.appendChild(btns);

    var resultsWrap = el('div', 'hashlab-results');
    var table = el('table');
    var thead = el('thead');
    var hr = el('tr');
    ['#', '算法', '盐', '耗时', '哈希（前 16 位）'].forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr); table.appendChild(thead);
    var tbody = el('tbody');
    table.appendChild(tbody);
    resultsWrap.appendChild(table);
    root.appendChild(resultsWrap);

    var verdict = el('div', 'hashlab-verdict');
    root.appendChild(verdict);

    var count = 0;
    var last = null;

    function note(text) { verdict.textContent = text; verdict.classList.add('show'); }

    function runOnce() {
      var pw = pwInput.value;
      var useSalt = saltSel.value === 'yes';
      var salt = useSalt ? randomSalt() : new Uint8Array(0);
      var isPbkdf2 = algSel.value === 'pbkdf2';
      var iterations = parseInt(iterSel.value, 10);

      var t0 = performance.now();
      var job = isPbkdf2 ? pbkdf2(pw, salt, iterations) : sha256(pw, salt);

      return job.then(function (bits) {
        var ms = performance.now() - t0;
        count++;
        var tr = el('tr');
        tr.appendChild(el('td', null, String(count)));
        tr.appendChild(el('td', null, isPbkdf2 ? 'PBKDF2×' + iterations : 'SHA-256'));
        tr.appendChild(el('td', null, useSalt ? '随机盐' : '无'));
        tr.appendChild(el('td', 't', ms >= 100 ? Math.round(ms) + ' ms' : ms.toFixed(1) + ' ms'));
        tr.appendChild(el('td', null, toHex(bits, 16) + '…'));
        tbody.insertBefore(tr, tbody.firstChild);

        var row = { pw: pw, alg: isPbkdf2 ? 'p' + iterations : 'sha', salt: useSalt, hash: toHex(bits), ms: ms };

        if (last && last.pw === row.pw && last.alg === row.alg) {
          if (!last.salt && !row.salt) {
            note(last.hash === row.hash
              ? '两次哈希完全相同。攻击者因此可以预计算一张「明文→哈希」查找表（彩虹表）整库比对，还能一眼看出哪些用户用了同一个密码。'
              : '两次哈希不同—— PBKDF2 每次运行仍用同一密码与同一盐时应当相同；若不同请重跑一次。');
          } else {
            note('同一个密码，两次哈希完全不同——这就是盐的作用：预计算查找表作废，库里的哈希也互相不可比。注意：校验时不是「再算一次碰运气」，而是从库里读出该用户的盐重算比对。');
          }
        } else if (last && row.alg !== last.alg) {
          note('对比耗时：慢哈希故意让每次计算多花成百上千倍时间。用户登录时多等这一点，攻击者离线爆破时就要付出同倍代价——每一行都要算。');
        }
        last = row;
      });
    }

    function runTwice(withSalt) {
      saltSel.value = withSalt ? 'yes' : 'no';
      var all = [runBtn, demoNoSalt, demoSalt];
      all.forEach(function (b) { b.disabled = true; });
      runOnce()
        .then(runOnce)
        .then(function () { all.forEach(function (b) { b.disabled = false; }); })
        .catch(function (e) {
          root.appendChild(el('div', 'hashlab-warn', '计算失败：' + e.message));
          all.forEach(function (b) { b.disabled = false; });
        });
    }

    runBtn.addEventListener('click', function () {
      runBtn.disabled = true;
      runOnce().then(function () { runBtn.disabled = false; })
        .catch(function (e) {
          root.appendChild(el('div', 'hashlab-warn', '计算失败：' + e.message));
          runBtn.disabled = false;
        });
    });
    demoNoSalt.addEventListener('click', function () { runTwice(false); });
    demoSalt.addEventListener('click', function () { runTwice(true); });
  }

  function boot() {
    var root = document.getElementById('hash-lab');
    if (root) init(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
