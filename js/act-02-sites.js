/* =========================================================================
   act-02-sites.js: act 2, What every site gets (design-loop piece P2)
   -------------------------------------------------------------------------
   Page-local. The engine is never edited; this reads its act record (the
   object ScrollCraft.mount returned, kept as NQ.engine) and the act's own
   --sc-p, and writes custom properties for css/act-02-sites.css.
   1. Geometry: the iris is centred on Free State's node, and the node is laid
      on the plan's header mark ([data-nq-iris-anchor]); --R covers the frame.
   2. Timing from the real geometry: the iris window and the heading's cue
      window are written into the engine's act record (and its attributes),
      so the change of ground happens where the frame is, at any size.
   3. The plan: one progress --q on the figure, a window (--a, --b) per part,
      per leader and per label. The foundation is timed to the copy that
      names it. On desktop no label shows while the giant 9 is on screen, so
      a screen never carries more than three type sizes.
   4. Body lines fade over 360 px of scroll (at most 40% of the viewport),
      and only once the paper is under them.
   5. The quote panel and the phone bar read the ground under them from the
      marker element; it turns to day once the iris has passed them.
   Reduced motion: no iris (the engine's stylesheet), --q held at 1 in CSS,
   lines fade without rising.
   ========================================================================= */
(function (root) {
  'use strict';
  var doc = root.document;
  var sec = doc.getElementById('sites');
  if (!sec || !root.matchMedia) return;

  var frame = sec.querySelector('[data-nq-sites-frame]');
  var iris = sec.querySelector('.nq-sites__iris');
  var sheetIn = sec.querySelector('.nq-sites__sheet-in');
  var mapBox = sec.querySelector('.nq-sites__map');
  var marker = sec.querySelector('.nq-sites__marker');
  var fig = sec.querySelector('[data-nq-plan]');
  var h2 = doc.getElementById('sites-title');
  var search = sec.querySelector('[data-nq-search]');
  var nineCopy = sec.querySelector('.nq-sites__nine--copy');
  var lines = Array.prototype.slice.call(sec.querySelectorAll('[data-nq-line]'));
  if (!frame || !iris || !fig) return;

  var reduceMQ = root.matchMedia('(prefers-reduced-motion: reduce)');
  var stickyMQ = root.matchMedia('(min-width: 1200px)');
  var phoneMQ = root.matchMedia('(max-width: 719.98px)');

  /* the plan's parts in drawing order, and each part's share of the timeline */
  var PLAN = [
    ['frames', 0.03, 0.20], ['header', 0.15, 0.27], ['hero', 0.22, 0.32], ['news', 0.28, 0.40],
    ['resources', 0.36, 0.46], ['bookings', 0.42, 0.54], ['local', 0.50, 0.60], ['contact', 0.56, 0.66],
    ['ground', 0.63, 0.71], ['foundation', 0.70, 0.86]
  ];
  var FS = { x: 0.5814, y: 0.5112 };  /* Free State's node in the map file's own box, until measured */
  var IRIS_FULL = 0.596;              /* smoothstep(0.596) = 0.641: the radius that reaches --R */

  var G = null;
  var ticking = false;
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  function record() {
    var NQ = root.NQ;
    return NQ && NQ.acts && NQ.acts.record ? NQ.acts.record(sec) : null;
  }
  function svgShown() {
    return fig.querySelector(phoneMQ.matches ? '.nq-plan__svg--phone' : '.nq-plan__svg--desk');
  }
  function docTop(el) { return el.getBoundingClientRect().top + root.scrollY; }

  /* ---- 1. geometry ------------------------------------------------------ */
  function placeMap(fx, fy, fw, fh) {
    /* As large as it can be without its top being cut by the frame's top
       edge: that edge travels up the screen while the frame slides in, and
       a province sliced by a straight line would read as a seam. */
    var byTop = (fy - 0.015 * fh) / FS.y * (1024 / 919);
    var mw = stickyMQ.matches ? Math.min(byTop, fw * 0.7, fh * 1.18)
      : phoneMQ.matches ? Math.min(byTop, fw * 1.5) : Math.min(byTop, fw * 0.95);
    frame.style.setProperty('--mw', mw.toFixed(1) + 'px');
    var node = mapBox.querySelector('.node[data-prov="ZA-FS"]');
    var ox = FS.x * mw, oy = FS.y * mw * 919 / 1024;
    if (node) {
      var box = mapBox.getBoundingClientRect();
      var r = node.getBoundingClientRect();
      if (box.width > 0) {
        ox = r.left + r.width / 2 - box.left;
        oy = r.top + r.height / 2 - box.top;
      }
    }
    frame.style.setProperty('--mx', (fx - ox).toFixed(1) + 'px');
    frame.style.setProperty('--my', (fy - oy).toFixed(1) + 'px');
  }

  function layout() {
    var vh = root.innerHeight;
    var sticky = stickyMQ.matches;
    frame.style.height = '';
    var fw = frame.clientWidth;
    if (!sticky) {
      var need = sheetIn ? sheetIn.offsetHeight : 0;
      if (need > vh) frame.style.height = Math.ceil(need) + 'px';
    }
    var fh = frame.clientHeight;
    frame.style.setProperty('--fw', fw + 'px');
    frame.style.setProperty('--fh', fh + 'px');

    var fr = frame.getBoundingClientRect();
    var svg = svgShown();
    var anchor = svg && svg.querySelector('[data-nq-iris-anchor]');
    var fx = fw * 0.45, fy = fh * 0.46;
    if (anchor) {
      var ar = anchor.getBoundingClientRect();
      fx = ar.left + ar.width / 2 - fr.left;
      fy = ar.top + ar.height / 2 - fr.top;
    }
    var R = Math.max(Math.hypot(fx, fy), Math.hypot(fw - fx, fy), Math.hypot(fx, fh - fy), Math.hypot(fw - fx, fh - fy)) + 2;
    frame.style.setProperty('--fx', fx.toFixed(1) + 'px');
    frame.style.setProperty('--fy', fy.toFixed(1) + 'px');
    frame.style.setProperty('--R', R.toFixed(1) + 'px');
    placeMap(fx, fy, fw, fh);

    /* ---- 2. timing ------------------------------------------------------ */
    var T = docTop(sec);
    var H = sec.offsetHeight;
    var p = function (y) { return clamp01((y + vh - T) / (H + vh)); };
    var yS = T + fy - 0.9 * vh;                         /* Free State is near the bottom of the screen */
    var yFull = sticky ? T + 0.03 * vh : T;             /* paper everywhere as the frame locks (or reaches the top) */
    if (yFull < yS + 0.3 * vh) yFull = yS + 0.3 * vh;
    var irisFrom = p(yS);
    var irisTo = Math.min(1, irisFrom + (p(yFull) - irisFrom) / IRIS_FULL);

    var dH2 = docTop(h2) - T;
    var cueFromY, cueEndY;
    if (sticky) {
      /* the heading assembles as soon as the paper has reached all of it:
         sample the iris (the engine's smoothstep) against the heading's box,
         which rides with the frame until the frame locks, then rises */
      var h2r = h2.getBoundingClientRect(), frr = frame.getBoundingClientRect();
      var hx0 = h2r.left - frr.left, hx1 = h2r.right - frr.left;
      var hy0 = dH2, hh = h2r.height;
      cueFromY = yFull;
      for (var s = 0; s <= 60; s++) {
        var yy = yS + (yFull - yS) * s / 60;
        var u = clamp01((p(yy) - irisFrom) / Math.max(irisTo - irisFrom, 0.001));
        var rad = 1.56 * R * u * u * (3 - 2 * u);
        var shift = Math.max(0, yy - T);
        var top = hy0 - shift, bot = top + hh;
        var far = Math.max(Math.hypot(hx0 - fx, top - fy), Math.hypot(hx1 - fx, top - fy),
          Math.hypot(hx0 - fx, bot - fy), Math.hypot(hx1 - fx, bot - fy));
        if (rad >= far + 24) { cueFromY = yy; break; }
      }
      cueEndY = cueFromY + 0.24 * vh;
    }
    else { cueFromY = T + dH2 - 0.95 * vh; cueEndY = T + dH2 - 0.62 * vh; }
    var cueFrom = p(cueFromY);
    var cueIn = clamp01((p(cueEndY) - cueFrom) / Math.max(1 - cueFrom, 0.001));

    var rec = record();
    if (rec) {
      rec.reveals.forEach(function (rv) { if (rv.el === iris) { rv.from = irisFrom; rv.to = irisTo; } });
      rec.cues.forEach(function (q) { if (q.el === h2) { q.from = cueFrom; q.to = 1; q.rIn = cueIn; q.rOut = 0.001; } });
    }
    iris.setAttribute('data-sc-reveal-at', irisFrom.toFixed(3) + ' ' + irisTo.toFixed(3));
    h2.setAttribute('data-sc-cue', cueFrom.toFixed(3) + ' 1 ' + cueIn.toFixed(3) + ' 0.001');

    /* ---- 3. the plan's timeline -------------------------------------------- */
    var y0 = yS + 0.08 * vh;
    var y1 = sticky ? T + H - vh - 0.1 * vh : T + fh - 0.62 * vh;
    if (y1 < y0 + vh) y1 = y0 + vh;
    var q = function (y) { return (y - y0) / (y1 - y0); };
    var win = {};
    PLAN.forEach(function (row) { win[row[0]] = [row[1], row[2]]; });
    if (sticky && search) {
      var dS = docTop(search) - T;
      var f0 = q(T + dS - 0.86 * vh), f1 = q(T + dS - 0.42 * vh);
      win.foundation = [Math.max(0.68, f0), Math.max(0.78, f1)];
    }
    /* no label while the giant 9 is on screen (desktop): three sizes at most */
    var labelFloor = 0;
    if (sticky && nineCopy) labelFloor = q(T + (docTop(nineCopy) - T) + nineCopy.offsetHeight + 0.02 * vh);

    Array.prototype.forEach.call(fig.querySelectorAll('.nq-plan__part'), function (g) {
      var w = win[g.getAttribute('data-part')] || [0, 1];
      g.style.setProperty('--a', w[0].toFixed(4));
      g.style.setProperty('--b', w[1].toFixed(4));
    });
    var labelWin = {};
    Object.keys(win).forEach(function (k) {
      var a = Math.max(win[k][1] - 0.02, labelFloor);
      labelWin[k] = [a, a + 0.07];
    });
    Array.prototype.forEach.call(fig.querySelectorAll('.nq-plan__leader'), function (g) {
      var w = labelWin[g.getAttribute('data-leader')] || [0, 1];
      g.style.setProperty('--a', (w[0] - 0.03).toFixed(4));
      g.style.setProperty('--b', (w[0] + 0.03).toFixed(4));
    });
    Array.prototype.forEach.call(fig.querySelectorAll('.nq-plan__labels li'), function (li) {
      var w = labelWin[li.getAttribute('data-label')] || [0, 1];
      li.style.setProperty('--a', (w[0] + 0.01).toFixed(4));
      li.style.setProperty('--b', w[1].toFixed(4));
    });

    G = { vh: vh, T: T, H: H, y0: y0, y1: y1, R: R, fx: fx, fy: fy, sticky: sticky };
    sec.classList.add('is-live');
    frameUpdate();
  }

  /* ---- per frame -------------------------------------------------------- */
  function irisRadius() {
    if (reduceMQ.matches) return Infinity;
    var cp = iris.style.clipPath || iris.style.webkitClipPath || '';
    var m = /circle\(\s*([\d.]+)%/.exec(cp);
    if (!m) return Infinity;                    /* the engine has not clipped it: the paper shows */
    return parseFloat(m[1]) / 100 * iris.offsetWidth;
  }

  function frameUpdate() {
    ticking = false;
    if (!G) return;
    var y = root.scrollY;
    var vh = root.innerHeight;
    var qv = clamp01((y - G.y0) / (G.y1 - G.y0));
    fig.style.setProperty('--q', qv.toFixed(4));

    var fr = frame.getBoundingClientRect();
    var cx = fr.left + G.fx, cy = fr.top + G.fy;
    var rad = irisRadius();
    var covered = function (r) {
      if (rad === Infinity) return 1;
      var far = Math.max(Math.hypot(r.left - cx, r.top - cy), Math.hypot(r.right - cx, r.top - cy),
        Math.hypot(r.left - cx, r.bottom - cy), Math.hypot(r.right - cx, r.bottom - cy));
      return clamp01((rad - far) / 48);
    };

    /* phones: the fade starts above the bottom bar and runs shorter */
    var narrow = root.innerWidth < 1024;
    var W = narrow ? Math.min(300, 0.3 * vh) : Math.min(360, 0.4 * vh);
    var start = narrow ? vh - 72 : vh * 0.97;
    var still = reduceMQ.matches;
    for (var i = 0; i < lines.length; i++) {
      var el = lines[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > 2 * vh) continue;
      var fade = clamp01((start - r.top) / W);
      var inFrame = r.bottom > fr.top && r.top < fr.bottom;
      var o = fade * (inFrame ? covered(r) : 1);
      el.style.opacity = o.toFixed(3);
      el.style.transform = still ? 'none' : 'translate3d(0,' + ((1 - fade) * 12).toFixed(2) + 'px,0)';
    }

    /* the ground under the panel (desktop) or the bar (phones) */
    if (marker) {
      var px = root.innerWidth - 160, py = vh * 0.4;
      if (root.innerWidth < 1024) { px = root.innerWidth / 2; py = vh - 32; }
      var g = 'day';
      if (rad !== Infinity && Math.hypot(px - cx, py - cy) > rad - 8) g = 'night';
      if (marker.getAttribute('data-ground') !== g) marker.setAttribute('data-ground', g);
    }
    frame.setAttribute('data-sc-verify-state', 'q' + qv.toFixed(2) + ' r' + (rad === Infinity ? 'x' : (rad / G.R).toFixed(2)));
  }

  function onScroll() { if (!ticking) { ticking = true; root.requestAnimationFrame(frameUpdate); } }

  function relayout() { root.requestAnimationFrame(layout); }

  function boot() {
    layout();
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('resize', relayout, { passive: true });
    [stickyMQ, phoneMQ, reduceMQ].forEach(function (mq) {
      if (mq.addEventListener) mq.addEventListener('change', relayout);
    });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
    root.addEventListener('load', relayout);
    var NQ = root.NQ;
    if (NQ && NQ.networkMap) {
      var night = NQ.networkMap.get('sites');
      if (night && night.ready) night.ready.then(function (inst) { inst.highlight('ZA-FS'); relayout(); });
    }
    /* the engine re-measures after fonts and on resize; follow it */
    root.setTimeout(relayout, 600);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(self);
