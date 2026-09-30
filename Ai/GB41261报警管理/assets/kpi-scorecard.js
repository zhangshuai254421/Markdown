/* ==========================================================================
   KPI scorecard — enter your system's numbers, get an instant verdict.
   (New component for the GB/T 41261 alarm-management course.)

   Usage: <div class="scorecard" data-kpis='{ "kpis": [
     { "name": "平均报警率", "unit": "条/时", "target": "≤ 6", "limit": 6 }, ...
   ]}'></div>

   Every KPI here is "lower is better"; `limit` is the passing ceiling.
   Live judging per row + overall count.
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function init(root) {
    var cfg;
    try { cfg = JSON.parse(root.getAttribute('data-kpis')); }
    catch (e) { root.textContent = 'Scorecard data parse error.'; return; }

    root.innerHTML = '';

    var table = el('table', 'kpi-table');
    var thead = el('thead');
    var hr = el('tr');
    ['指标', '目标', '你的数字', '判定'].forEach(function (h) {
      hr.appendChild(el('th', null, h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    var passed = 0, filled = 0;
    var verdictLine = el('div', 'kpi-verdict', '填入数字即自动判定');

    function refresh() {
      verdictLine.textContent = filled === 0
        ? '填入数字即自动判定'
        : '已填 ' + filled + ' 项，达标 ' + passed + ' / ' + filled +
          (filled === cfg.kpis.length
            ? (passed === cfg.kpis.length ? ' —— 全绿，体检通过' : ' —— 红行就是改造清单')
            : '');
    }

    cfg.kpis.forEach(function (kpi) {
      var tr = el('tr');
      tr.appendChild(el('td', null, kpi.name));
      tr.appendChild(el('td', 'kpi-target', kpi.target + ' ' + (kpi.unit || '')));

      var tdInput = el('td');
      var input = document.createElement('input');
      input.type = 'number';
      input.className = 'kpi-input';
      input.min = 0;
      input.placeholder = '—';
      tdInput.appendChild(input);
      tr.appendChild(tdInput);

      var tdVerdict = el('td', 'kpi-verdict-cell', '待填');
      tr.appendChild(tdVerdict);

      input.addEventListener('input', function () {
        if (input.value === '') {
          tdVerdict.textContent = '待填';
          tdVerdict.className = 'kpi-verdict-cell';
          tr.className = '';
          filled--; if (filled < 0) filled = 0;
          refresh();
          return;
        }
        var v = parseFloat(input.value);
        if (isNaN(v)) return;
        if (tdVerdict.dataset.filled !== '1') { filled++; tdVerdict.dataset.filled = '1'; }
        var ok = v <= kpi.limit;
        if (ok) { passed++; } else if (tdVerdict.dataset.ok === '1') { passed--; }
        tdVerdict.dataset.ok = ok ? '1' : '0';
        tdVerdict.textContent = ok ? '达标' : '超标 ' + (v - kpi.limit);
        tdVerdict.className = ok ? 'kpi-verdict-cell pass' : 'kpi-verdict-cell fail';
        tr.className = ok ? 'kpi-pass' : 'kpi-fail';
        refresh();
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    root.appendChild(table);
    root.appendChild(verdictLine);
  }

  function boot() {
    var roots = document.querySelectorAll('.scorecard[data-kpis]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
