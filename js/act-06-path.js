/* =========================================================================
   act-06-path.js: act 6, People and path (piece P3). Page-local: it reads the
   engine's own record of the act (NQ.acts.record) and touches nothing outside
   #path. Loaded deferred from src/partials/06-path.html, after js/main.js.
   -------------------------------------------------------------------------
   The engine pins the act and owns its height; this script moves the rail.
   A plain pan travels at one speed, which reads every frame at a run. This
   one is a dolly with stops: it holds on each frame and moves between them,
   with monotone cubic easing so a hold eases into a move and out again.
     train     the opener (the trainee number) and the training terms;
               on phones a wide spread that the hold reads across
     people    the clip, played once when half in view (Pause and Play)
     route     the map plane holds still while the path passes beneath it;
               the stage under the map's centre sets the map's state:
                 0  before the path: Western Cape lit (retained)
                 1  access and inventory: the existing sites outlined
                 2  design and national foundation: the hub lights
                 3  provincial batches: the eight new sites in build together
                 4  workshop activation: the eight lit and connected
                 5  handover: the whole network lit
               No province lights before another (BRIEF A5).
     handover  the photograph and the estimate, where the path ends
   Reduced motion (and no script): css lays the frames out as a page; here
   the stage simply follows the stage nearest the middle of the screen, and
   the clip never starts by itself.
   The stage publishes data-sc-verify-state (rail offset and stage) so the
   verification harness sees this bespoke travel (verify.md).
   ========================================================================= */
(function (root) {
  'use strict';
  var doc = root.document;
  var NQ = root.NQ || {};
  var act = doc.getElementById('path');
  if (!act) return;
  var stageEl = act.querySelector('[data-sc-stage]');
  var rail = act.querySelector('[data-nq-path-rail]');
  if (!stageEl || !rail) return;

  var frames = {};
  Array.prototype.forEach.call(rail.querySelectorAll('[data-nq-frame]'), function (f) {
    frames[f.getAttribute('data-nq-frame')] = f;
  });
  var plane = act.querySelector('[data-nq-path-plane]');
  var mapBox = act.querySelector('.nq-path__map');
  var line = act.querySelector('.nq-path__line');
  var items = Array.prototype.slice.call(act.querySelectorAll('[data-nq-stage-item]'));
  var endNode = act.querySelector('[data-nq-path-end]');
  var nodes = items.map(function (li) { return li.querySelector('.nq-path__node'); });
  var reduceMQ = root.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopMQ = root.matchMedia('(min-width: 1024px)');
  var stacked = reduceMQ.matches;

  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };

  /* ---- the map's state ---------------------------------------------------- */
  var MAP_P = [0, 0, 0.1, 0.4, 0.7, 1]; /* network-map.js timeline progress per stage */
  var stage = -1;
  function applyMap() {
    var inst = NQ.networkMap && NQ.networkMap.get && NQ.networkMap.get('path');
    if (!inst) return;
    inst.ready.then(function () { inst.setProgress(MAP_P[Math.max(stage, 0)]); });
  }
  function setStage(k) {
    if (k === stage) return;
    stage = k;
    if (mapBox) mapBox.setAttribute('data-nq-stage', String(k));
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-reached', i < k);
      items[i].classList.toggle('is-current', i === k - 1);
    }
    applyMap();
  }

  /* ---- monotone cubic interpolation (Fritsch and Carlson) ----------------- */
  function monotone(xs, ys) {
    var n = xs.length, d = [], m = [], i;
    for (i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / Math.max(xs[i + 1] - xs[i], 1e-9);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      var a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { var t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return function (x) {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      var k = 0;
      while (k < n - 2 && x > xs[k + 1]) k++;
      var h = xs[k + 1] - xs[k], t = (x - xs[k]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h * m[k] +
             (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h * m[k + 1];
    };
  }

  /* ---- layout: measure the frames at rest, then plan the dolly ----------- */
  var L = null;
  function box(el, ox) {
    var r = el.getBoundingClientRect();
    return { l: r.left - ox, r: r.right - ox, w: r.width, t: r.top, b: r.bottom };
  }

  function layout() {
    if (stacked) {
      rail.style.transform = '';
      if (plane) plane.style.transform = '';
      if (frames.route) frames.route.style.minWidth = '';
      L = null;
      return;
    }
    rail.style.transform = 'none';
    if (plane) plane.style.transform = 'none';
    if (frames.route) frames.route.style.minWidth = '';

    var vw = stageEl.clientWidth || root.innerWidth;
    act.style.setProperty('--nq-path-vw', vw + 'px');
    var wv = vw;
    var panel = doc.getElementById('nq-panel');
    if (desktopMQ.matches && panel) {
      var pr = panel.getBoundingClientRect();
      if (pr.width > 0 && pr.left > vw / 2) wv = Math.round(pr.left - Math.max(0, vw - pr.right));
    }
    act.style.setProperty('--nq-path-win', wv + 'px');

    var ox = stageEl.getBoundingClientRect().left;
    var g = parseFloat(root.getComputedStyle(rail).paddingLeft) || 16;
    var mapW = plane ? plane.offsetWidth : 0;
    var desk = desktopMQ.matches;
    var xHold = desk ? Math.round((wv - mapW) / 2) : Math.round(g);
    /* the point on the path the map answers to: under the map's centre on a
       wide screen; at the left gutter on a narrow one, so the current stage's
       card rests whole on screen */
    var nodeR = nodes.length ? box(nodes[0], ox).w / 2 : 7;
    var xNow = desk ? xHold + mapW / 2 : Math.round(g + nodeR);
    if (plane) plane.style.setProperty('--nq-path-drop-x', Math.round(xNow - xHold) + 'px');
    var lead = Math.round(Math.min(64, wv * 0.06));

    var route = frames.route ? box(frames.route, ox) : null;
    var nodeX = nodes.map(function (n) { var r = box(n, ox); return (r.l + r.r) / 2; });
    var oS = 0, oE = 0, planeNat = 0;
    if (route && nodeX.length) {
      planeNat = plane ? box(plane, ox).l : route.l;
      oS = planeNat - xHold;
      oE = nodeX[nodeX.length - 1] - xNow + lead;
      /* the released map must never meet the handover frame */
      var need = Math.ceil((oE - oS) + mapW + 8);
      if (route.w < need) {
        frames.route.style.minWidth = need + 'px';
        route = box(frames.route, ox);
      }
    }
    /* the path runs from the first stage to the end node under the photograph */
    var endX = nodeX.length ? nodeX[nodeX.length - 1] : 0;
    if (endNode) { var eb = box(endNode, ox); endX = (eb.l + eb.r) / 2; }
    if (line && nodeX.length) {
      var trackL = box(line.parentNode, ox).l;
      line.style.left = Math.round(nodeX[0] - trackL) + 'px';
      line.style.width = Math.round(endX - nodeX[0]) + 'px';
      if (plane) {
        var drop = box(line, ox).t - box(plane, ox).b;
        plane.style.setProperty('--nq-path-drop', Math.max(0, Math.round(drop)) + 'px');
      }
    }

    var last = frames.handover || frames.route || frames.train;
    var maxOff = Math.max(0, Math.round(box(last, ox).r + g - wv));
    var fit = function (r) { return r.w <= wv - 2 * g + 2; };
    var centre = function (r) { return clamp(r.l + r.w / 2 - wv / 2, 0, maxOff); };

    /* holds, in rail offset, and the scroll each one is worth (px); a move
       into a hold travels at its own speed (px of rail per px of scroll) */
    var READ = 1.45, MOVE = 2.6, STEP = 1.9, STOP = 230, DRIFT = Math.round(wv * 0.02);
    var segs = [];
    var tr = box(frames.train, ox);
    if (fit(tr)) segs.push({ id: 'train', a: 0, b: Math.min(DRIFT, maxOff), w: 260 });
    else {
      /* phones: the opener rests first, then the spread is read across */
      var tb = clamp(tr.r + g - wv, 0, maxOff);
      segs.push({ id: 'train', a: 0, b: Math.min(DRIFT, tb), w: 220 });
      segs.push({ id: 'train-read', a: Math.min(DRIFT, tb), b: tb, w: 120 + tb / READ });
    }
    if (frames.people) {
      var pp = box(frames.people, ox);
      if (fit(pp)) { var pc = centre(pp); segs.push({ id: 'people', a: pc - DRIFT / 2, b: pc + DRIFT / 2, w: 300 }); }
      else { var pa = clamp(pp.l - g, 0, maxOff), pb = clamp(pp.r + g - wv, 0, maxOff); segs.push({ id: 'people', a: pa, b: pb, w: 200 + (pb - pa) / READ }); }
    }
    if (route) {
      /* the map settles with the title card beneath it, then the path stops
         at every stage, its node under the point the map answers to */
      segs.push({ id: 'route', a: oS, b: oS + DRIFT, w: 170 });
      nodeX.forEach(function (x, i) {
        var ok = x - xNow;
        segs.push({ id: 'stage' + (i + 1), a: ok - DRIFT / 2, b: ok + DRIFT / 2, w: STOP, move: STEP });
      });
    }
    if (frames.handover) {
      var hv = box(frames.handover, ox);
      if (fit(hv)) segs.push({ id: 'handover', a: maxOff - DRIFT, b: maxOff, w: 220 });
      else { var ha = clamp(hv.l - g, 0, maxOff); segs.push({ id: 'handover', a: ha, b: maxOff, w: 140 + (maxOff - ha) / READ }); }
    }

    /* keyframes: (scroll weight, offset), holds and the moves between them */
    var xs = [0], ys = [0], acc = 0, prevB = 0, holdP = {};
    segs.forEach(function (s) {
      var a = clamp(Math.max(s.a, prevB), 0, maxOff);
      var b = clamp(Math.max(s.b, a), 0, maxOff);
      var sp = s.move || MOVE;
      if (a > prevB + 0.5) { acc += (a - prevB) / sp; xs.push(acc); ys.push(a); }
      else if (xs.length === 1 && a > 0.5) { acc += a / sp; xs.push(acc); ys.push(a); }
      var start = acc;
      acc += Math.max(s.w, 60);
      xs.push(acc);
      ys.push(b);
      holdP[s.id] = [start, acc];
      prevB = b;
    });
    if (prevB < maxOff - 0.5) { acc += (maxOff - prevB) / MOVE; xs.push(acc); ys.push(maxOff); }
    var total = acc || 1;
    var px = xs.map(function (x) { return x / total; });
    Object.keys(holdP).forEach(function (k) { holdP[k] = [holdP[k][0] / total, holdP[k][1] / total]; });

    L = {
      wv: wv, xHold: xHold, xNow: xNow, oS: oS, oE: oE, planeNat: planeNat, nodeX: nodeX, endX: endX,
      early: Math.round(Math.min(40, wv * 0.03)), maxOff: maxOff, holdP: holdP,
      offsetAt: monotone(px, ys)
    };
  }

  /* ---- render: one frame of the dolly ------------------------------------- */
  function progress() {
    var rec = NQ.acts && NQ.acts.record ? NQ.acts.record(act) : null;
    var vh = root.innerHeight;
    var top = rec ? rec.top : act.getBoundingClientRect().top + root.scrollY;
    var h = rec ? rec.height : act.offsetHeight;
    return { top: top, travel: Math.max(h - vh, 1), p: clamp((root.scrollY - top) / Math.max(h - vh, 1), 0, 1) };
  }

  var ticking = false;
  function render() {
    ticking = false;
    if (stacked) { renderStacked(); return; }
    if (!L) return;
    var o = L.offsetAt(progress().p);
    rail.style.transform = 'translate3d(' + (-o).toFixed(1) + 'px,0,0)';
    if (plane) {
      var sx = L.xHold + Math.max(0, L.oS - o) - Math.max(0, o - L.oE);
      plane.style.transform = 'translate3d(' + (sx - L.planeNat + o).toFixed(1) + 'px,0,0)';
      plane.setAttribute('data-hold', o >= L.oS - 2 && o <= L.oE + 2 ? 'on' : 'off');
    }
    var k = 0;
    for (var i = 0; i < L.nodeX.length; i++) if (o >= L.nodeX[i] - L.xNow - L.early) k = i + 1;
    setStage(k);
    if (line && L.nodeX.length > 1) {
      var span = Math.max(L.endX - L.nodeX[0], 1);
      line.style.setProperty('--nq-path-k', clamp((o + L.xNow - L.nodeX[0]) / span, 0, 1).toFixed(4));
    }
    if (endNode) endNode.classList.toggle('is-reached', o + L.xNow >= L.endX - 2);
    stageEl.setAttribute('data-sc-verify-state', Math.round(o) + '|' + k);
  }

  function renderStacked() {
    var mid = root.innerHeight * 0.55;
    var k = 0;
    for (var i = 0; i < items.length; i++) if (items[i].getBoundingClientRect().top < mid) k = i + 1;
    setStage(k);
  }

  function onScroll() { if (!ticking) { ticking = true; root.requestAnimationFrame(render); } }
  function relayout() { layout(); render(); }

  /* ---- keyboard: a focused control is brought into its frame ------------- */
  root.addEventListener('focusin', function (e) {
    if (stacked || !L) return;
    var el = e.target;
    if (!el || !act.contains(el)) return;
    var fr = el.closest('[data-nq-frame]');
    var hp = fr && L.holdP[fr.getAttribute('data-nq-frame')];
    if (!hp) return;
    var r = el.getBoundingClientRect();
    if (r.left >= 0 && r.right <= L.wv && r.top >= 0 && r.bottom <= root.innerHeight) return;
    var g = progress();
    root.scrollTo({ top: Math.round(g.top + g.travel * (hp[0] + hp[1]) / 2), behavior: 'instant' });
  });

  /* ---- the clip: once when half in view, with Pause and Play --------------- */
  (function clip() {
    var video = act.querySelector('[data-nq-clip]');
    var btn = act.querySelector('[data-nq-clip-toggle]');
    if (!video) return;
    var portrait = !stacked && root.matchMedia('(max-width: 1023.98px)').matches;
    if (portrait) {
      var mp = video.getAttribute('data-nq-poster-mobile');
      var ml = video.getAttribute('data-nq-label-mobile');
      if (mp) video.setAttribute('poster', mp);
      if (ml) video.setAttribute('aria-label', ml);
    }
    var srcAttr = portrait ? 'data-sc-src-mobile' : 'data-sc-src';
    var loaded = false, started = false;
    function load() {
      if (loaded) return;
      loaded = true;
      video.preload = 'auto';
      video.src = video.getAttribute(srcAttr) || video.getAttribute('data-sc-src');
    }
    function play() {
      load();
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () { setBtn(); });
    }
    function setBtn() {
      if (btn) btn.textContent = !video.paused && !video.ended ? 'Pause' : 'Play';
    }
    ['play', 'playing', 'pause', 'ended'].forEach(function (ev) { video.addEventListener(ev, setBtn); });
    if (btn) btn.addEventListener('click', function () {
      if (video.paused || video.ended) play(); else video.pause();
    });
    if (!('IntersectionObserver' in root)) return;
    var near = new root.IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { load(); near.disconnect(); } });
    }, { rootMargin: '100% 100% 100% 100%' });
    near.observe(video);
    if (stacked || reduceMQ.matches) return;
    var half = new root.IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (started || !e.isIntersecting || e.intersectionRatio < 0.5) return;
        started = true;
        half.disconnect();
        play();
      });
    }, { threshold: [0.5] });
    half.observe(video);
  })();

  /* ---- boot ---------------------------------------------------------------- */
  setStage(0);
  relayout();
  root.addEventListener('scroll', onScroll, { passive: true });
  var rz = false;
  root.addEventListener('resize', function () {
    if (rz) return;
    rz = true;
    root.requestAnimationFrame(function () { rz = false; relayout(); });
  }, { passive: true });
  root.addEventListener('load', relayout);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
  if (NQ.networkMap && NQ.networkMap.get) {
    var inst = NQ.networkMap.get('path');
    if (inst && inst.ready) inst.ready.then(function () { applyMap(); });
  }
})(self);
