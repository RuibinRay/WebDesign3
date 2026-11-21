/*
 * RACIMO: everything drawn in code. The mark, a plantain that ripens, the bunch, the four
 * chips, the four bags, the painted wheel and a sketch map. All of it reads js/data.js, so
 * the drawings, the pages and the prompts can never disagree about a colour or a day.
 *
 *   RC_ART.plantain()            one fruit; RC_ART.ripen(svg, t) recolours it, t = 0 (green) … 1 (black)
 *   RC_ART.racimo()              the hanging bunch; ripen() works on it too
 *   RC_ART.chip(id)  .bag(id)  .wheel(id)  .mark()  .map()
 *   RC_ART.poster(shot)          the stand-in drawn inside an image slot until its photo exists
 */
(function (root) {
  var D = root.RACIMO, C = D.color;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var hex = function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  var mix = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  var css = function (c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; };
  var ramp = function (stops, t) {
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
    }
    return stops[stops.length - 1][1];
  };
  /* Mixing in OKLab keeps the colour between two worlds as lively as the worlds themselves.
     A plain RGB mix of green and yellow passes through a dull olive. */
  var lin = function (c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  var gam = function (c) { return clamp(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055), 0, 255); };
  var oklab = function (c) {
    var r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  var unoklab = function (L) {
    var l = Math.pow(L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], 3);
    var m = Math.pow(L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], 3);
    var s = Math.pow(L[0] - 0.0894841775 * L[1] - 1.291485548 * L[2], 3);
    return [gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
  };
  var mixOk = function (a, b, k) {
    var A = oklab(a), B = oklab(b);
    return unoklab([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]);
  };
  var rng = function (seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  var uid = 0;
  var INK = hex(C.tinta), AMBAR = hex(C.ambar), WHITE = [255, 255, 255];

  /* the colour of the peel on each day: fruit fill (a touch lighter than the page behind it) */
  var PEEL = [
    [0, '#6FBE46'], [0.2, '#98C741'], [0.364, '#E0D548'], [0.55, '#F8D03F'], [0.727, '#FBC533'], [0.86, '#9A6520'], [1, '#120B07'],
  ].map(function (s) { return [s[0], hex(s[1])]; });
  /* the page behind it: the four worlds */
  var WORLD = D.chips.map(function (c) { return [c.t, hex(c.world)]; });
  var peelAt = function (t) { return ramp(PEEL, clamp(t, 0, 1)); };
  var worldAt = function (t) { return ramp(WORLD, clamp(t, 0, 1)); };

  /* ───────── one plantain (stem left, tip right), in a 620 × 230 box ───────── */
  var P = {
    body: 'M96 124C112 94 152 76 212 67C300 54 402 56 470 74C506 84 530 96 544 110C548 116 548 121 544 126C520 138 470 137 330 131C230 127 150 140 104 158C92 152 88 138 96 124Z',
    under: 'M104 158C150 140 230 127 330 131C470 137 520 138 544 126L543 119C516 126 466 120 330 113C236 109 150 122 95 141Z',
    hi: 'M168 87C230 71 300 64 372 67C300 70 232 79 170 93Z',
    ridge: 'M99 120C150 93 240 81 330 80C420 79 500 91 541 111',
    stem: 'M99 121L62 131C51 135 46 147 52 156L66 160C70 152 78 150 105 157C94 150 90 136 99 121Z',
    tip: 'M539 107L565 105C572 108 573 118 568 122L544 127C548 121 548 116 539 107Z',
  };
  function spots(seed, n, big) {
    var r = rng(seed), out = '';
    for (var i = 0; i < n; i++) {
      var x = 110 + r() * 424, k = (x - 330) / 215;
      var top = 60 + k * k * 50, bot = 134;
      var y = top + 6 + r() * (bot - top - 8);
      var rx = (big ? 5 : 2.2) + r() * (big ? 12 : 5), ry = rx * (0.45 + r() * 0.35);
      out += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) +
        '" transform="rotate(' + (r() * 40 - 28).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    }
    return out;
  }
  function fruit(clip, seed, off, transform) {
    return '<g class="fr" data-off="' + off + '"' + (transform ? ' transform="' + transform + '"' : '') + '>' +
      '<path class="fr-stem" d="' + P.stem + '"/><path class="fr-tip" d="' + P.tip + '"/>' +
      '<path class="fr-body" d="' + P.body + '"/>' +
      '<g clip-path="url(#' + clip + ')">' +
      '<rect x="80" y="40" width="170" height="130" fill="url(#' + clip + 'L)"/><rect x="400" y="40" width="160" height="130" fill="url(#' + clip + 'R)"/>' +
      '<path class="fr-under" d="' + P.under + '"/>' +
      '<g class="fr-s1">' + spots(seed, 16, false) + '</g>' +
      '<g class="fr-s2">' + spots(seed + 7, 22, false) + spots(seed + 9, 3, true) + '</g>' +
      '<g class="fr-s3">' + spots(seed + 13, 16, true) + '</g>' +
      '<path class="fr-hi" d="' + P.hi + '"/></g>' +
      '<path class="fr-ridge" d="' + P.ridge + '" fill="none" stroke-linecap="round" stroke-width="2.5"/>' +
      '<path class="fr-line" d="' + P.body + '" fill="none" stroke-width="4" stroke-linejoin="round"/>' +
      '<path class="fr-line" d="' + P.stem + '" fill="none" stroke-width="4" stroke-linejoin="round"/>' +
      '<path class="fr-line" d="' + P.tip + '" fill="none" stroke-width="4" stroke-linejoin="round"/></g>';
  }
  /* shared by every fruit in one svg: the clip, and the two ends that stay green a few days longer */
  function defs(id) {
    var stops = '<stop class="fr-gc" offset="0"/><stop class="fr-gc" offset="1" stop-opacity="0"/>';
    return '<defs><clipPath id="' + id + '"><path d="' + P.body + '"/></clipPath>' +
      '<linearGradient id="' + id + 'L" gradientUnits="userSpaceOnUse" x1="100" x2="236" y1="0" y2="0">' + stops + '</linearGradient>' +
      '<linearGradient id="' + id + 'R" gradientUnits="userSpaceOnUse" x1="544" x2="424" y1="0" y2="0">' + stops + '</linearGradient></defs>';
  }
  function plantain(o) {
    o = o || {};
    var id = 'rc-clip-' + (++uid);
    return '<svg class="fruit ' + (o.className || '') + '" viewBox="20 20 580 180" aria-hidden="true" focusable="false">' +
      defs(id) + fruit(id, o.seed || 11, 0) + '</svg>';
  }
  /* the bunch: five fruit hanging from one stalk */
  function racimo(o) {
    o = o || {};
    var id = 'rc-clip-' + (++uid), cx = 350, cy = 150;
    /* [angle, mirrored, ripens this much later, seed, scale]: a back row of three, then a front row of four */
    var hang = [
      [113, true, 0.05, 81, 0.76], [90, false, 0.09, 92, 0.78], [67, false, 0.04, 99, 0.76],
      [126, true, 0.07, 21, 0.86], [54, false, 0.02, 34, 0.86], [101, true, 0.0, 47, 0.9], [79, false, 0.05, 58, 0.9],
    ];
    var g = hang.map(function (h) {
      return fruit(id, h[3], h[2], 'translate(' + cx + ' ' + cy + ') rotate(' + h[0] + ') scale(' + h[4] + ' ' + (h[1] ? -h[4] : h[4]) + ') translate(-56 -146)');
    }).join('');
    return '<svg class="racimo ' + (o.className || '') + '" viewBox="20 -40 660 680" aria-hidden="true" focusable="false">' +
      defs(id) +
      '<path class="rc-stalk" d="M350 -60V140" fill="none" stroke-width="30" stroke-linecap="round"/>' +
      '<path class="rc-stalk-line" d="M335 -60V128M365 -60V128" fill="none" stroke-width="4"/>' + g +
      '<ellipse class="rc-crown" cx="350" cy="152" rx="40" ry="26"/></svg>';
  }
  /* recolour a drawn plantain or bunch for ripeness t */
  function ripen(svg, t) {
    if (!svg) return;
    var set = function (el, a, v) { if (el) el.setAttribute(a, v); };
    var q = function (el, s) { return el.querySelector(s); };
    Array.prototype.forEach.call(svg.querySelectorAll('.fr'), function (g) {
      var f = clamp(t * 1.06 - parseFloat(g.getAttribute('data-off') || 0), 0, 1);
      var body = peelAt(f), late = smooth(0.88, 0.98, f);
      var line = css(mix(INK, AMBAR, late));
      set(q(g, '.fr-body'), 'fill', css(body));
      set(q(g, '.fr-under'), 'fill', css(mix(body, INK, 0.2)));
      set(q(g, '.fr-hi'), 'fill', css(mix(mix(body, WHITE, 0.55), AMBAR, late)));
      set(q(g, '.fr-hi'), 'opacity', (0.6 - late * 0.15).toFixed(2));
      set(q(g, '.fr-stem'), 'fill', css(mix(peelAt(Math.max(0, f - 0.22)), hex(C.cascara), 0.3 + f * 0.3)));
      set(q(g, '.fr-tip'), 'fill', css(mix(hex(C.cascara), INK, 0.4)));
      var sp = css(mix(hex(C.cascara), INK, smooth(0.6, 0.95, f) * 0.7));
      [['.fr-s1', 0.40, 0.56], ['.fr-s2', 0.54, 0.74], ['.fr-s3', 0.75, 0.9]].forEach(function (s) {
        var el = q(g, s[0]);
        set(el, 'fill', sp);
        set(el, 'opacity', smooth(s[1], s[2], f).toFixed(3));
      });
      set(q(g, '.fr-ridge'), 'stroke', line);
      set(q(g, '.fr-ridge'), 'opacity', '0.3');
      Array.prototype.forEach.call(g.querySelectorAll('.fr-line'), function (l) { set(l, 'stroke', line); });
    });
    var ends = css(peelAt(Math.max(0, t - 0.25 * (1 - smooth(0.55, 0.85, t)))));
    Array.prototype.forEach.call(svg.querySelectorAll('.fr-gc'), function (s) { s.setAttribute('stop-color', ends); });
    var stalk = css(mix(mix(hex('#7C8A35'), hex(C.cascara), smooth(0.2, 0.9, t)), INK, smooth(0.8, 1, t) * 0.5));
    var edge = css(mix(INK, AMBAR, smooth(0.9, 0.98, t)));
    set(q(svg, '.rc-stalk'), 'stroke', stalk);
    set(q(svg, '.rc-crown'), 'fill', stalk);
    set(q(svg, '.rc-crown'), 'stroke', edge);
    set(q(svg, '.rc-crown'), 'stroke-width', '4');
    set(q(svg, '.rc-stalk-line'), 'stroke', edge);
    set(q(svg, '.rc-stalk-line'), 'opacity', '0.5');
  }

  /* ───────── the four chips ───────── */
  var RIBBON = 'M-46-6C-30-16-10-14 6-12C22-10 38-16 46-8C50 0 46 10 38 12C20 16 4 10-12 12C-26 14-40 16-46 8C-50 2-50-2-46-6Z';
  function chipShape(id) {
    return { verde: [46, 13], pinton: [41, 27], maduro: [39, 31], miel: [35, 35] }[id];
  }
  function chip(id, o) {
    o = o || {};
    var c = D.byId[id], k = c.chip, s = chipShape(id), r = rng((o.seed || 1) * 97 + c.index * 13), g = '';
    var line = id === 'miel' ? C.ambar : C.tinta;
    if (id === 'verde') {
      g += '<path d="' + RIBBON + '" fill="' + k.edge + '"/><path d="' + RIBBON + '" fill="' + k.flesh + '" transform="scale(.9 .74)"/>' +
        '<path d="M-36 0C-18-4 0 2 16-1S34-3 38 0" fill="none" stroke="' + k.core + '" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round"/>' +
        '<path d="M-38-7C-22-12-6-11 8-9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="' + RIBBON + '" fill="none" stroke="' + line + '" stroke-width="2.4" stroke-linejoin="round"/>';
    } else {
      g += '<ellipse rx="' + s[0] + '" ry="' + s[1] + '" fill="' + k.edge + '"/>' +
        '<ellipse rx="' + (s[0] - (id === 'pinton' ? 3.5 : 6)) + '" ry="' + (s[1] - (id === 'pinton' ? 3.5 : 6)) + '" fill="' + k.flesh + '"/>';
      /* the three-part core every plantain slice shows */
      for (var i = 0; i < 3; i++) {
        g += '<g transform="rotate(' + (i * 120 - 90) + ') scale(' + (s[0] / 40).toFixed(2) + ' ' + (s[1] / 40).toFixed(2) + ')">' +
          '<path d="M0 0C6-6 10-13 0-20C-10-13-6-6 0 0Z" fill="' + k.core + '" opacity=".55"/>' +
          '<circle cx="-3.4" cy="-11" r="1.2" fill="' + k.edge + '"/><circle cx="3.4" cy="-11" r="1.2" fill="' + k.edge + '"/><circle cy="-15.5" r="1.1" fill="' + k.edge + '"/></g>';
      }
      g += '<path d="M' + (-s[0] + 9) + ' ' + (-s[1] * 0.35).toFixed(1) + 'A' + (s[0] - 8) + ' ' + (s[1] - 8) + ' 0 0 1 ' + (-s[0] * 0.2).toFixed(1) + ' ' + (-s[1] + 7) +
        '" fill="none" stroke="#fff" stroke-opacity="' + (id === 'miel' ? 0.3 : 0.45) + '" stroke-width="2.6" stroke-linecap="round"/>' +
        '<ellipse rx="' + s[0] + '" ry="' + s[1] + '" fill="none" stroke="' + line + '" stroke-width="2.4"/>';
    }
    /* what is on it: salt, and on Pintón lime and chile, on Miel cacao */
    var bits = { verde: [[9, '#fff']], pinton: [[5, '#fff'], [6, C.achiote], [5, '#6FA63A']], maduro: [[7, '#fff']], miel: [[6, '#fff'], [9, '#2A150A']] }[id];
    bits.forEach(function (b) {
      for (var j = 0; j < b[0]; j++) {
        var a = r() * 6.283, d = Math.sqrt(r()) * (id === 'verde' ? 0.55 : 0.78);
        g += '<rect x="' + (Math.cos(a) * d * s[0] - 1).toFixed(1) + '" y="' + (Math.sin(a) * d * s[1] - 1).toFixed(1) +
          '" width="2.2" height="2.2" rx=".5" fill="' + b[1] + '" transform="rotate(' + (r() * 90).toFixed(0) + ')" opacity=".9"/>';
      }
    });
    return '<svg class="chip chip--' + id + ' ' + (o.className || '') + '" viewBox="-52 -52 104 104" aria-hidden="true" focusable="false">' +
      '<g transform="rotate(' + (o.rot || 0) + ')">' + g + '</g></svg>';
  }

  /* ───────── the painted wheel: the round chip and the oxcart wheel are the same drawing ───────── */
  function wheelParts(o) {
    var g = '<circle r="96" fill="' + o.rim + '"/><circle r="87" fill="' + o.band + '"/>';
    for (var i = 0; i < 16; i++) {
      g += '<path d="M-10.5 -84.5L10.5 -84.5L0 -60Z" fill="' + (i % 2 ? o.a : o.b) + '" transform="rotate(' + i * 22.5 + ')"/>';
    }
    g += '<circle r="57" fill="' + o.rim + '"/><circle r="52" fill="' + o.petalBg + '"/>';
    for (var j = 0; j < 8; j++) {
      g += '<path d="M0 -15C12 -27 10 -42 0 -50C-10 -42 -12 -27 0 -15Z" fill="' + o.petal + '" stroke="' + o.rim + '" stroke-width="1.6" transform="rotate(' + j * 45 + ')"/>';
    }
    return g + '<circle r="13" fill="' + o.hub + '" stroke="' + o.rim + '" stroke-width="2"/><circle r="4" fill="' + o.band + '"/>';
  }
  function wheelColors(id) {
    var c = D.byId[id] || D.chips[0], dark = c.fg === 'paper';
    return { rim: dark ? C.ambar : C.tinta, band: C.papel, a: C.achiote, b: dark ? C.miel : c.world, petalBg: c.chip.flesh, petal: c.chip.edge, hub: C.achiote };
  }
  function wheel(id, o) {
    o = o || {};
    return '<svg class="wheel ' + (o.className || '') + '" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' + wheelParts(o.colors || wheelColors(id)) + '</svg>';
  }

  /* ───────── the bag. The front is also the reference image for every photo of the pack, and both
     sides, drawn full-bleed, are the label wrapped round the 3D bag (js/src/bag3d.src.js). ─────────
       bag(id)                      the drawn bag, front
       bag(id, { standalone })      the same as a file: the reference image (refs.html)
       bag(id, { flat })            the front as flat artwork, no bag shape: the 3D texture
       bagBack(id, { flat })        the back
       bag3d(id, mode)              a host element: the drawn bag now, the real-time 3D bag once js/bag3d.js is in */
  var FONT = "'Bricolage Grotesque', 'Arial Narrow', Arial, sans-serif", MONO = "'DM Mono', ui-monospace, Consolas, monospace";
  var LABEL = { x: 20, y: 23, w: 260, h: 354, px: 1040 }; /* the part of the 300 × 400 drawing that is the bag itself */
  var amp = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  function bagOpen(id, o) {
    return '<svg class="bag bag--' + id + ' ' + (o.className || '') + '" ' +
      (o.flat ? 'xmlns="http://www.w3.org/2000/svg" viewBox="' + [LABEL.x, LABEL.y, LABEL.w, LABEL.h].join(' ') + '" width="' + LABEL.px + '" height="' + Math.round(LABEL.px * LABEL.h / LABEL.w) + '"'
        : 'viewBox="0 0 300 400" ' + (o.standalone ? 'xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"' : 'aria-hidden="true" focusable="false"')) + '>' +
      (o.style ? '<defs><style>' + o.style + '</style></defs>' : '') +
      (o.backdrop ? '<rect width="300" height="400" fill="' + o.backdrop + '"/>' : '');
  }
  function bagBody(c, fg, o) {
    var crimp = '';
    for (var x = 30; x <= 270; x += 6) crimp += 'M' + x + ' 27V43M' + x + ' 357V373';
    return (o.flat
      ? '<rect width="300" height="400" fill="' + c.world + '"/>'
      : '<path d="M22 26C60 21 240 21 278 26C286 120 289 280 280 374C240 380 60 380 20 374C11 280 14 120 22 26Z" fill="' + c.world + '" stroke="' + (c.fg === 'paper' ? C.ambar : C.tinta) + '" stroke-width="3" stroke-linejoin="round"/>') +
      '<path d="' + crimp + '" stroke="' + fg + '" stroke-opacity=".28" stroke-width="1.4"/>' +
      '<path d="' + (o.flat ? 'M20 46H280M20 354H280' : 'M22 46H278M20 354H280') + '" stroke="' + fg + '" stroke-opacity=".3" stroke-width="1.2"/>' +
      (o.flat ? '' :
        '<path d="M36 64C30 150 30 260 37 340" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M266 64C272 150 272 260 264 340" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="9" stroke-linecap="round"/>');
  }
  function stamp(c, x, y, r) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(-11) scale(' + (r / 27) + ')"><circle r="27" fill="' + C.achiote + '"/><circle r="23.5" fill="none" stroke="' + C.papel + '" stroke-width="1" stroke-dasharray="1.5 3"/>' +
      '<text y="-7" text-anchor="middle" font-family="' + MONO + '" font-size="7.5" letter-spacing="1.6" fill="' + C.papel + '">DÍA</text>' +
      '<text y="13" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="23" style="font-variation-settings:\'wdth\' 75" fill="' + C.papel + '">' + c.dayLabel + '</text></g>';
  }
  function bag(id, o) {
    o = o || {};
    var c = D.byId[id], fg = c.fg === 'paper' ? C.papel : C.tinta;
    return bagOpen(id, o) + bagBody(c, fg, o) +
      '<text x="150" y="72" text-anchor="middle" font-family="' + MONO + '" font-size="7.6" letter-spacing="1.5" fill="' + fg + '">PLANTAIN CHIPS · TALAMANCA · COSTA RICA</text>' +
      '<text x="150" y="121" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="52" letter-spacing="1" style="font-variation-settings:\'wdth\' 75,\'opsz\' 96" fill="' + fg + '">RACIMO</text>' +
      '<g transform="translate(150 203) scale(.69)">' + wheelParts(wheelColors(id)) + '</g>' +
      stamp(c, 239, 150, 27) +
      '<text x="150" y="318" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="48" letter-spacing="-.5" style="font-variation-settings:\'wdth\' 82,\'opsz\' 96" fill="' + fg + '">' + c.name + '</text>' +
      '<text x="150" y="337" text-anchor="middle" font-family="' + MONO + '" font-size="8.4" letter-spacing="1.6" fill="' + fg + '">' + amp((c.flavor + ' · ' + c.flavorEs).toUpperCase()) + '</text>' +
      '</svg>';
  }
  function wrap(text, max) {
    var lines = [''];
    String(text).split(/\s+/).forEach(function (w) {
      var l = lines[lines.length - 1];
      if (l && (l + ' ' + w).length > max) lines.push(w); else lines[lines.length - 1] = l ? l + ' ' + w : w;
    });
    return lines;
  }
  function bagBack(id, o) {
    o = o || {};
    var c = D.byId[id], fg = c.fg === 'paper' ? C.papel : C.tinta, n = c.nutrition;
    var rows = [['Energy', n.kcal + ' kcal'], ['Fat', n.fat], ['Carbohydrate', n.carbs], ['of which sugars', n.sugars], ['Fibre', n.fibre], ['Protein', n.protein], ['Sodium', n.sodium]];
    var tspans = function (lines, x, dy) { return lines.map(function (l, i) { return '<tspan x="' + x + '" dy="' + (i ? dy : 0) + '">' + amp(l) + '</tspan>'; }).join(''); };
    var table = rows.map(function (r, i) {
      var y = 175 + i * 14.6;
      return '<text x="52" y="' + y + '" font-family="' + FONT + '" font-size="8.6" fill="' + C.tinta + '">' + r[0] + '</text>' +
        '<text x="248" y="' + y + '" text-anchor="end" font-family="' + FONT + '" font-weight="700" font-size="8.6" fill="' + C.tinta + '">' + r[1] + '</text>' +
        (i < rows.length - 1 ? '<path d="M52 ' + (y + 4.6) + 'H248" stroke="' + C.tinta + '" stroke-opacity=".25" stroke-width=".8"/>' : '');
    }).join('');
    return bagOpen(id, o) + bagBody(c, fg, o) +
      '<text x="42" y="80" font-family="' + FONT + '" font-weight="800" font-size="27" letter-spacing=".6" style="font-variation-settings:\'wdth\' 75" fill="' + fg + '">RACIMO</text>' +
      stamp(c, 236, 76, 19) +
      '<text x="42" y="97" font-family="' + MONO + '" font-size="7.2" letter-spacing="1.3" fill="' + fg + '">' + amp((c.name + ' · ' + c.flavor).toUpperCase()) + '</text>' +
      '<text y="116" font-family="' + FONT + '" font-weight="500" font-size="10.4" fill="' + fg + '">' + tspans(wrap(c.line, 42), 42, 12.4) + '</text>' +
      '<rect x="40" y="146" width="220" height="130" rx="7" fill="' + C.papel + '" stroke="' + C.tinta + '" stroke-width="1.6"/>' +
      '<text x="52" y="160.5" font-family="' + MONO + '" font-size="6.6" letter-spacing="1.2" fill="' + C.tinta + '">NUTRITION · PER 28 G</text>' + table +
      '<text x="42" y="294" font-family="' + MONO + '" font-size="6.6" letter-spacing="1.2" fill="' + fg + '">INGREDIENTS</text>' +
      '<text y="306" font-family="' + FONT + '" font-size="8.8" fill="' + fg + '">' + tspans(wrap(c.ingredients, 50), 42, 11) + '</text>' +
      '<text x="42" y="341" font-family="' + MONO + '" font-size="6.4" letter-spacing="1.2" fill="' + fg + '" fill-opacity=".8">85 G · HECHO EN COSTA RICA · CONCEPT VALUES</text>' +
      '</svg>';
  }
  function bag3d(id, mode, o) {
    o = o || {};
    var all = id === 'all';
    return '<span class="b3 b3--' + mode + ' ' + (o.className || '') + '" data-b3="' + id + '" data-b3-mode="' + mode + '">' +
      (all ? D.chips.map(function (c) { return bag(c.id); }).join('') : bag(id)) + '<canvas class="b3__c" aria-hidden="true"></canvas></span>';
  }

  /* the page's web fonts as inline CSS, so a drawing keeps its lettering when it is turned into an image */
  var fontJob = null;
  /* the local copy first (assets/fonts, which also works where only same-origin fetches are allowed,
     such as a published artifact), then Google Fonts as a fallback */
  function fontSheet() {
    var local = new URL('assets/fonts/fonts.css', location.href).href;
    return fetch(local).then(function (r) { if (!r.ok) throw new Error('no local fonts'); return r.text().then(function (t) { return { css: t, base: local }; }); })
      .catch(function () {
        var link = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
        if (!link) throw new Error('no fonts');
        return fetch(link.href).then(function (r) { return r.text().then(function (t) { return { css: t, base: link.href }; }); });
      });
  }
  function fontCss() {
    if (fontJob) return fontJob;
    fontJob = fontSheet().then(function (sheet) {
      var blocks = sheet.css.split('/*').slice(1).map(function (b) { var i = b.indexOf('*/'); return { name: b.slice(0, i).trim(), css: b.slice(i + 2) }; })
        .filter(function (b) { return b.name === 'latin'; });
      return Promise.all(blocks.map(function (b) {
        var url = (b.css.match(/url\(['"]?([^)'"]+)['"]?\)/) || [])[1];
        if (!url || url.indexOf('data:') === 0) return b.css;
        return fetch(new URL(url, sheet.base).href).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var bytes = new Uint8Array(buf), bin = '';
          for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
          return b.css.replace(url, 'data:font/woff2;base64,' + btoa(bin));
        });
      })).then(function (parts) { return parts.join('\n'); });
    }).catch(function () { return ''; });
    return fontJob;
  }
  /* an SVG → a canvas of w × h. make(css) returns the SVG string with the fonts inlined. */
  function raster(make, w, h) {
    return fontCss().then(function (cssText) {
      var url = URL.createObjectURL(new Blob([make(cssText)], { type: 'image/svg+xml' }));
      return new Promise(function (resolve, reject) {
        var im = new Image();
        im.onload = function () {
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          var g = cv.getContext('2d');
          /* drawn twice: the first pass makes the browser decode the inlined fonts */
          g.drawImage(im, 0, 0, w, h);
          setTimeout(function () {
            g.clearRect(0, 0, w, h);
            g.drawImage(im, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(cv);
          }, 60);
        };
        im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('could not draw the artwork')); };
        im.src = url;
      });
    });
  }

  /* ───────── the mark: a hand of four plantains, one per day ───────── */
  function mark(o) {
    o = o || {};
    var cols = o.color ? [C.verde, C.pinton, C.maduro, o.onDark ? C.ambar : C.miel] : ['currentColor', 'currentColor', 'currentColor', 'currentColor'];
    var d = ['M19 7C14 13 9 19 7 30', 'M20 7C18 15 16 23 15.5 33', 'M21 7C23 15 25 23 25.5 33', 'M22 7C27 13 32 19 34 30'];
    return '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20.5 2V8" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" fill="none"/>' +
      d.map(function (p, i) { return '<path d="' + p + '" stroke="' + cols[i] + '" stroke-width="5" stroke-linecap="round" fill="none"/>'; }).join('') + '</svg>';
  }

  /* ───────── a sketch map of Costa Rica. Drawn from rough coordinates: for looking at, not for navigating. ───────── */
  var COAST = [
    [-85.70, 11.07], [-85.62, 11.21], [-85.10, 11.02], [-84.90, 10.95], [-84.67, 11.07], [-84.35, 10.99], [-84.02, 10.78], [-83.92, 10.72], [-83.66, 10.93],
    [-83.58, 10.78], [-83.50, 10.52], [-83.30, 10.25], [-83.03, 10.00], [-82.90, 9.80], [-82.76, 9.66], [-82.56, 9.57],
    [-82.61, 9.49], [-82.86, 9.48], [-82.93, 9.47], [-82.94, 9.06], [-82.72, 8.93], [-82.87, 8.81], [-82.83, 8.48], [-82.90, 8.03],
    [-82.97, 8.25], [-83.13, 8.45], [-83.17, 8.62], [-83.33, 8.72], [-83.48, 8.70], [-83.33, 8.52], [-83.29, 8.38], [-83.57, 8.44], [-83.73, 8.60], [-83.64, 8.76], [-83.62, 8.95],
    [-83.86, 9.25], [-84.16, 9.43], [-84.63, 9.61], [-84.65, 9.80], [-84.83, 9.98], [-85.02, 10.18], [-85.12, 10.20], [-85.05, 10.02], [-84.93, 9.82], [-85.11, 9.57],
    [-85.33, 9.83], [-85.66, 9.93], [-85.84, 10.30], [-85.87, 10.36], [-85.70, 10.62], [-85.80, 10.83], [-85.95, 10.89],
  ];
  var px = function (p) { return [((p[0] + 86.2) * 100).toFixed(1), ((11.45 - p[1]) * 100).toFixed(1)]; };
  function map() {
    var d = COAST.map(function (p, i) { return (i ? 'L' : 'M') + px(p).join(' '); }).join('') + 'Z';
    var t = px(D.places.talamanca), s = px(D.places.sanjose), l = px(D.places.limon);
    return '<svg class="map" viewBox="0 0 400 360" role="img" aria-label="Sketch map of Costa Rica with Talamanca marked on the Caribbean side, by the Panama border.">' +
      '<path class="map__land" d="' + d + '"/>' +
      '<path class="map__road" d="M' + s.join(' ') + 'Q' + ((+s[0] + +l[0]) / 2) + ' ' + (+s[1] - 34) + ' ' + l.join(' ') + 'T' + t.join(' ') + '" fill="none"/>' +
      '<circle class="map__dot" cx="' + s[0] + '" cy="' + s[1] + '" r="4"/><text class="map__label" x="' + (+s[0] - 9) + '" y="' + (+s[1] + 4) + '" text-anchor="end">San José</text>' +
      '<circle class="map__dot" cx="' + l[0] + '" cy="' + l[1] + '" r="4"/><text class="map__label map__label--out" x="' + (+l[0] + 9) + '" y="' + (+l[1] - 6) + '">Limón</text>' +
      '<g class="map__pin" transform="translate(' + t.join(' ') + ')"><circle class="map__pulse" r="12"/><circle r="7"/></g>' +
      '<text class="map__label map__label--big" x="' + (+t[0] - 16) + '" y="' + (+t[1] + 30) + '" text-anchor="end">Talamanca</text>' +
      '<text class="map__sea" x="318" y="98">Mar Caribe</text><text class="map__sea" x="78" y="268">Océano Pacífico</text>' +
      '<text class="map__sea" x="206" y="20" text-anchor="middle">Nicaragua</text><text class="map__sea" x="372" y="252" text-anchor="middle">Panamá</text></svg>';
  }

  /* ───────── stand-ins for image slots ───────── */
  function scatter(id, n, seed, spread) {
    var r = rng(seed), out = '', ids = id === 'all' ? D.chips.map(function (c) { return c.id; }) : [id];
    for (var i = 0; i < n; i++) {
      var x = 50 + (r() - 0.5) * spread, y = 50 + (r() - 0.5) * spread, sz = 15 + r() * 13;
      out += '<span style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;width:' + sz.toFixed(1) + '%">' + chip(ids[i % ids.length], { seed: i + seed, rot: Math.round(r() * 180 - 90) }) + '</span>';
    }
    return out;
  }
  function poster(s) {
    var id = s.chip || 'verde', art = s.art;
    if (art === 'bag') return '<div class="art art--bag">' + bag3d(id, 'card') + '<div class="art__base">' + [3, 4, 5].map(function (n) { return chip(id, { seed: n, rot: n * 37 }); }).join('') + '</div></div>';
    if (art === 'pile') return '<div class="art art--pile">' + scatter(id, 16, 5 + D.byId[id].index, 96) + '</div>';
    if (art === 'box') return '<div class="art art--box">' + bag3d('all', 'row') + '</div>';
    if (art === 'fruit') return '<div class="art art--fruit" data-ripe="' + D.byId[id].t + '">' + plantain({ seed: 20 + D.byId[id].index }) + '</div>';
    if (art === 'racimo') return '<div class="art art--racimo" data-ripe="' + (s.ripe || 0) + '">' + racimo() + '</div>';
    if (art === 'pair') return '<div class="art art--pair">' + bag3d(id, 'pose') + '<div class="art__bowl">' + scatter(id, 7, 31, 70) + '</div></div>';
    return '<div class="art art--wheel">' + wheelLine() + '</div>';
  }
  /* the wheel as a line drawing: the stand-in for photographs of places and hands */
  function wheelLine() {
    var g = '<circle r="96"/><circle r="87"/><circle r="57"/><circle r="52"/><circle r="13"/><circle r="4"/>';
    for (var i = 0; i < 16; i++) g += '<path d="M-10.5 -84.5L0 -60L10.5 -84.5" transform="rotate(' + i * 22.5 + ')"/>';
    for (var j = 0; j < 8; j++) g += '<path d="M0 -15C12 -27 10 -42 0 -50C-10 -42 -12 -27 0 -15Z" transform="rotate(' + j * 45 + ')"/>';
    return '<svg class="wheel wheel--line" viewBox="-100 -100 200 200" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true" focusable="false">' + g + '</svg>';
  }
  /* colour any drawings that carry data-ripe */
  function paint(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-ripe]'), function (el) {
      ripen(el.querySelector('svg'), parseFloat(el.getAttribute('data-ripe')));
    });
  }

  root.RC_ART = {
    plantain: plantain, racimo: racimo, ripen: ripen, chip: chip, bag: bag, bagBack: bagBack, bag3d: bag3d, label: LABEL, raster: raster, fontCss: fontCss, wheel: wheel, mark: mark, map: map,
    poster: poster, paint: paint, scatter: scatter,
    peelAt: peelAt, worldAt: worldAt, css: css, mix: mix, mixOk: mixOk, hex: hex, smooth: smooth, clamp: clamp,
  };
})(window);
