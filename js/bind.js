/* =========================================================================
   bind.js: the page's figures and option variants follow NQ.state
   -------------------------------------------------------------------------
   Markup contract (nothing else needs JavaScript to stay correct):
     [data-nq-bind="key"]        text set from the formatter for key
     [data-nq-map-aria="key"]    aria-label of that map's svg (js/network-map.js)
     [data-nq-when="A" | "B"]    shown only for that option (css/base.css);
                                 without JavaScript both show, each naming
                                 its option
     [data-nq-when-n="0"|"1"|"n"] trainee variants (hidden attribute)
     [data-nq-count="monthly"]   a variant whose own text is its final
                                 figure; when it appears after a change it
                                 counts up from the previous monthly figure
   Keys: option, monthly, monthlyNote, trainees, training, trainingFig,
   trainingNote, trainingLive, barSummary, dataMapAria. Add more with
   NQ.bind.register(key, function (derived) { return "text"; }).
   Figures that change count over --nq-d-count (1,200 ms, ease-out) and carry
   a gold underline for as long (class nq-changed); reduced motion swaps them
   at once. One polite live region (#nq-live) announces an option change.
   Copy: copy-deck.md (quote panel, act 4, act 6, act 7).
   ========================================================================= */
(function (root) {
  'use strict';
  var NQ = root.NQ = root.NQ || {};
  var F = NQ.figures;
  var doc = root.document;
  var money = F.money;
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');

  var fmt = {
    option: function (d) { return d.option; },
    monthly: function (d) { return money(d.monthly); },
    monthlyNote: function (d) { return 'excl. VAT, Option ' + d.option; },
    trainees: function (d) { return String(d.trainees); },
    training: function (d) { return money(d.training); },
    trainingFig: function (d) { return d.trainees === 0 ? 'Not chosen yet' : money(d.training); },
    trainingNote: function (d) {
      if (d.trainees === 0) return money(d.trainingRate) + ' per person';
      if (d.trainees === 1) return '1 person, excl. VAT';
      return d.trainees + ' people, excl. VAT';
    },
    trainingLive: function (d) {
      if (d.trainees === 0) return 'No one chosen yet. Training is ' + money(d.trainingRate) + ' excl. VAT per person.';
      if (d.trainees === 1) return '1 person: ' + money(d.training) + ' excl. VAT.';
      return d.trainees + ' people: ' + money(d.training) + ' excl. VAT.';
    },
    barSummary: function (d) { return money(d.build) + ' build  |  ' + money(d.monthly) + ' a month'; },
    dataMapAria: function (d) {
      return d.option === 'B'
        ? 'Map: national and the eight provinces each have their own encrypted environment, and Western Cape keeps its existing one.'
        : 'Map: workshop data from national and the eight provinces flows into Western Cape\'s existing environment.';
    }
  };

  var LIVE = {
    A: function (d) { return 'Option A shown: shared data in Western Cape\'s existing environment. Monthly total ' + money(d.monthly) + ' excl. VAT.'; },
    B: function (d) { return 'Option B shown: nine dedicated encrypted environments. Monthly total ' + money(d.monthly) + ' excl. VAT.'; }
  };

  /* keys whose figure counts when it changes, and the derived field it reads */
  var COUNT = { monthly: 'monthly', training: 'training', trainingFig: 'training' };

  function parseCents(text) {
    var m = String(text).replace(/ /g, ' ').match(/R\s*([\d,]+)(?:\.(\d{2}))?/);
    if (!m) return null;
    return parseInt(m[1].replace(/,/g, ''), 10) * 100 + (m[2] ? parseInt(m[2], 10) : 0);
  }

  var running = new WeakMap();

  function flag(el) {
    el.classList.remove('nq-changed');
    void el.offsetWidth; /* restart the underline */
    el.classList.add('nq-changed');
    clearTimeout(el.__nqFlag);
    el.__nqFlag = setTimeout(function () { el.classList.remove('nq-changed'); }, 1200);
  }

  function countTo(el, from, to, finalText) {
    var prev = running.get(el);
    if (prev) prev.cancelled = true;
    if (reduce && reduce.matches || from === null || from === to) { el.textContent = finalText; return; }
    var job = { cancelled: false };
    running.set(el, job);
    var t0 = null, dur = 1200;
    el.setAttribute('aria-busy', 'true');
    function step(now) {
      if (job.cancelled) return;
      if (t0 === null) t0 = now;
      var t = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        el.textContent = money(Math.round(from + (to - from) * e));
        root.requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
        el.removeAttribute('aria-busy');
        running.delete(el);
      }
    }
    root.requestAnimationFrame(step);
  }

  function render(d, prev, meta) {
    var animate = meta && meta.source === 'user';
    var html = doc.documentElement;
    html.setAttribute('data-nq-option', d.option);
    html.setAttribute('data-nq-n', d.trainees === 0 ? '0' : d.trainees === 1 ? '1' : 'n');

    Array.prototype.forEach.call(doc.querySelectorAll('[data-nq-bind]'), function (el) {
      var key = el.getAttribute('data-nq-bind');
      var f = fmt[key];
      if (!f) return;
      var text = f(d);
      if (el.textContent === text && !running.get(el)) return;
      var field = COUNT[key];
      if (animate && field && prev && text.indexOf('R') === 0) {
        var from = prev.trainees === 0 && key === 'trainingFig' ? null : prev[field];
        countTo(el, from, d[field], text);
        flag(el);
      } else {
        el.textContent = text;
        if (animate && prev && (key === 'monthly' || key === 'option')) flag(el);
      }
    });

    Array.prototype.forEach.call(doc.querySelectorAll('[data-nq-when-n]'), function (el) {
      var want = el.getAttribute('data-nq-when-n');
      var on = want === '0' ? d.trainees === 0 : want === '1' ? d.trainees === 1 : d.trainees > 1;
      el.hidden = !on;
    });

    if (animate && prev && prev.option !== d.option) {
      Array.prototype.forEach.call(doc.querySelectorAll('[data-nq-count]'), function (el) {
        if (el.getAttribute('data-nq-when') !== d.option) return;
        var finalText = el.getAttribute('data-nq-final') || el.textContent;
        el.setAttribute('data-nq-final', finalText);
        countTo(el, prev[el.getAttribute('data-nq-count')], parseCents(finalText), finalText);
        flag(el);
      });
      var live = doc.getElementById('nq-live');
      if (live) live.textContent = LIVE[d.option](d);
    }

    if (NQ.networkMap && NQ.networkMap.applyAria) NQ.networkMap.applyAria(fmt, d);
  }

  NQ.bind = {
    formatters: fmt,
    register: function (key, fn) { fmt[key] = fn; },
    render: render,
    init: function () {
      render(NQ.state.current(), null, { source: 'init' });
      NQ.state.subscribe(function (s, d, prev, meta) { render(d, prev, meta); });
    }
  };
})(self);
