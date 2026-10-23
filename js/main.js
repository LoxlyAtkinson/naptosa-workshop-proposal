/* =========================================================================
   main.js: boot order (a deferred script, run after DOMContentLoaded)
   -------------------------------------------------------------------------
   1. NQ.bind.init()         figures and variants follow NQ.state
   2. ScrollCraft.mount()    the engine, on document.body (never edited);
                             it honours prefers-reduced-motion itself
   3. NQ.networkMap.init()   inline maps; act 4's map follows the option
   4. NQ.panel.init()        quote panel, bar and sheet
   5. NQ.controls.init()     data switch and trainee stepper
   6. focus parking          a focused control inside a pinned act or a
                             rail is scrolled to where it can be seen
                             (verify.md, Keyboard)
   7. the footer's height    --nq-foot-h, so the close holds with the
                             contentinfo line inside it
   NQ.acts = { jump(section), toProgress(act, p, behavior), record(act) }
   ========================================================================= */
(function (root) {
  'use strict';
  var NQ = root.NQ = root.NQ || {};
  var doc = root.document;
  var reduceMQ = root.matchMedia('(prefers-reduced-motion: reduce)');

  function record(act) {
    var acts = NQ.engine && NQ.engine.acts;
    if (!acts) return null;
    for (var i = 0; i < acts.length; i++) if (acts[i].el === act) return acts[i];
    return null;
  }

  function toProgress(act, p, behavior) {
    var rec = record(act);
    var vh = root.innerHeight;
    var top = rec ? rec.top : act.getBoundingClientRect().top + root.scrollY;
    var h = rec ? rec.height : act.offsetHeight;
    var travel = Math.max(h - vh, 1);
    root.scrollTo({ top: Math.round(top + travel * Math.max(0, Math.min(1, p))), behavior: behavior || 'instant' });
  }

  /* the progress at which a cue is fully open (the engine's own cue maths) */
  function cueOpenAt(cue) {
    var n = (cue.getAttribute('data-sc-cue') || '').trim().split(/\s+/).map(parseFloat);
    var from = isNaN(n[0]) ? 0 : n[0];
    if (n.length < 2 || isNaN(n[1])) return Math.min(1, from + 0.18);
    var rIn = n.length > 2 && !isNaN(n[2]) ? n[2] : 0.3;
    return Math.min(1, from + (n[1] - from) * rIn + 0.01);
  }

  function pinned(act) {
    var d = act && act.getAttribute('data-sc-act');
    return d === 'pin' || d === 'pan' || d === 'scrub';
  }

  /* jump to a chapter: flow acts to their top, pinned acts to where their
     first cue is open, so the reader never lands on an empty stage */
  function jump(section) {
    var behavior = reduceMQ.matches ? 'instant' : 'smooth';
    var act = section.matches('[data-sc-act]') ? section : section.querySelector('[data-sc-act]');
    if (act && pinned(act) && act.getAttribute('data-sc-act') !== 'scrub') {
      var cue = act.querySelector('[data-sc-cue]');
      toProgress(act, cue ? cueOpenAt(cue) : 0, behavior);
    } else {
      root.scrollTo({ top: Math.round(section.getBoundingClientRect().top + root.scrollY), behavior: behavior });
    }
    var h = section.querySelector('h1, h2');
    if (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }

  function parkFocus(e) {
    var el = e.target;
    if (!el || !el.closest) return;
    var act = el.closest('[data-sc-act]');
    if (!act || !pinned(act)) return;
    var rail = act.querySelector('[data-sc-pan]');
    if (rail && rail.contains(el)) {
      /* bring the rail item into view: p where its left edge sits at the gutter */
      var item = el.closest('.nq-rail__item') || el;
      var over = rail.scrollWidth - root.innerWidth;
      if (over <= 0) return;
      var extra = parseFloat(rail.getAttribute('data-sc-pan')) || 0;
      var gutter = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      var p = (item.offsetLeft - gutter) / (over * (1 + extra));
      var r = item.getBoundingClientRect();
      if (r.left >= 0 && r.right <= root.innerWidth) return;
      toProgress(act, p, 'instant');
      return;
    }
    var cue = el.closest('[data-sc-cue]');
    if (!cue) return;
    if (parseFloat(getComputedStyle(cue).opacity || '1') > 0.85) return;
    toProgress(act, cueOpenAt(cue), 'instant');
  }

  function measureFoot() {
    var f = doc.querySelector('[data-nq-foot]');
    if (f) doc.documentElement.style.setProperty('--nq-foot-h', f.offsetHeight + 'px');
  }

  function step(name, fn) {
    try { return fn(); } catch (err) { if (root.console) root.console.error('[nq] ' + name + ' failed', err); return null; }
  }

  function boot() {
    step('bind', function () { NQ.bind.init(); });
    NQ.engine = step('engine', function () { return root.ScrollCraft.mount(doc.body); });
    var maps = step('maps', function () { return NQ.networkMap.init(); });
    step('panel', function () { NQ.panel.init(); });
    step('controls', function () { NQ.controls.init(); });

    var dataMap = function (s) {
      var m = NQ.networkMap && NQ.networkMap.get('data');
      if (m) m.setMode('data-' + s.option);
    };
    NQ.state.subscribe(dataMap);
    if (maps && maps.then) maps.then(function () { dataMap(NQ.state.get()); NQ.networkMap.follow(); });

    /* after the engine's own focusin handler (window listeners run in order) */
    root.addEventListener('focusin', parkFocus);

    measureFoot();
    root.addEventListener('resize', measureFoot, { passive: true });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () {
      measureFoot();
      if (NQ.engine && NQ.engine.layout) NQ.engine.layout();
    });
  }

  NQ.acts = { jump: jump, toProgress: toProgress, record: record, cueOpenAt: cueOpenAt };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(self);
