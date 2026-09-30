/* ==========================================================================
   Reusable finite-state-machine simulator.
   (New component for the GB/T 41261 alarm-management course.)

   Usage: place <div class="smsim" data-sm='...'></div> in a lesson, where
   the attribute is a JSON string:

   {
     "initial": "normal",
     "events":  [ {"name": "trigger", "label": "条件越限"}, ... ],
     "transitions": { "normal:trigger": "unack", ... },
     "stateLabels": { "normal": "Normal 正常", ... },
     "journal": { "trigger": "报警触发，声光起", ... }   // optional
   }

   Renders: current-state badge, event buttons (disabled when no transition),
   a timestamped journal (newest first), and a reset button.
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function clock() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function init(root) {
    var cfg;
    try { cfg = JSON.parse(root.getAttribute('data-sm')); }
    catch (e) { root.textContent = 'State machine data parse error.'; return; }

    root.innerHTML = '';
    var state = cfg.initial;

    var badge = el('div', 'smsim-state ' + state, cfg.stateLabels[state]);
    var eventsWrap = el('div', 'smsim-events');
    var journal = el('div', 'smsim-journal');

    var buttons = {};
    cfg.events.forEach(function (ev) {
      var btn = el('button', 'smsim-btn', ev.label);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        var next = cfg.transitions[state + ':' + ev.name];
        if (!next) return;
        var from = state;
        state = next;
        badge.className = 'smsim-state ' + state;
        badge.textContent = cfg.stateLabels[state];
        var text = (cfg.journal && cfg.journal[ev.name]) || ev.label;
        journal.insertBefore(
          el('div', null, clock() + '  「' + ev.label + '」 ' + text +
            '：' + cfg.stateLabels[from] + ' → ' + cfg.stateLabels[next]),
          journal.firstChild
        );
        refresh();
      });
      buttons[ev.name] = btn;
      eventsWrap.appendChild(btn);
    });

    function refresh() {
      cfg.events.forEach(function (ev) {
        buttons[ev.name].disabled = !cfg.transitions[state + ':' + ev.name];
      });
    }
    refresh();

    var reset = el('button', 'smsim-btn smsim-reset', '重置');
    reset.type = 'button';
    reset.addEventListener('click', function () {
      state = cfg.initial;
      badge.className = 'smsim-state ' + state;
      badge.textContent = cfg.stateLabels[state];
      journal.innerHTML = '';
      refresh();
    });

    root.appendChild(badge);
    root.appendChild(eventsWrap);
    root.appendChild(journal);
    root.appendChild(reset);
  }

  function boot() {
    var roots = document.querySelectorAll('.smsim[data-sm]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
