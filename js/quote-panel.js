/* =========================================================================
   quote-panel.js: the live quote panel is the page's navigation
   -------------------------------------------------------------------------
   Desktop (1024 px and wider): a slim panel on the right edge. Phones and
   tablets: a bar along the bottom (.nq-bar) whose "Open quote" button opens
   the same panel as a sheet: role="dialog", aria-modal, the page behind
   inert, focus on the title and kept inside, Escape or Close returns focus
   to the opener (design-system.md 12.1 and 12.2).
   Both appear once the hero's price row ([data-nq-price-row]) has scrolled
   away, so a price is always in view (BRIEF A6), and step aside during the
   close, where the acceptance summary is the page.
   Chapters: every element with data-nq-chapter belongs to that chapter; the
   one under 40% of the viewport is current: aria-current="location" on its
   link, "Chapter: name" in the panel, html[data-nq-chapter], the mini-map's
   mode. The panel and bar take the ground (night, day) of what is beneath
   them, so a surface always sits on its own ground.
   Exposes NQ.panel = { init, current(), openSheet(), closeSheet(), refresh() }.
   ========================================================================= */
(function (root) {
  'use strict';
  var NQ = root.NQ = root.NQ || {};
  var doc = root.document;
  var html = doc.documentElement;
  var desktopMQ = root.matchMedia('(min-width: 1024px)');

  var MINI_MODE = {
    overview: 'lit', network: 'lit', sites: 'blueprint', workshop: 'lit',
    data: null, quotation: 'resolved', path: 'timeline', acceptance: 'resolved'
  };

  var panel, bar, title, toggle, list, openBtn, closeBtn, nowEl, links, zones;
  var names = {};
  var current = null;
  var listOpen = false;
  var sheetOpen = false;
  var ticking = false;

  function setListOpen(open) {
    listOpen = !!open;
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(listOpen));
      toggle.textContent = listOpen ? 'Hide chapters' : 'Show chapters';
    }
    if (list) list.hidden = desktopMQ.matches ? !listOpen : false;
  }

  function miniMode(id) {
    var m = MINI_MODE[id];
    if (m === null) m = 'data-' + (NQ.state ? NQ.state.get().option : 'A');
    return m || 'lit';
  }

  function setCurrent(id) {
    if (!id || id === current) return;
    current = id;
    html.setAttribute('data-nq-chapter', id);
    html.classList.toggle('nq-at-close', id === 'acceptance');
    links.forEach(function (a) {
      if (a.getAttribute('data-nq-chapter-link') === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (nowEl && names[id]) nowEl.textContent = names[id];
    var mini = NQ.networkMap && NQ.networkMap.get('mini');
    if (mini) mini.setMode(miniMode(id));
  }

  function groundAt(y) {
    for (var i = zones.length - 1; i >= 0; i--) {
      var r = zones[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) {
        var g = zones[i].getAttribute('data-ground');
        return g === 'night-deep' ? 'night' : g;
      }
    }
    return 'night'; /* the hero: a dark frame */
  }

  function track() {
    ticking = false;
    var vh = root.innerHeight;
    var probe = vh * 0.4;
    var found = null;
    for (var i = 0; i < chapterEls.length; i++) {
      var r = chapterEls[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) found = chapterEls[i].getAttribute('data-nq-chapter');
    }
    if (found) setCurrent(found);
    if (desktopMQ.matches) {
      var pr = panel.getBoundingClientRect();
      panel.setAttribute('data-ground', groundAt(pr.top + Math.min(pr.height, vh) / 2));
    } else if (bar) {
      var g = groundAt(vh - bar.offsetHeight / 2);
      bar.setAttribute('data-ground', g);
      panel.setAttribute('data-ground', g);
    }
  }
  var chapterEls = [];
  function onScroll() { if (!ticking) { ticking = true; root.requestAnimationFrame(track); } }

  /* ---- sheet (phones and tablets) ------------------------------------- */
  function background() {
    return Array.prototype.filter.call(doc.body.children, function (el) {
      return el !== panel && el.tagName !== 'SCRIPT' && el.id !== 'nq-live';
    });
  }
  function focusables() {
    return Array.prototype.filter.call(panel.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'), function (el) {
      return el.offsetParent !== null || el === title;
    });
  }
  function openSheet() {
    if (desktopMQ.matches || sheetOpen) return;
    sheetOpen = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    html.classList.add('nq-sheet-open');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    background().forEach(function (el) { el.inert = true; });
    setListOpen(listOpen);
    root.requestAnimationFrame(function () { title.focus({ preventScroll: true }); });
  }
  function closeSheet(returnFocus) {
    if (!sheetOpen) return;
    sheetOpen = false;
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    html.classList.remove('nq-sheet-open');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    background().forEach(function (el) { el.inert = false; });
    if (returnFocus !== false && openBtn) openBtn.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      if (sheetOpen) { e.preventDefault(); closeSheet(true); return; }
      if (desktopMQ.matches && listOpen && panel.contains(doc.activeElement)) {
        e.preventDefault();
        setListOpen(false);
        toggle.focus();
      }
      return;
    }
    if (e.key === 'Tab' && sheetOpen) {
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (doc.activeElement === first || doc.activeElement === title)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function jump(id) {
    var target = doc.getElementById(id);
    if (!target) return;
    if (NQ.acts && NQ.acts.jump) NQ.acts.jump(target);
    else target.scrollIntoView();
    try { root.history.replaceState(null, '', '#' + id); } catch (e) { /* file: or sandboxed */ }
  }

  function init() {
    panel = doc.querySelector('[data-nq-panel]');
    if (!panel) return;
    bar = doc.querySelector('[data-nq-bar]');
    title = doc.getElementById('nq-panel-title');
    toggle = panel.querySelector('[data-nq-chapters-toggle]');
    list = doc.getElementById('nq-chapter-list');
    openBtn = doc.querySelector('[data-nq-sheet-open]');
    closeBtn = panel.querySelector('[data-nq-sheet-close]');
    nowEl = panel.querySelector('[data-nq-now]');
    links = Array.prototype.slice.call(panel.querySelectorAll('[data-nq-chapter-link]'));
    links.forEach(function (a) {
      var n = a.querySelector('.nq-chapters__name');
      names[a.getAttribute('data-nq-chapter-link')] = n ? n.textContent : a.textContent;
    });
    chapterEls = Array.prototype.slice.call(doc.querySelectorAll('[data-nq-chapter]'));
    zones = Array.prototype.slice.call(doc.querySelectorAll('body [data-ground]')).filter(function (el) {
      return !panel.contains(el) && el !== panel && el !== bar;
    });

    html.classList.add('nq-panel-on');
    setListOpen(false);

    if (toggle) toggle.addEventListener('click', function () { setListOpen(!listOpen); });
    if (openBtn) openBtn.addEventListener('click', openSheet);
    if (closeBtn) closeBtn.addEventListener('click', function () { closeSheet(true); });
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        e.preventDefault();
        if (sheetOpen) { closeSheet(false); root.requestAnimationFrame(function () { jump(id); }); }
        else jump(id);
      });
    });
    doc.addEventListener('keydown', onKey);
    var onMQ = function () {
      if (desktopMQ.matches && sheetOpen) closeSheet(false);
      setListOpen(listOpen);
      onScroll();
    };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onMQ); else desktopMQ.addListener(onMQ);

    /* show the chrome once the price row has gone above the fold */
    var row = doc.querySelector('[data-nq-price-row]');
    if (row && root.IntersectionObserver) {
      new root.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          html.classList.toggle('nq-chrome-on', !e.isIntersecting && e.boundingClientRect.bottom <= 0);
        });
      }, { threshold: 0 }).observe(row);
    } else {
      html.classList.add('nq-chrome-on');
    }

    if (NQ.state) NQ.state.subscribe(function (s) {
      if (current === 'data') { var mini = NQ.networkMap && NQ.networkMap.get('mini'); if (mini) mini.setMode('data-' + s.option); }
    });

    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('resize', onScroll, { passive: true });
    track();
    var mini = NQ.networkMap && NQ.networkMap.get('mini');
    if (mini) mini.ready.then(function () { mini.setMode(miniMode(current || 'overview')); });
  }

  NQ.panel = {
    init: init,
    current: function () { return current; },
    openSheet: openSheet,
    closeSheet: closeSheet,
    refresh: onScroll
  };
})(self);
