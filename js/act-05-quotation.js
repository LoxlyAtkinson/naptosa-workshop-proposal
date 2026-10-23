/* =========================================================================
   act-05-quotation.js: act 5, The quotation (piece P3). Page-local; it reads
   the shared figures and touches nothing outside #quotation. Loaded deferred
   from src/partials/05-quotation.html, after js/main.js has booted the page.
   -------------------------------------------------------------------------
   1. Locators. Each entity row gets a small map of South Africa drawn from
      the same network file as every other map on the page (the recurring
      object in ledger mode). One hidden set of province paths is shared by
      the ten locators through <use>, so the file is parsed once.
   2. Landing. Each row, and then the Combined saving line, fades and rises
      in while it crosses the lower part of the screen (scroll-linked, once:
      a landed element stays landed). A landed row ticks its locator: its
      destination lights in gold. Western Cape is lit from the start.
   3. The saving counts once. When the Combined line has landed, its figure
      counts up from R 0.00 to the saving over 1,200 ms, ease-out. The page's
      text is always the final figure: it only goes to opacity 0 while a
      pseudo-element (empty alternative text) draws the counting digits.
   Reduced motion: no fade, rise or count; each row is ticked as it comes
   into view. Without JavaScript the table simply reads complete.
   ========================================================================= */
(function (root) {
  'use strict';
  var doc = root.document;
  var NQ = root.NQ || {};
  var act = doc.getElementById('quotation');
  if (!act) return;
  var reduce = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ledger = act.querySelector('[data-nq-ledger]');
  var rows = ledger ? Array.prototype.slice.call(ledger.querySelectorAll('tbody tr')) : [];
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---- 1. locators ------------------------------------------------------ */
  function buildLocators(text) {
    var src = new root.DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    if (!src || src.nodeName.toLowerCase() !== 'svg') return;
    var vb = src.getAttribute('viewBox') || '-12 -12 1024 919';
    var provs = src.querySelectorAll('path.prov[id]');
    if (!provs.length) return;
    var hub = src.querySelector('.hub .hub-core') || src.querySelector('.hub circle');

    var holder = doc.createElementNS(SVGNS, 'svg');
    holder.setAttribute('class', 'nq-loc-defs');
    holder.setAttribute('aria-hidden', 'true');
    holder.setAttribute('focusable', 'false');
    holder.setAttribute('width', '0');
    holder.setAttribute('height', '0');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    var defs = doc.createElementNS(SVGNS, 'defs');
    var ids = [];
    Array.prototype.forEach.call(provs, function (p) {
      var path = doc.createElementNS(SVGNS, 'path');
      path.setAttribute('id', 'nq-loc-' + p.getAttribute('id'));
      path.setAttribute('d', p.getAttribute('d'));
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.setAttribute('stroke-linejoin', 'round');
      defs.appendChild(path);
      ids.push(p.getAttribute('id'));
    });
    holder.appendChild(defs);
    ledger.appendChild(holder);

    rows.forEach(function (tr) {
      var mine = tr.getAttribute('data-nq-prov');
      var slot = tr.querySelector('.nq-loc');
      if (!mine || !slot || slot.firstChild) return;
      var svg = doc.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', vb);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      var own = null;
      ids.forEach(function (id) {
        var u = doc.createElementNS(SVGNS, 'use');
        u.setAttribute('href', '#nq-loc-' + id);
        u.setAttribute('class', id === mine ? 'nq-loc__mine' : 'nq-loc__land');
        if (id === mine) own = u; else svg.appendChild(u);
      });
      if (own) svg.appendChild(own); /* the destination's edge sits on top */
      if (mine === 'national' && hub) {
        var c = doc.createElementNS(SVGNS, 'circle');
        c.setAttribute('class', 'nq-loc__hub');
        c.setAttribute('cx', hub.getAttribute('cx'));
        c.setAttribute('cy', hub.getAttribute('cy'));
        c.setAttribute('r', '64');
        c.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(c);
      }
      slot.appendChild(svg);
    });
  }

  if (ledger && rows.length && root.fetch && root.DOMParser) {
    var url = ledger.getAttribute('data-nq-map-src');
    if (url) {
      root.fetch(url).then(function (r) {
        if (!r.ok) throw new Error('locator map ' + r.status);
        return r.text();
      }).then(buildLocators).catch(function (err) {
        if (root.console) root.console.warn('[act-05] locators skipped:', err && err.message ? err.message : err);
      });
    }
  }

  /* ---- 3. the saving (set up before the landers so it can be triggered) -- */
  var saving = act.querySelector('.nq-saving');
  var fig = act.querySelector('[data-nq-saving]');
  var money = NQ.figures && NQ.figures.money;
  var cents = NQ.figures && NQ.figures.cents;
  var canCount = !!(fig && money && cents && !reduce && root.requestAnimationFrame);
  var counted = false;
  if (canCount) {
    fig.classList.add('is-counting');
    fig.setAttribute('data-show', money(0));
    fig.setAttribute('data-nq-count-state', 'armed');
  }
  function countSaving() {
    if (!canCount || counted) return;
    counted = true;
    fig.setAttribute('data-nq-count-state', 'running');
    var target = cents('saving');
    var t0 = null;
    var dur = 1200;
    function step(now) {
      if (t0 === null) t0 = now;
      var t = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - t, 3);
      fig.setAttribute('data-show', money(Math.round(target * e)));
      if (t < 1) { root.requestAnimationFrame(step); return; }
      fig.classList.remove('is-counting');
      fig.removeAttribute('data-show');
      fig.setAttribute('data-nq-count-state', 'done');
    }
    root.requestAnimationFrame(step);
  }

  /* the sum map in the saving band: unlit (Western Cape only) until the line
     lands, then every destination lights and the links draw */
  var sumLit = false;
  function sumMap(p) {
    var inst = NQ.networkMap && NQ.networkMap.get && NQ.networkMap.get('ledger-sum');
    if (inst && inst.ready) inst.ready.then(function () { inst.setProgress(sumLit ? 1 : p); });
  }
  sumMap(reduce ? 1 : 0);
  if (reduce) sumLit = true;
  function landSaving() {
    sumLit = true;
    sumMap(1);
    countSaving();
  }

  /* ---- 2. landing ------------------------------------------------------- */
  var landers = rows.map(function (tr) {
    return { el: tr, t: 0, done: function () { tr.classList.add('is-landed'); } };
  });
  if (saving) landers.push({ el: saving, t: 0, done: landSaving });

  if (landers.length) {
    if (reduce || !root.requestAnimationFrame) {
      /* no fade and no rise: each row is ticked as it comes into view */
      var finish = function (L) { if (L.t < 1) { L.t = 1; L.done(); } };
      if ('IntersectionObserver' in root) {
        var io = new root.IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            landers.forEach(function (L) { if (L.el === e.target) finish(L); });
            io.unobserve(e.target);
          });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
        landers.forEach(function (L) { io.observe(L.el); });
      } else {
        landers.forEach(finish);
      }
    } else {
      if (ledger) ledger.classList.add('nq-ledger--armed');
      if (saving) saving.classList.add('nq-saving--armed');
      var ticking = false;
      var measure = function () {
        ticking = false;
        var vh = root.innerHeight || doc.documentElement.clientHeight;
        /* an element lands while its top crosses the lower part of the screen:
           over 360 px (--nq-fade-window), or a third of a short screen */
        var band = Math.min(360, vh * 0.34);
        for (var i = 0; i < landers.length; i++) {
          var L = landers[i];
          if (L.t >= 1) continue;
          var t = (vh - L.el.getBoundingClientRect().top) / band;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          if (t <= L.t) continue;
          L.t = t >= 0.999 ? 1 : t;
          L.el.style.setProperty('--land', L.t === 1 ? '1' : L.t.toFixed(3));
          if (L.t === 1) L.done();
        }
      };
      var onScroll = function () {
        if (!ticking) { ticking = true; root.requestAnimationFrame(measure); }
      };
      root.addEventListener('scroll', onScroll, { passive: true });
      root.addEventListener('resize', onScroll, { passive: true });
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(onScroll);
      measure();
    }
  }
})(self);
