/* =========================================================================
   quote-state.js: the visitor's quote, one state for the whole page
   -------------------------------------------------------------------------
   state   { option: "A" | "B", trainees: whole number 0..200 }
           Option A is the default (owner decision 2; contract C5: Option A
           applies unless the Option B box is ticked).
   derive  every figure that can change, in cents, from js/figures.js:
             monthly        A: R 1,791.00 excl. VAT (hosting only; the
                               contract gives no VAT-inclusive Option A
                               figure, so monthlyVat and monthlyIncl are
                               null: BRIEF A3)
                            B: R 6,282.00 excl., VAT R 942.30,
                               R 7,224.30 incl.
             training       n x R 2,500.00 excl. VAT
             trainingIncl   n x R 2,875.00 incl. VAT (derived only; the page
                            never renders it: BRIEF A4)
   API     NQ.state.get(), .set(patch, meta), .subscribe(fn) -> unsubscribe,
           .derive(state), .clampTrainees(value), .MAX_TRAINEES
           subscribers receive (state, derived, previousDerived, meta)
           meta.source: "init" | "restore" | "user" | anything the caller sets
   Storage sessionStorage "nq-quote-v1", every access in try/catch. Trainees
           come back on any load in the same tab; the option comes back only
           on a back or forward navigation, so a fresh visit or a reload
           always opens on Option A (design-system.md 12.3).
   ========================================================================= */
(function (root, factory) {
  'use strict';
  var figures = (root && root.NQ && root.NQ.figures) || null;
  var api = factory(figures, root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.NQ = root.NQ || {};
    root.NQ.state = api;
  }
})(typeof self !== 'undefined' ? self : this, function (F, root) {
  'use strict';

  if (!F) throw new Error('quote-state.js needs js/figures.js loaded first');

  var KEY = 'nq-quote-v1';
  var MAX_TRAINEES = 200; /* copy deck, act 6: minimum 0, maximum 200 */
  var state = { option: 'A', trainees: 0 };
  var subs = [];

  function clampTrainees(v) {
    var n = typeof v === 'number' ? v : parseInt(String(v).trim(), 10);
    if (!isFinite(n) || isNaN(n)) return null;
    n = Math.floor(n);
    if (n < 0) n = 0;
    if (n > MAX_TRAINEES) n = MAX_TRAINEES;
    return n;
  }

  function derive(s) {
    var c = F.cents;
    var b = s.option === 'B';
    return {
      option: b ? 'B' : 'A',
      trainees: s.trainees,
      build: c('build'),
      buildVat: c('build_vat'),
      buildIncl: c('build_incl'),
      monthly: b ? c('monthly_b') : c('host_total'),
      monthlyVat: b ? c('monthly_b_vat') : null,
      monthlyIncl: b ? c('monthly_b_incl') : null,
      monthlyStandard: b ? c('monthly_standard') : null,
      monthlyReduction: b ? c('monthly_reduction') : null,
      hosting: c('host_total'),
      dataOptionB: c('data_total'),
      training: s.trainees * c('training'),
      trainingIncl: s.trainees * c('training_incl'),
      trainingRate: c('training')
    };
  }

  function get() { return { option: state.option, trainees: state.trainees }; }

  function storage() {
    try { return root && root.sessionStorage ? root.sessionStorage : null; } catch (e) { return null; }
  }

  function persist() {
    var s = storage();
    if (!s) return;
    try { s.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode or quota: the page works without it */ }
  }

  function navigationType() {
    try {
      var nav = root.performance && root.performance.getEntriesByType && root.performance.getEntriesByType('navigation')[0];
      return nav ? nav.type : '';
    } catch (e) { return ''; }
  }

  function notify(prev, meta) {
    var d = derive(state);
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](get(), d, prev, meta || {}); } catch (e) { if (root.console) root.console.error(e); }
    }
  }

  function set(patch, meta) {
    patch = patch || {};
    var next = { option: state.option, trainees: state.trainees };
    if (patch.option === 'A' || patch.option === 'B') next.option = patch.option;
    if (patch.trainees !== undefined) {
      var t = clampTrainees(patch.trainees);
      if (t !== null) next.trainees = t;
    }
    if (next.option === state.option && next.trainees === state.trainees) return false;
    var prev = derive(state);
    state = next;
    persist();
    notify(prev, meta);
    return true;
  }

  function subscribe(fn) {
    subs.push(fn);
    return function () { subs = subs.filter(function (f) { return f !== fn; }); };
  }

  /* restore once, before any subscriber exists */
  (function restore() {
    var s = storage();
    if (!s) return;
    var raw = null;
    try { raw = s.getItem(KEY); } catch (e) { return; }
    if (!raw) return;
    var saved = null;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (!saved || typeof saved !== 'object') return;
    var t = clampTrainees(saved.trainees);
    if (t !== null) state.trainees = t;
    if (navigationType() === 'back_forward' && (saved.option === 'A' || saved.option === 'B')) state.option = saved.option;
    persist();
  })();

  return {
    get: get,
    set: set,
    subscribe: subscribe,
    derive: derive,
    current: function () { return derive(state); },
    clampTrainees: clampTrainees,
    MAX_TRAINEES: MAX_TRAINEES,
    KEY: KEY
  };
});
