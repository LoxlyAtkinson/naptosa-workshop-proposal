/* =========================================================================
   act-04-data.js: act 4, Your data, your choice (piece P1). Page-local
   behaviour, loaded deferred from src/partials/04-data.html, so it runs
   after js/main.js has booted the engine, the maps and the state.

   1. The giant option letter rises out of its mask when the visitor flips
      the switch (bar.md 5: copy assembles, never pops). The letter's text is
      set by js/bind.js. Reduced motion: the letter simply changes.
   2. Two phone-only pages (the notes that sit beside the figure and under
      the map on wider screens, and the signing rule that sits under the
      switch there) are windowed against the act's progress (--sc-p) with the
      engine's own cue curve: data-nq-window="from to rampIn rampOut". They
      are shown only where the layout displays them.
   ========================================================================= */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }

  function initLetter() {
    var NQ = window.NQ;
    var glyph = doc.querySelector('.nq-data__glyph');
    if (!NQ || !NQ.state || !glyph) return;
    var last = NQ.state.get().option;
    NQ.state.subscribe(function (s, d, prev, meta) {
      if (s.option === last) return;
      last = s.option;
      if (!meta || meta.source !== 'user' || reduce.matches) return;
      glyph.classList.remove('is-swapping');
      void glyph.offsetWidth;
      glyph.classList.add('is-swapping');
      clearTimeout(glyph.__nqSwap);
      glyph.__nqSwap = setTimeout(function () { glyph.classList.remove('is-swapping'); }, 760);
    });
  }

  function initWindows() {
    var act = doc.getElementById('data');
    if (!act) return;
    var items = Array.prototype.slice.call(act.querySelectorAll('[data-nq-window]')).map(function (el) {
      var n = el.getAttribute('data-nq-window').trim().split(/\s+/).map(parseFloat);
      var from = n[0], to = n[1];
      var win = Math.max(to - from, 0.001);
      return { el: el, from: from, to: to, inEnd: from + win * (isNaN(n[2]) ? 0.3 : n[2]), outStart: to - win * (isNaN(n[3]) ? 0.3 : n[3]) };
    });
    if (!items.length) return;
    var ticking = false;
    function run() {
      ticking = false;
      var p = parseFloat(act.style.getPropertyValue('--sc-p'));
      if (isNaN(p)) p = 0;
      items.forEach(function (q) {
        if (q.el.offsetParent === null && getComputedStyle(q.el).display === 'none') return;
        var vis;
        if (p < q.inEnd) vis = smooth((p - q.from) / Math.max(q.inEnd - q.from, 0.001));
        else if (p <= q.outStart) vis = 1;
        else vis = smooth(1 - (p - q.outStart) / Math.max(q.to - q.outStart, 0.001));
        q.el.style.opacity = vis.toFixed(3);
        q.el.style.transform = reduce.matches ? 'none' : 'translate3d(0,' + ((1 - vis) * 2.4).toFixed(2) + 'vh,0)';
        q.el.style.visibility = vis > 0.001 ? 'visible' : 'hidden';
      });
    }
    function on() { if (!ticking) { ticking = true; window.requestAnimationFrame(run); } }
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on, { passive: true });
    run();
  }

  function boot() { initLetter(); initWindows(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
