/* =========================================================================
   act-03-workshop.js: act 3, A workshop day, and its coda (piece P2)
   -------------------------------------------------------------------------
   Page-local; the engine moves the rail (data-sc-pan) and is never edited.
   1. The intro assembles as the stage slides up into view: the giant word
      rises from its mask, the heading's lines rise from theirs one after the
      other (--ew, line transforms). On desktop the heading then leaves
      (--hv) before the first body text enters, so a screen never holds more
      than three type sizes.
   2. Each beat settles as it enters the window: the word rises, the
      photograph eases into place (--wv, --arr), and each body line fades in
      over its first stretch of travel into the window. --par (-1 to 1, the beat's place in the window) moves the inset
      on a nearer plane and the photograph inside its frame, so the rail
      reads as depth rather than a slideshow.
   3. The clip plays once when half of it is in the window, muted; the
      Pause and Play button beside its caption controls it. With reduced
      motion it never starts on its own.
   4. The coda's lines fade in over 360 px of scroll as they rise.
   Reduced motion: everything is shown settled; nothing moves.
   ========================================================================= */
(function (root) {
  'use strict';
  var doc = root.document;
  var sec = doc.getElementById('workshop');
  if (!sec || !root.matchMedia) return;
  var stage = sec.querySelector('[data-sc-stage]');
  var intro = sec.querySelector('.nq-day__intro');
  var title = doc.getElementById('workshop-title');
  var beats = Array.prototype.slice.call(sec.querySelectorAll('.nq-day__beat'));
  var clipFig = sec.querySelector('[data-nq-clip]');
  var clipBtn = sec.querySelector('[data-nq-clip-toggle]');
  var ledger = doc.querySelector('.nq-ledger');
  var wlines = ledger ? Array.prototype.slice.call(ledger.querySelectorAll('[data-nq-wline]')) : [];
  var rlines = Array.prototype.slice.call(sec.querySelectorAll('[data-nq-rline]'));
  var reduceMQ = root.matchMedia('(prefers-reduced-motion: reduce)');
  var deskMQ = root.matchMedia('(min-width: 1024px)');
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var smooth = function (x) { x = clamp01(x); return x * x * (3 - 2 * x); };
  var ticking = false;
  var maskLines = [];
  var clipState = { started: false, userPaused: false };

  /* ---- the heading, split into masked lines (re-split when the width changes) */
  var titleText = title ? title.textContent : '';
  var splitWidth = -1;
  function splitTitle() {
    if (!title) return;
    var w = title.clientWidth;
    if (w === splitWidth && maskLines.length) return;
    splitWidth = w;
    title.textContent = titleText;
    var words = titleText.split(/\s+/).filter(Boolean);
    title.textContent = '';
    var probes = words.map(function (word, i) {
      var s = doc.createElement('span');
      s.textContent = word;
      title.appendChild(s);
      if (i < words.length - 1) title.appendChild(doc.createTextNode(' '));
      return s;
    });
    var groups = [], cur = null, last = null;
    probes.forEach(function (s) {
      var top = s.offsetTop;
      if (last === null || Math.abs(top - last) > 1) { cur = []; groups.push(cur); last = top; }
      cur.push(s.textContent);
    });
    title.textContent = '';
    maskLines = groups.map(function (g, i) {
      var mask = doc.createElement('span');
      mask.className = 'nq-mask';
      var inner = doc.createElement('span');
      inner.className = 'nq-mask__i';
      inner.textContent = g.join(' ');
      mask.appendChild(inner);
      title.appendChild(mask);
      if (i < groups.length - 1) title.appendChild(doc.createTextNode(' '));
      return inner;
    });
  }

  /* ---- the clip ----------------------------------------------------------- */
  function activeVideo() {
    if (!clipFig) return null;
    var vids = clipFig.querySelectorAll('video');
    for (var i = 0; i < vids.length; i++) if (vids[i].offsetParent !== null) return vids[i];
    return vids[0] || null;
  }
  function setBtn(playing) {
    if (!clipBtn) return;
    clipBtn.textContent = playing ? 'Pause' : 'Play';
    clipBtn.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' the workshop clip');
  }
  function playClip() {
    var v = activeVideo();
    if (!v) return;
    v.muted = true;
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () { setBtn(false); });
  }
  function wireClip() {
    if (!clipFig) return;
    Array.prototype.forEach.call(clipFig.querySelectorAll('video'), function (v) {
      v.addEventListener('play', function () { setBtn(true); });
      v.addEventListener('pause', function () { setBtn(false); });
      v.addEventListener('ended', function () { setBtn(false); });
    });
    if (clipBtn) clipBtn.addEventListener('click', function () {
      var v = activeVideo();
      if (!v) return;
      clipState.started = true;
      if (v.paused || v.ended) { clipState.userPaused = false; playClip(); }
      else { clipState.userPaused = true; v.pause(); }
    });
    setBtn(false);
  }

  /* ---- per frame ------------------------------------------------------------- */
  function update() {
    ticking = false;
    var vh = root.innerHeight;
    var vw = root.innerWidth;
    var still = reduceMQ.matches;
    var winR = deskMQ.matches ? vw - (parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--nq-panel-w')) * 16 || 280) - 32 : vw;
    if (!(winR > 0)) winR = vw;

    /* 1. the intro, as the stage arrives */
    if (stage && intro) {
      var st = stage.getBoundingClientRect().top;
      var e = still ? 1 : clamp01(1 - st / vh);
      intro.style.setProperty('--ew', smooth((e - 0.25) / 0.35).toFixed(3));
      for (var i = 0; i < maskLines.length; i++) {
        var lv = still ? 1 : smooth((e - 0.4 - i * 0.09) / 0.32);
        maskLines[i].style.transform = lv >= 1 ? 'none' : 'translate3d(0,' + ((1 - lv) * 104).toFixed(1) + '%,0)';
        maskLines[i].style.opacity = lv.toFixed(3);
      }
      /* desktop: the heading leaves before the first body text arrives, so a
         screen never holds more than three type sizes */
      var p = parseFloat(sec.style.getPropertyValue('--sc-p')) || 0;
      var hv = (still || !deskMQ.matches) ? 1 : 1 - smooth((p - 0.035) / 0.065);
      intro.style.setProperty('--hv', hv.toFixed(3));
    }

    /* 2. each beat as it enters the window */
    beats.forEach(function (b) {
      var r = b.getBoundingClientRect();
      var arr = still ? 1 : clamp01((winR - r.left) / (0.62 * winR));
      var mid = (r.left + Math.min(r.width, vw) / 2 - winR / 2) / winR;
      b.style.setProperty('--arr', smooth(arr).toFixed(3));
      b.style.setProperty('--wv', (still ? 1 : smooth((arr - 0.05) / 0.45)).toFixed(3));
      b.style.setProperty('--par', (still ? 0 : Math.max(-1, Math.min(1, mid))).toFixed(3));
    });

    /* the rail's body lines arrive with the rail: each fades in over its
       first stretch of travel into the window (360 px at most) */
    var RW = Math.min(360, 0.32 * winR);
    for (var m = 0; m < rlines.length; m++) {
      var rl = rlines[m];
      var rr = rl.getBoundingClientRect();
      if (rr.right < -vw || rr.left > 2 * vw) continue;
      var rv = still ? 1 : clamp01((winR - rr.left) / RW);
      rl.style.opacity = rv.toFixed(3);
      rl.style.transform = still ? 'none' : 'translate3d(' + ((1 - rv) * 14).toFixed(2) + 'px,0,0)';
    }

    /* 3. the clip: once, when half of it is in the window */
    if (clipFig && !clipState.started && !still) {
      var v = activeVideo();
      var fr = (v ? v.parentNode : clipFig).getBoundingClientRect();
      var visW = Math.max(0, Math.min(fr.right, winR) - Math.max(fr.left, 0));
      var visH = Math.max(0, Math.min(fr.bottom, vh) - Math.max(fr.top, 0));
      if (fr.width > 0 && visW * visH >= 0.5 * fr.width * fr.height) {
        clipState.started = true;
        playClip();
      }
    }

    /* 4. the coda's lines */
    var narrow = vw < 1024;
    var W = narrow ? Math.min(300, 0.3 * vh) : Math.min(360, 0.4 * vh);
    var start = narrow ? vh - 72 : vh * 0.97;
    for (var j = 0; j < wlines.length; j++) {
      var el = wlines[j];
      var lr = el.getBoundingClientRect();
      if (lr.bottom < -vh || lr.top > 2 * vh) continue;
      var f = still ? 1 : clamp01((start - lr.top) / W);
      el.style.opacity = f.toFixed(3);
      el.style.transform = still ? 'none' : 'translate3d(0,' + ((1 - f) * 12).toFixed(2) + 'px,0)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; root.requestAnimationFrame(update); } }

  function relayout() {
    root.requestAnimationFrame(function () { splitWidth = -1; splitTitle(); update(); });
  }

  function boot() {
    splitTitle();
    wireClip();
    sec.classList.add('is-live');
    if (ledger) ledger.classList.add('is-live');
    update();
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('resize', relayout, { passive: true });
    [reduceMQ, deskMQ].forEach(function (mq) { if (mq.addEventListener) mq.addEventListener('change', relayout); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(self);
