/* ==========================================================================
   角色权限矩阵实验台（reusable lab widget）— 软件登录与权限系统课程
   Usage: <div id="rbac-lab"></div> + <script src="../assets/rbac-lab.js"></script>

   A 10-permission × 4-role checkbox matrix with an evaluator that flags:
   1. 任何角色拥有「清空审计日志」           → 审计记录必须防删除（等保）
   2. 同角色既有「分配权限」又有「查看审计」 → 职责分离（SoD）违规
   3. 操作员/工程师拿到用户管理类权限       → 垂直越权面过大（最小权限）
   4. 单角色超过 7 个权限点                 → 粒度过粗的提示
   5. 勾选「允许用户直连权限」              → RBAC 反模式
   Presets: 典型现状（含违规）/ 推荐方案（全绿）。
   ========================================================================== */
(function () {
  'use strict';

  var PERMS = ['启停设备', '调整工艺参数', '查看报警', '确认报警', '导出数据',
    '配置报警规则', '管理用户账号', '分配权限', '查看审计日志', '清空审计日志'];
  var ROLES = ['操作员', '工程师', '管理员', '审计员'];

  var CURRENT = { // 典型现状：埋了好几类违规
    '操作员': [0, 2, 3, 6, 9],
    '工程师': [0, 1, 2, 3, 4, 5, 7, 8],
    '管理员': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    '审计员': [8]
  };
  var RECOMMENDED = {
    '操作员': [0, 2, 3],
    '工程师': [0, 1, 2, 3, 5],
    '管理员': [2, 6, 7],
    '审计员': [4, 8]
  };

  var CSS = [
    '.rbac-lab{border:1px solid var(--rule);border-radius:8px;padding:1.2rem 1.4rem;background:var(--code-bg);margin:1.5rem 0;}',
    '.rbac-lab-title{font-family:var(--sans);font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:.9rem;}',
    '.rbac-lab table{width:100%;border-collapse:collapse;background:var(--paper);font-size:.85rem;}',
    '.rbac-lab th,.rbac-lab td{border:1px solid var(--rule);padding:.4rem .5rem;text-align:center;}',
    '.rbac-lab td.p-name,.rbac-lab th.p-name{text-align:left;font-family:var(--sans);white-space:nowrap;}',
    '.rbac-lab th{font-family:var(--sans);font-size:.8rem;color:var(--muted);font-weight:normal;}',
    '.rbac-lab input[type=checkbox]{width:1.05rem;height:1.05rem;accent-color:var(--accent);cursor:pointer;}',
    '.rbac-lab td.danger{background:var(--bad-bg);}',
    '.rbac-lab-btns{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.9rem;align-items:center;}',
    '.rbac-lab-btn{font-family:var(--sans);font-size:.85rem;padding:.4rem .9rem;border:1px solid var(--accent);border-radius:4px;background:var(--paper);color:var(--accent);cursor:pointer;}',
    '.rbac-lab-btn.primary{background:var(--accent);color:#fff;}',
    '.rbac-lab-btn:hover{opacity:.9;}',
    '.rbac-lab label.opt{font-family:var(--sans);font-size:.8rem;color:var(--ink);display:flex;gap:.35rem;align-items:center;}',
    '.rbac-findings{margin-top:.9rem;border-top:1px solid var(--rule);padding-top:.7rem;display:none;}',
    '.rbac-findings.show{display:block;}',
    '.rbac-findings li{font-size:.88rem;margin-bottom:.45rem;}',
    '.rbac-findings li.bad{color:var(--bad);}',
    '.rbac-findings li.warn{color:var(--ink);}',
    '.rbac-findings li.good{color:var(--good);}',
    '.rbac-findings ul{margin:.2rem 0 .2rem 1.2rem;padding:0;}'
  ].join('\n');

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function init(root) {
    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    root.classList.add('rbac-lab');
    root.appendChild(el('div', 'rbac-lab-title', '实验 · 角色权限矩阵评审（改一改，评一评）'));

    var boxes = {}; // role -> [checkbox per perm]
    var table = el('table');
    var thead = el('thead');
    var hr = el('tr');
    hr.appendChild(el('th', 'p-name', '权限点（资源 × 动作）'));
    ROLES.forEach(function (r) { hr.appendChild(el('th', null, r)); });
    thead.appendChild(hr); table.appendChild(thead);
    var tbody = el('tbody');

    PERMS.forEach(function (p, pi) {
      var tr = el('tr');
      tr.appendChild(el('td', 'p-name', p));
      ROLES.forEach(function (r) {
        var td = el('td');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        boxes[r] = boxes[r] || [];
        boxes[r][pi] = cb;
        td.appendChild(cb);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    root.appendChild(table);

    function apply(preset) {
      ROLES.forEach(function (r) {
        for (var i = 0; i < PERMS.length; i++) {
          boxes[r][i].checked = preset[r].indexOf(i) >= 0;
          boxes[r][i].closest('td').className = '';
        }
      });
      findings.classList.remove('show');
    }

    var btns = el('div', 'rbac-lab-btns');
    var evalBtn = el('button', 'rbac-lab-btn primary', '评审当前矩阵');
    var loadRec = el('button', 'rbac-lab-btn', '加载推荐方案');
    var loadCur = el('button', 'rbac-lab-btn', '加载典型现状');
    btns.appendChild(evalBtn); btns.appendChild(loadRec); btns.appendChild(loadCur);

    var direct = document.createElement('input');
    direct.type = 'checkbox';
    var directLabel = el('label', 'opt');
    directLabel.appendChild(direct);
    directLabel.appendChild(el('span', null, '允许绕过角色直接给用户勾权限'));
    btns.appendChild(directLabel);
    root.appendChild(btns);

    var findings = el('div', 'rbac-findings');
    var list = el('ul');
    findings.appendChild(list);
    root.appendChild(findings);

    function has(role, pi) { return boxes[role][pi].checked; }

    function evaluate() {
      var items = [];
      var violations = 0;

      ROLES.forEach(function (r) {
        if (has(r, 9)) {
          items.push(el('li', 'bad', '✗ 「' + r + '」拥有【清空审计日志】——审计记录必须受保护、免受未预期删除（等保安全审计条款）。没有任何角色该有它，物理归档是运维的事。'));
          boxes[r][9].closest('td').className = 'danger';
          violations++;
        }
        if (has(r, 7) && has(r, 8)) {
          items.push(el('li', 'bad', '✗ 「' + r + '」既能【分配权限】又能【查看审计日志】——改权限的人不该看审计，自己不能审自己（职责分离 SoD）。'));
          violations++;
        }
        if ((r === '操作员' || r === '工程师') && (has(r, 6) || has(r, 7) || has(r, 9))) {
          items.push(el('li', 'bad', '✗ 「' + r + '」拿到了用户管理类权限——岗位用不到的权限就是攻击面（最小权限原则）。'));
          violations++;
        }
        var count = PERMS.reduce(function (n, _, i) { return n + (has(r, i) ? 1 : 0); }, 0);
        if (count > 7) {
          items.push(el('li', 'warn', '△ 「' + r + '」有 ' + count + ' 个权限点——接近「一把抓」，粒度过粗。想想这个岗位真需要全部吗？'));
        }
      });

      if (direct.checked) {
        items.push(el('li', 'bad', '✗ 允许用户直连权限——半年后没人说得清「他为什么有这个权限」，改角色也甩不掉它。权限只经角色发放。'));
        violations++;
      }

      if (violations === 0) {
        items.push(el('li', 'good', '✓ 评审通过：无高危分配、职责分离成立、最小权限在位。把这张矩阵抄进数据库，下一课到服务端强制执行它。'));
      }

      list.textContent = '';
      items.forEach(function (li) { list.appendChild(li); });
      findings.classList.add('show');
    }

    evalBtn.addEventListener('click', evaluate);
    loadRec.addEventListener('click', function () { apply(RECOMMENDED); });
    loadCur.addEventListener('click', function () { apply(CURRENT); });
    apply(CURRENT);
  }

  function boot() {
    var root = document.getElementById('rbac-lab');
    if (root) init(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
