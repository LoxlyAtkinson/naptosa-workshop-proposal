/* =========================================================================
   act-01-network.js: act 1, The network (piece P1). Page-local behaviour,
   loaded deferred from src/partials/01-network.html, so it runs after
   js/main.js has booted the engine and the maps.
   ========================================================================= */
/* Act 1 page-local behaviour (piece P1). Runs after the deferred scripts. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* Scroll-linked fade for coda copy (bar.md 5): each marked block fades
     and rises over about 340 px of scroll as it comes up the screen. With
     reduced motion only the opacity moves. Without JavaScript nothing is
     faded (the attribute alone does nothing). */
  function initFades() {
    var els = Array.prototype.slice.call(doc.querySelectorAll('[data-nq-fade]'));
    if (!els.length) return;
    doc.documentElement.classList.add('nq-fade-on');
    var ticking = false;
    function run() {
      ticking = false;
      var vh = window.innerHeight;
      var start = vh * 0.98;
      var span = Math.min(340, vh * 0.42);
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var t = Math.max(0, Math.min(1, (start - r.top) / span));
        t = 1 - Math.pow(1 - t, 2);
        els[i].style.opacity = t.toFixed(3);
        els[i].style.transform = reduce.matches ? 'none' : 'translate3d(0,' + ((1 - t) * 14).toFixed(1) + 'px,0)';
      }
    }
    function on() { if (!ticking) { ticking = true; window.requestAnimationFrame(run); } }
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on, { passive: true });
    run();
    window.NQ = window.NQ || {};
    window.NQ.fades = { refresh: run };
  }

  /* The ten destinations: disclosures, one open at a time (design-system 12.9). */
  function initDirectory() {
    var list = doc.querySelector('[data-nq-dests]');
    if (!list) return;
    var buttons = Array.prototype.slice.call(list.querySelectorAll('[data-nq-dest]'));
    var loc = null;
    var open = null;
    var hover = null;
    buttons.forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      doc.getElementById(b.getAttribute('aria-controls')).hidden = true;
    });
    list.classList.add('is-enhanced');

    function lightUp() {
      var id = hover || open;
      if (loc) loc.highlight(id);
      buttons.forEach(function (b) {
        var row = b.closest('.nq-dest');
        row.classList.toggle('is-hl', b.getAttribute('data-nq-dest') === hover && hover !== open);
      });
    }
    function setOpen(id, scroll) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-nq-dest') === id;
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
        doc.getElementById(b.getAttribute('aria-controls')).hidden = !on;
        b.closest('.nq-dest').classList.toggle('is-open', on);
        if (on && scroll) {
          var r = b.getBoundingClientRect();
          if (r.top < 0 || r.bottom > window.innerHeight * 0.8) b.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
        }
      });
      open = id;
      lightUp();
      if (window.NQ && window.NQ.fades) window.NQ.fades.refresh();
    }
    buttons.forEach(function (b) {
      var id = b.getAttribute('data-nq-dest');
      b.addEventListener('click', function () { setOpen(open === id ? null : id, false); });
      b.addEventListener('focus', function () { hover = id; lightUp(); });
      b.addEventListener('blur', function () { if (hover === id) { hover = null; lightUp(); } });
      b.addEventListener('pointerenter', function () { if (fine.matches) { hover = id; lightUp(); } });
      b.addEventListener('pointerleave', function () { if (hover === id) { hover = null; lightUp(); } });
    });
    list.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) {
        var b = list.querySelector('[data-nq-dest="' + open + '"]');
        setOpen(null, false);
        if (b) b.focus();
      }
    });

    /* the locator map: hover previews a destination, a click opens it */
    var NQ = window.NQ;
    var inst = NQ && NQ.networkMap && NQ.networkMap.get('locator');
    if (!inst) return;
    inst.ready.then(function () {
      loc = inst;
      var svg = inst.svg;
      if (!svg) return;
      var tip = inst.el.querySelector('.nq-locator__tip');
      svg.classList.add('is-pickable');
      function idAt(t) {
        var el = t && t.closest ? t.closest('[data-prov]') : null;
        return el ? el.getAttribute('data-prov') : null;
      }
      function showTip(id, ev) {
        if (!tip) return;
        if (!id) { tip.hidden = true; return; }
        var btn = list.querySelector('[data-nq-dest="' + id + '"]');
        var body = btn && doc.getElementById(btn.getAttribute('aria-controls'));
        if (!body) { tip.hidden = true; return; }
        tip.innerHTML = '';
        var h = doc.createElement('p');
        h.className = 'nq-locator__tipname';
        h.textContent = btn.textContent;
        tip.appendChild(h);
        Array.prototype.forEach.call(body.querySelectorAll('li'), function (li, i) {
          if (i > 1) return;
          var p = doc.createElement('p');
          p.textContent = li.textContent;
          tip.appendChild(p);
        });
        tip.hidden = false;
        var box = inst.el.getBoundingClientRect();
        var x = ev.clientX - box.left, y = ev.clientY - box.top;
        var left = x > box.width / 2;
        tip.style.left = left ? '' : Math.round(x + 16) + 'px';
        tip.style.right = left ? Math.round(box.width - x + 16) + 'px' : '';
        tip.style.top = Math.round(Math.max(0, y - 24)) + 'px';
      }
      svg.addEventListener('pointermove', function (e) {
        if (!fine.matches) return;
        var id = idAt(e.target);
        if (id !== hover) { hover = id; lightUp(); }
        showTip(id, e);
      });
      svg.addEventListener('pointerleave', function () { hover = null; lightUp(); showTip(null); });
      svg.addEventListener('click', function (e) {
        var id = idAt(e.target);
        if (!id) return;
        setOpen(open === id ? null : id, true);
        showTip(null);
      });
      lightUp();
    });
  }

  /* The engine measures every act's top once (mount, resize, fonts). When
     content above an act changes height (a map arriving, a destination
     opening, an image loading in another act) the stored tops go stale and
     a pinned act's progress runs early or late. Re-measure when main's
     height changes. */
  function initRelayout() {
    var NQ = window.NQ;
    var main = doc.getElementById('main') || doc.body;
    if (!NQ || !NQ.engine || !NQ.engine.layout) return;
    var last = main.offsetHeight;
    var pending = 0;
    function relayout() {
      pending = 0;
      NQ.engine.layout();
      if (NQ.networkMap && NQ.networkMap.follow) NQ.networkMap.follow();
      if (NQ.engine.read) NQ.engine.read();
      if (NQ.fades) NQ.fades.refresh();
    }
    function later() { if (!pending) pending = window.requestAnimationFrame(relayout); }
    if (window.ResizeObserver) {
      new window.ResizeObserver(function () {
        var h = main.offsetHeight;
        if (Math.abs(h - last) > 0.5) { last = h; later(); }
      }).observe(main);
    }
    if (NQ.networkMap && NQ.networkMap.all) {
      Promise.all(NQ.networkMap.all().map(function (i) { return i.ready; })).then(later, later);
    }
    window.addEventListener('load', later);
  }

  function boot() { initFades(); initDirectory(); initRelayout(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
