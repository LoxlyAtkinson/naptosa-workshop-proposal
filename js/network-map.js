/* =========================================================================
   network-map.js: the recurring object (BRIEF.md, bar.md mechanism 1)
   -------------------------------------------------------------------------
   Every [data-nq-map="name"] container gets its own inline copy of the map
   named by data-nq-map-src (tools/build.mjs writes assets/map/za-network.svg
   when that file exists, otherwise assets/map-proto/za-provinces.svg). The
   file is fetched once. Each copy has its ids prefixed so ten copies never
   clash; the file's own <style> is moved into the head once, its
   #za-network selectors rewritten to .za-network. The prototype map is
   normalised to the same classes (prov, prov--new, prov--existing,
   data-prov="ZA-..") so every mode works on either file.

   Instance API (NQ.networkMap.get(name) or the return value of create):
     setMode(name)   "lit" | "blueprint" | "data-A" | "data-B" | "timeline" |
                     "resolved": the class mode-<name> and data-mode on the
                     svg root (one at a time)
     setProgress(p)  0..1: --map-p on the svg root, and the lighting for the
                     mode (lit: hub, then the eight new sites one by one by
                     name, Western Cape lit from the start; timeline: hub,
                     then the eight together, outline then fill: BRIEF A5)
     highlight(id)   "national" | "ZA-EC" | ... | null: is-hl on every part
                     of that destination, has-hl on the root
     ready           a Promise that resolves with the instance
   Module: NQ.networkMap.create(el, opts), .get(name), .all(),
           .setMode(name), .setProgress(p), .highlight(id) (every instance),
           .ORDER (destinations in the map's own order).
   Containers with data-nq-map-progress="act" follow their act's --sc-p.
   Lit parts carry is-lit; timeline outlines carry is-outline.

   P1 additions (acts 1 and 4, design loop round 1):
   - Label halo. Every label gets a knock-out halo in the current ground
     colour (--nq-map-halo, via map.css): 0.36em, round joins, paint-order
     stroke. Labels are drawn after the links, so no link line can show
     through label text at any size. Two-line labels step by 1.16em.
   - Link routing (every map but the mini-map): a hub link that would run
     through a label or a node gets its curve bent clear. Label plates
     (containers with data-nq-map-plates): a knock-out behind each label in
     the colour of what lies beneath it, so no line crosses label text.
   - --map-k on the svg root (viewBox width / rendered width) and
     data-scale="large" from 440 px wide, so an act can size labels in px.
   - Data plumbing (modes data-A and data-B, the BRIEF's signature move).
     Option A: nine 1.5 px gold lines curve from National and the eight new
     sites into one Western Cape store (three stacked ellipses). Option B:
     the lines retract (300 ms) and a gold padlock locks onto each of the
     nine nodes (600 ms); Western Cape keeps an edge-coloured padlock. A map
     that follows its act draws the lines with scroll inside the window set
     by data-nq-plumb="from to" (act progress) on its container. Reduced
     motion: no drawing and no tween; each state appears whole.
   ========================================================================= */
(function (root) {
  'use strict';
  var NQ = root.NQ = root.NQ || {};
  var doc = root.document;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduceMQ = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var MODES = ['lit', 'blueprint', 'data-A', 'data-B', 'timeline', 'resolved'];
  var ORDER = ['national', 'ZA-EC', 'ZA-FS', 'ZA-GT', 'ZA-NL', 'ZA-LP', 'ZA-MP', 'ZA-NW', 'ZA-NC', 'ZA-WC'];
  var NEW_SITES = ORDER.slice(1, 9);
  var SOURCES = ORDER.slice(0, 9); /* National and the eight new sites: the nine data lines */
  var PROTO = {
    'Northern-Cape': 'ZA-NC', 'KwaZulu-Natal': 'ZA-NL', 'Free-State': 'ZA-FS', 'Eastern-Cape': 'ZA-EC',
    'Limpopo': 'ZA-LP', 'North-West': 'ZA-NW', 'Mpumalanga': 'ZA-MP', 'Western-Cape': 'ZA-WC', 'Gauteng': 'ZA-GT'
  };
  var NAMES = {
    'ZA-EC': 'Eastern Cape', 'ZA-FS': 'Free State', 'ZA-GT': 'Gauteng', 'ZA-NL': 'KwaZulu-Natal', 'ZA-LP': 'Limpopo',
    'ZA-MP': 'Mpumalanga', 'ZA-NW': 'North West', 'ZA-NC': 'Northern Cape', 'ZA-WC': 'Western Cape'
  };

  var files = {};
  var byName = {};
  var list = [];
  var seq = 0;
  var styleDone = false;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function fetchText(url) {
    if (!files[url]) {
      files[url] = root.fetch(url).then(function (r) {
        if (!r.ok) throw new Error('map ' + url + ' ' + r.status);
        return r.text();
      });
    }
    return files[url];
  }

  function prefixIds(svg, pre) {
    var map = {};
    Array.prototype.forEach.call(svg.querySelectorAll('[id]'), function (el) {
      var id = el.getAttribute('id');
      map[id] = pre + id;
      el.setAttribute('id', pre + id);
    });
    if (svg.id) { map[svg.id] = pre + svg.id; svg.id = pre + svg.id; }
    var all = [svg].concat(Array.prototype.slice.call(svg.querySelectorAll('*')));
    all.forEach(function (el) {
      ['aria-labelledby', 'aria-describedby'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v) el.setAttribute(a, v.split(/\s+/).map(function (t) { return map[t] || t; }).join(' '));
      });
      ['href', 'xlink:href'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && v.charAt(0) === '#' && map[v.slice(1)]) el.setAttribute(a, '#' + map[v.slice(1)]);
      });
      ['fill', 'stroke', 'clip-path', 'mask', 'filter', 'marker-start', 'marker-mid', 'marker-end'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && v.indexOf('url(#') > -1) el.setAttribute(a, v.replace(/url\(#([^)]+)\)/g, function (m, id) { return 'url(#' + (map[id] || id) + ')'; }));
      });
    });
  }

  function takeStyle(svg) {
    Array.prototype.forEach.call(svg.querySelectorAll('style'), function (st) {
      if (!styleDone && st.textContent.indexOf('#za-network') > -1) {
        var s = doc.createElement('style');
        s.id = 'nq-map-style';
        s.textContent = st.textContent.replace(/#za-network\b/g, '.za-network');
        doc.head.insertBefore(s, doc.head.firstChild);
        styleDone = true;
      }
      st.parentNode.removeChild(st);
    });
  }

  function normaliseProto(svg) {
    var paths = svg.querySelectorAll('path[id]');
    var hit = false;
    Array.prototype.forEach.call(paths, function (p) {
      var code = PROTO[p.getAttribute('id')];
      if (!code) return;
      hit = true;
      p.setAttribute('data-prov', code);
      p.setAttribute('class', 'prov ' + (code === 'ZA-WC' ? 'prov--existing' : 'prov--new'));
    });
    if (!hit) return;
    Array.prototype.forEach.call(svg.querySelectorAll('rect'), function (r) { r.parentNode.removeChild(r); });
    Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) {
      var name = t.textContent.trim();
      Object.keys(NAMES).forEach(function (k) { if (NAMES[k] === name) t.setAttribute('data-prov', k); });
      t.setAttribute('class', 'lbl');
    });
    svg.classList.add('za-network', 'za-network--proto');
  }

  /* The knock-out halo: wide enough that the stroke closes every gap between
     letters and words, so a line under a label is hidden for the label's
     whole box. The colour stays map.css's --nq-map-halo (the ground). */
  function haloLabels(svg) {
    Array.prototype.forEach.call(svg.querySelectorAll('text.lbl'), function (t) {
      t.style.strokeWidth = '0.36em';
      t.style.strokeLinejoin = 'round';
      t.style.strokeLinecap = 'round';
      t.style.paintOrder = 'stroke';
    });
    Array.prototype.forEach.call(svg.querySelectorAll('text.lbl tspan[dy]'), function (ts) {
      if (/^[\d.]+$/.test(ts.getAttribute('dy') || '')) ts.setAttribute('dy', '1.16em');
    });
  }

  /* Link routing: no hub link may run through a label or a node. Each link
     is a quadratic curve from the hub to its node; when its curve meets a
     visible label's box (the halo included) or another node, its control
     point is moved sideways, a little at a time, until the curve is clear.
     Runs on mount, once the faces have loaded, and whenever the label set or
     the label size changes with the map's width. */
  function quadPoint(a, c, b, t) {
    var u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }
  function obstacles(svg) {
    var out = [];
    Array.prototype.forEach.call(svg.querySelectorAll('text.lbl'), function (t) {
      var set = t.closest('.labels');
      if (set && root.getComputedStyle(set).display === 'none') return;
      var b;
      try { b = t.getBBox(); } catch (e) { return; }
      if (!b || !b.width) return;
      var fs = parseFloat(root.getComputedStyle(t).fontSize) || 18;
      var pad = fs * 0.3 + 3;
      out.push({ x0: b.x - pad, y0: b.y - pad, x1: b.x + b.width + pad, y1: b.y + b.height + pad, prov: t.getAttribute('data-prov') });
    });
    Array.prototype.forEach.call(svg.querySelectorAll('circle.node, .hub .hub-ring'), function (c) {
      var cx = parseFloat(c.getAttribute('cx')), cy = parseFloat(c.getAttribute('cy'));
      var r = (parseFloat(c.getAttribute('r')) || 5) + 4;
      var g = c.closest('[data-prov]');
      out.push({ x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, prov: g ? g.getAttribute('data-prov') : '', node: true });
    });
    return out;
  }
  function hits(a, c, b, obs, own) {
    var n = 0;
    for (var i = 2; i <= 98; i += 2) {
      var pt = quadPoint(a, c, b, i / 100);
      for (var k = 0; k < obs.length; k++) {
        var o = obs[k];
        if (o.node && (o.prov === own || o.prov === 'national')) continue;
        if (pt.x > o.x0 && pt.x < o.x1 && pt.y > o.y0 && pt.y < o.y1) { n += 1; break; }
      }
    }
    return n;
  }
  function routeLinks(svg) {
    if (!svg || !svg.isConnected) return;
    var links = svg.querySelectorAll('path.link');
    if (!links.length) return;
    var obs = obstacles(svg);
    var vb = svg.viewBox && svg.viewBox.baseVal;
    var box = vb && vb.width ? { x0: vb.x, y0: vb.y, x1: vb.x + vb.width, y1: vb.y + vb.height } : null;
    function outside(a, c, b) {
      if (!box) return 0;
      var n = 0;
      for (var i = 5; i <= 95; i += 10) {
        var pt = quadPoint(a, c, b, i / 100);
        if (pt.x < box.x0 + 4 || pt.x > box.x1 - 4 || pt.y < box.y0 + 4 || pt.y > box.y1 - 4) n += 1;
      }
      return n;
    }
    Array.prototype.forEach.call(links, function (ln) {
      var d0 = ln.getAttribute('data-d0') || ln.getAttribute('d');
      if (!ln.hasAttribute('data-d0')) ln.setAttribute('data-d0', d0);
      var m = d0.match(/M\s*([-\d.]+)[ ,]+([-\d.]+)\s*Q\s*([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)/);
      if (!m) return;
      var a = { x: +m[1], y: +m[2] }, c = { x: +m[3], y: +m[4] }, b = { x: +m[5], y: +m[6] };
      var own = ln.getAttribute('data-prov');
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len, tx = dx / len, ty = dy / len;
      var best = { c: c, h: hits(a, c, b, obs, own), cost: 0 };
      if (best.h > 0) {
        /* search the control point across and along the chord; keep the
           clear route that bends the least */
        for (var k = -330; k <= 330; k += 15) {
          for (var j = -240; j <= 240; j += 20) {
            var cc = { x: c.x + nx * k + tx * j, y: c.y + ny * k + ty * j };
            var cost = Math.abs(k) + Math.abs(j) * 0.6;
            if (best.h === 0 && cost >= best.cost) continue;
            var h = hits(a, cc, b, obs, own) + outside(a, cc, b);
            if (h < best.h || (h === best.h && cost < best.cost)) best = { c: cc, h: h, cost: cost };
          }
        }
      }
      ln.setAttribute('d', 'M' + a.x + ' ' + a.y + 'Q' + best.c.x.toFixed(1) + ' ' + best.c.y.toFixed(1) + ' ' + b.x + ' ' + b.y);
      ln.setAttribute('data-route', best.h === 0 ? (best.cost === 0 ? 'clear' : 'moved') : 'blocked');
    });
  }

  /* Label plates (maps whose container carries data-nq-map-plates): a
     knock-out behind each visible label. It is built from a sea-coloured
     base (the ground) and one piece per province the label overlaps, each
     clipped to that province's own shape and coloured like it, so the plate
     itself never shows: lines and province edges simply stop at the label,
     and nothing crosses label text at any size. */
  function ensureClips(svg) {
    if (svg.__nqClips) return svg.__nqClips;
    var defs = svg.querySelector('defs') || svg.insertBefore(doc.createElementNS(SVGNS, 'defs'), svg.firstChild);
    var clips = [];
    Array.prototype.forEach.call(svg.querySelectorAll('path.prov[data-prov]'), function (pv) {
      var id = pv.getAttribute('id');
      if (!id) return;
      var cp = doc.createElementNS(SVGNS, 'clipPath');
      cp.setAttribute('id', id + '-clip');
      var use = doc.createElementNS(SVGNS, 'use');
      use.setAttribute('href', '#' + id);
      cp.appendChild(use);
      defs.appendChild(cp);
      var bb = null;
      try { bb = pv.getBBox(); } catch (e) { bb = null; }
      clips.push({ prov: pv.getAttribute('data-prov'), clip: id + '-clip', existing: pv.classList.contains('prov--existing'), bb: bb });
    });
    svg.__nqClips = clips;
    return clips;
  }
  function plateRect(cls, x, y, w, h, r) {
    var rc = doc.createElementNS(SVGNS, 'rect');
    rc.setAttribute('class', cls);
    rc.setAttribute('x', x.toFixed(1));
    rc.setAttribute('y', y.toFixed(1));
    rc.setAttribute('width', w.toFixed(1));
    rc.setAttribute('height', h.toFixed(1));
    rc.setAttribute('rx', r.toFixed(1));
    return rc;
  }
  function labelPlates(svg) {
    var clips = ensureClips(svg);
    Array.prototype.forEach.call(svg.querySelectorAll('text.lbl'), function (t) {
      var set = t.closest('.labels');
      var g = t.previousElementSibling && t.previousElementSibling.classList.contains('lbl-plates') ? t.previousElementSibling : null;
      if (g) { while (g.firstChild) g.removeChild(g.firstChild); }
      if (set && root.getComputedStyle(set).display === 'none') return;
      var b;
      try { b = t.getBBox(); } catch (e) { return; }
      if (!b || !b.width) return;
      if (!g) {
        g = doc.createElementNS(SVGNS, 'g');
        g.setAttribute('class', 'lbl-plates');
        g.setAttribute('aria-hidden', 'true');
        t.parentNode.insertBefore(g, t);
      }
      var fs = parseFloat(root.getComputedStyle(t).fontSize) || 18;
      var px = fs * 0.24, py = fs * 0.08, r = fs * 0.22;
      var x = b.x - px, y = b.y - py, w = b.width + 2 * px, h = b.height + 2 * py;
      g.appendChild(plateRect('lbl-plate lbl-plate--sea', x, y, w, h, r));
      clips.forEach(function (c) {
        var bb = c.bb;
        if (bb && (bb.x > x + w || bb.x + bb.width < x || bb.y > y + h || bb.y + bb.height < y)) return;
        var rc = plateRect('lbl-plate lbl-plate--land' + (c.existing ? ' lbl-plate--existing' : ''), x - 2, y - 2, w + 4, h + 4, r);
        rc.setAttribute('data-prov', c.prov);
        rc.setAttribute('clip-path', 'url(#' + c.clip + ')');
        g.appendChild(rc);
      });
      t.style.strokeWidth = '0';
    });
    /* the plates are new parts of each province: bring them to its state */
    return true;
  }

  function layoutLabels(inst) {
    if (!inst.svg || inst.svg.classList.contains('za-network--mini')) return;
    if (inst.el.hasAttribute('data-nq-map-plates')) {
      labelPlates(inst.svg);
      paint(inst);
      if (inst.hl) inst.highlight(inst.hl);
    }
    routeLinks(inst.svg);
  }

  function partsOf(svg, id) { return svg.querySelectorAll('[data-prov="' + id + '"]'); }

  function setLit(svg, id, on, cls) {
    Array.prototype.forEach.call(partsOf(svg, id), function (el) { el.classList.toggle(cls || 'is-lit', !!on); });
  }

  /* ------------------------------------------------------------ plumbing -- */
  function mk(name, attrs, parent) {
    var e = doc.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  function nodeXY(svg, id) {
    var c = id === 'national' ? svg.querySelector('.hub .hub-core') : svg.querySelector('circle.node[data-prov="' + id + '"]');
    if (!c) return null;
    return { x: parseFloat(c.getAttribute('cx')), y: parseFloat(c.getAttribute('cy')) };
  }

  /* a padlock drawn in screen pixels (scaled by --map-k): body 11 x 8.5 */
  function padlock(parent, cls, xy, size) {
    var g = mk('g', { 'class': cls }, parent);
    var glyph = mk('g', { 'class': 'plumb-glyph' }, g);
    var shackle = mk('path', { 'class': 'plumb-shackle', d: 'M-3.1 -0.8V-4.4A3.1 3.1 0 0 1 3.1 -4.4V-0.8' }, glyph);
    mk('rect', { 'class': 'plumb-body', x: -5, y: -0.8, width: 10, height: 7.6, rx: 1.4 }, glyph);
    mk('circle', { 'class': 'plumb-key', cx: 0, cy: 2.9, r: 1.15 }, glyph);
    return { g: g, shackle: shackle, x: xy.x, y: xy.y, size: size };
  }

  function ensurePlumb(inst) {
    if (inst.plumb || !inst.svg) return inst.plumb;
    var svg = inst.svg;
    var dst = nodeXY(svg, 'ZA-WC');
    if (!dst) return null;
    var nodeEl = svg.querySelector('circle.node');
    var nodesG = nodeEl ? nodeEl.parentNode : null;
    if (nodesG && nodesG.classList && nodesG.classList.contains('hub')) nodesG = nodesG.parentNode;
    var mini = svg.classList.contains('za-network--mini');
    var unit = mini ? 0.62 : 1;

    var lines = mk('g', { 'class': 'plumb plumb--lines', 'aria-hidden': 'true' });
    var marks = mk('g', { 'class': 'plumb plumb--marks', 'aria-hidden': 'true' });
    if (nodesG && nodesG.parentNode === svg) {
      svg.insertBefore(lines, nodesG);
      svg.insertBefore(marks, nodesG.nextSibling);
    } else {
      svg.appendChild(lines);
      svg.appendChild(marks);
    }

    var P = { lines: [], vaults: [], marks: [], nodes: {}, line: 1, lock: 0, layerLines: lines, layerMarks: marks, token: null, opt: null };
    SOURCES.forEach(function (id) { P.nodes[id] = svg.querySelector('circle.node[data-prov="' + id + '"]'); });
    SOURCES.forEach(function (id) {
      var s = nodeXY(svg, id);
      if (!s) return;
      var dx = dst.x - s.x, dy = dst.y - s.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var bow = Math.min(0.16 * len, 120);
      /* every line bows to the left of its own travel, so the nine read as
         streams draining into the Cape rather than a fan of spokes */
      var cx = (s.x + dst.x) / 2 - (dy / len) * bow;
      var cy = (s.y + dst.y) / 2 + (dx / len) * bow;
      var path = mk('path', {
        'class': 'plumb-line', 'data-prov': id, pathLength: '1',
        d: 'M' + s.x + ' ' + s.y + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + dst.x + ' ' + dst.y
      }, lines);
      P.lines.push(path);
      var v = padlock(marks, 'plumb-vault', s, 17 * unit);
      v.g.setAttribute('data-prov', id);
      P.vaults.push(v);
    });
    var store = mk('g', { 'class': 'plumb-store' }, marks);
    var storeGlyph = mk('g', { 'class': 'plumb-glyph' }, store);
    [5, 0, -5].forEach(function (y) { mk('ellipse', { cx: 0, cy: y, rx: 7, ry: 2.7 }, storeGlyph); });
    P.store = { g: store, x: dst.x, y: dst.y, size: 21 * unit };
    P.wc = padlock(marks, 'plumb-vault plumb-vault--existing', dst, 17 * unit);
    P.marks = P.vaults.concat([P.store, P.wc]);
    inst.plumb = P;
    placeMarks(inst);
    return P;
  }

  function placeMarks(inst) {
    var P = inst.plumb;
    if (!P) return;
    var k = inst.k || 1;
    P.marks.forEach(function (m) {
      m.g.setAttribute('transform', 'translate(' + m.x + ' ' + m.y + ') scale(' + (k * m.size / 14).toFixed(4) + ')');
    });
  }

  function plumbWindow(inst) {
    var raw = (inst.el.getAttribute('data-nq-plumb') || '').trim().split(/\s+/).map(parseFloat);
    var a = isNaN(raw[0]) ? 0 : raw[0];
    var b = isNaN(raw[1]) ? a + 0.2 : raw[1];
    return { a: a, b: Math.max(b, a + 0.01) };
  }

  function paintPlumb(inst) {
    var P = inst.plumb;
    if (!P) return;
    var data = inst.mode === 'data-A' || inst.mode === 'data-B';
    P.layerLines.style.display = data ? '' : 'none';
    P.layerMarks.style.display = data ? '' : 'none';
    if (!data) {
      Object.keys(P.nodes).forEach(function (id) { if (P.nodes[id]) P.nodes[id].classList.remove('is-dim'); });
      return;
    }
    var reduce = reduceMQ.matches;
    var follows = inst.el.getAttribute('data-nq-map-progress') === 'act';
    var w = plumbWindow(inst);
    var gate = follows ? clamp01((inst.progress - w.a) / (w.b - w.a)) : 1;
    var shown = follows ? (inst.progress >= w.a ? 1 : 0) : 1;
    var n = P.lines.length;
    var lockNow = shown * P.lock;
    P.lines.forEach(function (ln, i) {
      var d = reduce ? shown : clamp01((gate - (i / n) * 0.5) / 0.5);
      d = Math.min(d, P.line);
      ln.style.strokeDashoffset = (1 - d).toFixed(4);
      ln.style.opacity = d > 0.002 ? '1' : '0';
      var id = ln.getAttribute('data-prov');
      if (id !== 'national' && P.nodes[id]) P.nodes[id].classList.toggle('is-dim', d < 0.02 && lockNow < 0.02);
    });
    var storeOn = (reduce ? shown : clamp01(gate * 5)) * P.line;
    P.store.g.style.opacity = storeOn.toFixed(3);
    var lock = lockNow;
    P.vaults.forEach(function (v) {
      v.g.style.opacity = lock.toFixed(3);
      v.shackle.setAttribute('transform', 'translate(0 ' + (-2.6 * (1 - lock)).toFixed(2) + ')');
    });
    inst.svg.setAttribute('data-plumb', P.line > 0.5 ? 'pooled' : 'locked');
  }

  /* the switch: the outgoing state leaves (300 ms), then the incoming one
     arrives (600 ms); --nq-d-replumb in the design system */
  function plumbTo(inst, opt) {
    var P = ensurePlumb(inst);
    if (!P) return;
    if (P.opt === opt) return;
    var first = P.opt === null;
    P.opt = opt;
    var target = opt === 'B' ? { line: 0, lock: 1 } : { line: 1, lock: 0 };
    if (first || reduceMQ.matches || doc.hidden) {
      P.token = null;
      P.line = target.line;
      P.lock = target.lock;
      paintPlumb(inst);
      return;
    }
    var from = { line: P.line, lock: P.lock };
    var token = {};
    P.token = token;
    var t0 = null;
    function step(now) {
      if (P.token !== token) return;
      if (t0 === null) t0 = now;
      var t = now - t0;
      var out = easeOut(clamp01(t / 300));
      var inn = easeOut(clamp01((t - 300) / 600));
      if (opt === 'B') {
        P.line = from.line * (1 - out);
        P.lock = from.lock + (1 - from.lock) * inn;
      } else {
        P.lock = from.lock * (1 - out);
        P.line = from.line + (1 - from.line) * inn;
      }
      paintPlumb(inst);
      if (t < 900) root.requestAnimationFrame(step);
      else { P.line = target.line; P.lock = target.lock; paintPlumb(inst); }
    }
    root.requestAnimationFrame(step);
  }

  function paint(inst) {
    var svg = inst.svg;
    if (!svg) return;
    var p = inst.progress;
    var m = inst.mode;
    svg.style.setProperty('--map-p', p.toFixed(4));
    var lit = {};
    var outline = {};
    ORDER.forEach(function (id) { lit[id] = false; outline[id] = false; });
    lit['ZA-WC'] = true; /* retained: lit from the first frame */
    if (m === 'lit') {
      lit.national = p >= 0.02;
      NEW_SITES.forEach(function (id, i) { lit[id] = p >= 0.12 + i * (0.72 / NEW_SITES.length); });
    } else if (m === 'timeline') {
      lit.national = p >= 0.06;
      NEW_SITES.forEach(function (id) { outline[id] = p >= 0.3; lit[id] = p >= 0.62; });
    } else {
      ORDER.forEach(function (id) { lit[id] = true; });
    }
    ORDER.forEach(function (id) {
      setLit(svg, id, lit[id], 'is-lit');
      setLit(svg, id, outline[id] && !lit[id], 'is-outline');
    });
    svg.setAttribute('data-lit', String(ORDER.filter(function (id) { return lit[id]; }).length));
    if (inst.plumb) paintPlumb(inst);
  }

  function Instance(el, opts) {
    this.el = el;
    this.name = el.getAttribute('data-nq-map') || ('map' + (seq + 1));
    this.opts = opts || {};
    this.svg = null;
    this.k = 1;
    this.plumb = null;
    this.mode = el.getAttribute('data-nq-map-mode') || 'lit';
    this.progress = this.opts.progress != null ? this.opts.progress : (el.getAttribute('data-nq-map-progress') === 'act' ? 0 : 1);
    this.hl = null;
  }
  Instance.prototype.setMode = function (name) {
    if (MODES.indexOf(name) < 0) throw new Error('network-map: unknown mode "' + name + '"');
    this.mode = name;
    this.el.setAttribute('data-nq-map-mode', name);
    if (this.svg) {
      var svg = this.svg;
      MODES.forEach(function (mm) { svg.classList.remove('mode-' + mm); });
      svg.classList.add('mode-' + name);
      svg.setAttribute('data-mode', name);
      if (name === 'data-A' || name === 'data-B') plumbTo(this, name.slice(5));
      paint(this);
    }
    return this;
  };
  Instance.prototype.setProgress = function (p) {
    p = Math.max(0, Math.min(1, Number(p) || 0));
    if (Math.abs(p - this.progress) < 0.0005 && this.svg && this.svg.getAttribute('data-lit') !== null) return this;
    this.progress = p;
    paint(this);
    return this;
  };
  Instance.prototype.highlight = function (id) {
    var svg = this.svg;
    this.hl = id || null;
    if (!svg) return this;
    Array.prototype.forEach.call(svg.querySelectorAll('.is-hl'), function (el) { el.classList.remove('is-hl'); });
    svg.classList.toggle('has-hl', !!id);
    if (id) Array.prototype.forEach.call(partsOf(svg, id), function (el) { el.classList.add('is-hl'); });
    return this;
  };

  function mount(inst, text) {
    var parsed = new root.DOMParser().parseFromString(text, 'image/svg+xml');
    var src = parsed.documentElement;
    if (!src || src.nodeName.toLowerCase() !== 'svg') throw new Error('network-map: not an svg');
    var svg = doc.importNode(src, true);
    seq += 1;
    takeStyle(svg);
    normaliseProto(svg);
    Array.prototype.forEach.call(svg.querySelectorAll('path.prov[id]'), function (pv) {
      var code = pv.getAttribute('id');
      if (!pv.hasAttribute('data-prov') && ORDER.indexOf(code) > -1) pv.setAttribute('data-prov', code);
    });
    prefixIds(svg, 'm' + seq + '-');
    haloLabels(svg);
    svg.classList.add('za-network', 'nq-map__svg');
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('focusable', 'false');
    if (inst.opts.decorative || inst.el.getAttribute('data-nq-map') === 'mini') {
      svg.setAttribute('aria-hidden', 'true');
      svg.removeAttribute('role');
      svg.classList.add('za-network--mini');
    } else {
      var label = inst.el.getAttribute('data-nq-map-label');
      svg.setAttribute('role', 'img');
      if (label) { svg.removeAttribute('aria-labelledby'); svg.setAttribute('aria-label', label); }
    }
    inst.el.appendChild(svg);
    inst.svg = svg;
    inst.el.classList.add('is-ready');
    measure(inst, inst.el.clientWidth);
    inst.setMode(inst.mode);
    if (inst.hl) inst.highlight(inst.hl);
    observeDensity(inst);
    return inst;
  }

  /* --map-k, the label set and the plumbing marks follow the rendered width */
  function measure(inst, width) {
    if (!inst.svg || !width) return;
    var vb = inst.svg.viewBox && inst.svg.viewBox.baseVal;
    var vbw = vb && vb.width ? vb.width : 1024;
    inst.k = vbw / width;
    inst.svg.style.setProperty('--map-k', inst.k.toFixed(4));
    inst.svg.setAttribute('data-density', width >= 640 ? 'wide' : 'narrow');
    inst.svg.setAttribute('data-scale', width >= 440 ? 'large' : 'small');
    if (inst.plumb) placeMarks(inst);
    /* the label set or its size may have changed: plates and routes again */
    if (!inst.svg.classList.contains('za-network--mini')) {
      clearTimeout(inst.__route);
      inst.__route = setTimeout(function () { layoutLabels(inst); }, 30);
    }
  }

  var ro = root.ResizeObserver ? new root.ResizeObserver(function (entries) {
    entries.forEach(function (e) {
      var inst = e.target.__nqMap;
      if (inst && inst.svg) measure(inst, e.contentRect.width);
    });
  }) : null;
  function observeDensity(inst) {
    inst.el.__nqMap = inst;
    if (ro) ro.observe(inst.el);
    else measure(inst, inst.el.clientWidth);
  }

  function create(el, opts) {
    var inst = new Instance(el, opts);
    var url = (opts && opts.src) || el.getAttribute('data-nq-map-src');
    byName[inst.name] = inst;
    list.push(inst);
    inst.ready = (url ? fetchText(url) : Promise.reject(new Error('network-map: no source')))
      .then(function (text) { return mount(inst, text); })
      .catch(function (err) {
        var fb = el.getAttribute('data-nq-map-fallback');
        if (fb && fb !== url) return fetchText(fb).then(function (t) { return mount(inst, t); });
        el.classList.add('is-failed');
        if (root.console) root.console.warn('[network-map]', err && err.message ? err.message : err);
        return inst;
      });
    return inst;
  }

  /* progress from the act: the engine writes --sc-p on every act element */
  var ticking = false;
  function follow() {
    ticking = false;
    list.forEach(function (inst) {
      if (inst.el.getAttribute('data-nq-map-progress') !== 'act') return;
      var act = inst.__act || (inst.__act = inst.el.closest('[data-sc-act]'));
      if (!act) return;
      var p = parseFloat(act.style.getPropertyValue('--sc-p'));
      if (!isNaN(p)) inst.setProgress(p);
    });
  }
  function onScroll() { if (!ticking) { ticking = true; root.requestAnimationFrame(follow); } }

  NQ.networkMap = {
    MODES: MODES,
    ORDER: ORDER,
    NAMES: NAMES,
    create: create,
    get: function (name) { return byName[name] || null; },
    all: function () { return list.slice(); },
    setMode: function (name) { list.forEach(function (i) { i.setMode(name); }); },
    setProgress: function (p) { list.forEach(function (i) { i.setProgress(p); }); },
    highlight: function (id) { list.forEach(function (i) { i.highlight(id); }); },
    applyAria: function (fmt, d) {
      list.forEach(function (inst) {
        var key = inst.el.getAttribute('data-nq-map-aria');
        if (!key || !fmt[key]) return;
        inst.pendingAria = fmt[key](d);
        var apply = function () {
          if (!inst.svg) return;
          inst.svg.removeAttribute('aria-labelledby');
          inst.svg.setAttribute('aria-label', inst.pendingAria);
        };
        if (inst.svg) apply(); else inst.ready.then(apply);
      });
    },
    init: function () {
      Array.prototype.forEach.call(doc.querySelectorAll('[data-nq-map]'), function (el) {
        if (!el.__nqMap) create(el);
      });
      root.addEventListener('scroll', onScroll, { passive: true });
      root.addEventListener('resize', onScroll, { passive: true });
      onScroll();
      /* label boxes depend on the real faces: route again once they load */
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(function () {
          list.forEach(function (i) { i.ready.then(function () { layoutLabels(i); }); });
        });
      }
      return Promise.all(list.map(function (i) { return i.ready; }));
    },
    follow: follow
  };
})(self);
