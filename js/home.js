/*
 * RACIMO: the home page.
 *   1. The four days: one pinned screen where scrolling ripens a drawn plantain from day 1 to day 12.
 *      The page colour follows the peel, and each chip holds the stage on its own day.
 *   2. Sections built from js/data.js: the four cards, the steps, what to eat them with, the map.
 */
(function (root) {
  var D = root.RACIMO, ART = root.RC_ART, UI = root.RC_UI, MEDIA = root.RC_MEDIA;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = UI.esc, clamp = UI.clamp, smooth = UI.smooth;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var money = function (n) { return '$' + n.toFixed(2); };

  /* ───────── 1. the four days ───────── */
  function Seq(sec) {
    var stage = $('.seq__stage', sec), dayEl = $('[data-seq-day]', sec), fruitEl = $('[data-seq-fruit]', sec);
    var chipsEl = $('[data-seq-chips]', sec), copyEl = $('[data-seq-copy]', sec), bagsEl = $('[data-seq-bags]', sec);
    /* Photographs once they exist (Higgsfield cut-outs: the same plantain on each day, and each day's
       chips), the drawings until then. Each set switches on its own, only when all four photos are in. */
    var img = function (id, cls, alt) {
      return '<img class="' + cls + '" src="assets/img/' + id + '.webp" srcset="assets/img/' + id + '-sm.webp 900w, assets/img/' + id + '.webp 2000w" ' +
        'sizes="(max-width: 820px) 92vw, 44vw" alt="' + esc(alt) + '" decoding="async" loading="eager">';
    };
    var realFruit = D.chips.every(function (c) { return MEDIA.ready(c.id + '-plantain'); });
    var realChips = D.chips.every(function (c) { return MEDIA.ready(c.id + '-chips'); });
    var svg = null, photos = [];
    if (realFruit) {
      fruitEl.innerHTML = '<div class="seq__photos">' + D.chips.map(function (c) { return img(c.id + '-plantain', 'seq__photo', 'The same plantain on day ' + c.day + '.'); }).join('') + '</div>';
      fruitEl.removeAttribute('aria-hidden');
      photos = UI.$$('.seq__photo', fruitEl);
      sec.classList.add('seq--photo-fruit');
    } else {
      fruitEl.innerHTML = ART.plantain({ seed: 11 });
      svg = fruitEl.firstChild;
    }
    var turnEl = realFruit ? fruitEl.firstChild : svg;

    chipsEl.innerHTML = D.chips.map(function (c) {
      if (realChips) return '<div class="seq__chipset seq__chipset--photo">' + img(c.id + '-chips', 'seq__chipsphoto', c.name + ' chips.') + '</div>';
      var set = '';
      for (var j = 0; j < 6; j++) set += '<span class="seq__chip">' + ART.chip(c.id, { seed: j + 2, rot: (j * 47 + c.index * 20) % 180 - 90 }) + '</span>';
      return '<div class="seq__chipset">' + set + '</div>';
    }).join('');
    if (realChips) chipsEl.removeAttribute('aria-hidden');
    copyEl.innerHTML = D.chips.map(function (c) {
      return '<article class="seq__panel seq__panel--' + c.fg + '" data-morph="' + c.id + '">' +
        '<p class="mono seq__meta">Día ' + c.dayLabel + ' <span>·</span> ' + esc(c.cut.name) + ' <span>·</span> ' + esc(c.flavorEs) + '</p>' +
        '<h3 class="seq__name" data-morph-for="' + c.id + '" data-morph-part="name">' + esc(c.name) + '</h3>' +
        '<p class="seq__line">' + esc(c.line) + '</p>' +
        '<dl class="seq__facts"><div><dt>The cut</dt><dd>' + esc(c.cut.what) + ', ' + esc(c.cut.thick) + '</dd></div>' +
        '<div><dt>It tastes</dt><dd>' + esc(c.taste.join(', ')) + '</dd></div></dl>' +
        '<a class="btn" href="chip.html?c=' + c.id + '">Meet ' + esc(c.name) + '<span aria-hidden="true"> →</span></a></article>';
    }).join('');
    bagsEl.innerHTML = D.chips.map(function (c) {
      return '<a class="seq__bag" href="chip.html?c=' + c.id + '" data-morph="' + c.id + '" aria-label="' + esc(c.name) + ': see the bag">' +
        '<span data-morph-for="' + c.id + '" data-morph-part="bag">' + ART.bag3d(c.id, 'seq') + '</span></a>';
    }).join('');

    var panels = UI.$$('.seq__panel', sec), bags = UI.$$('.seq__bag', sec), sets = UI.$$('.seq__chipset', sec);
    var b3 = UI.$$('.b3', bagsEl); /* the 3D bags: each turns to face you as its day arrives */
    var chips = sets.map(function (s) { return UI.$$('.seq__chip', s); });
    var rule = UI.ruler($('[data-seq-rule]', sec));
    var T = D.chips.map(function (c) { return c.t; }), W = D.chips.map(function (c) { return ART.hex(c.world); });
    var N = D.chips.length, HOLD = 0.16, MOVE = (1 - N * HOLD) / (N - 1);

    /* scroll progress → position on the stage: it rests on each chip, then moves to the next */
    function pos(p) {
      var u = HOLD + MOVE, i = Math.min(N - 1, Math.floor(p / u)), f = p - i * u;
      return i >= N - 1 ? N - 1 : (f < HOLD ? i : i + smooth(0, 1, (f - HOLD) / MOVE));
    }

    var last = -1, cw = 0, s = 0;
    function resize() { cw = chipsEl.getBoundingClientRect().width; last = -1; }
    function measure() {
      var r = sec.getBoundingClientRect(), span = sec.offsetHeight - root.innerHeight;
      s = pos(span > 0 ? clamp(-r.top / span, 0, 1) : 0);
      if (Math.abs(s - last) < 0.0004) return;
      last = s;
      var still = UI.reduce();
      var i = Math.min(N - 2, Math.floor(s)), f = s - i, t = T[i] + (T[i + 1] - T[i]) * f;
      stage.style.backgroundColor = ART.css(ART.mixOk(W[i], W[i + 1], f));
      stage.classList.toggle('is-dark', s > N - 1.5);
      if (svg) ART.ripen(svg, t);
      /* the photos: the day you are leaving stays solid underneath and the next day fades in over it,
         so the fruit never turns see-through half way */
      for (var p = 0; p < photos.length; p++) {
        photos[p].style.opacity = p <= i ? (p === i ? 1 : 0) : (p === i + 1 ? f.toFixed(3) : 0);
        if (s >= N - 1) photos[p].style.opacity = p === N - 1 ? 1 : 0;
      }
      if (!still) turnEl.style.transform = 'rotate(' + (-9 + s * 3.4).toFixed(2) + 'deg)';
      dayEl.textContent = pad(Math.round(1 + t * (D.days - 1)));
      rule.set(t);
      for (var k = 0; k < N; k++) {
        var a = clamp(1 - Math.abs(s - k) * 2.2, 0, 1), e = smooth(0, 1, a), dir = s < k ? 1 : -1;
        var live = e > 0.5;
        panels[k].style.opacity = e.toFixed(3);
        panels[k].style.transform = still ? '' : 'translate3d(0,' + (dir * (1 - e) * 34).toFixed(1) + 'px,0)';
        if (panels[k].inert === live) { panels[k].inert = !live; bags[k].inert = !live; }
        bags[k].style.opacity = e.toFixed(3);
        bags[k].style.transform = still ? '' : 'translate3d(' + (dir * (1 - e) * 56).toFixed(1) + 'px,0,0)';
        b3[k].__pose = { ry: -0.34 + (still ? 0 : dir * (1 - e) * 1.5), o: e };
        if (root.RC_BAG3D) root.RC_BAG3D.poke(b3[k]);
        var c = smooth(0.25, 1, a), list = chips[k];
        sets[k].style.visibility = c > 0.001 ? 'visible' : 'hidden';
        if (c <= 0.001) continue;
        if (realChips) {
          /* the day's chips are laid out left to right as it arrives */
          sets[k].style.opacity = c.toFixed(3);
          sets[k].style.transform = still ? '' : 'translate3d(0,' + ((1 - c) * 26).toFixed(1) + 'px,0) scale(' + (0.92 + 0.08 * c).toFixed(3) + ')';
          sets[k].style.clipPath = still ? '' : 'inset(-10% ' + ((1 - c) * 100).toFixed(1) + '% -10% 0)';
          continue;
        }
        for (var j = 0; j < list.length; j++) {
          var off = j - (list.length - 1) / 2;
          list[j].style.opacity = c.toFixed(3);
          list[j].style.transform = 'translate3d(' + (off * cw * 0.155 * (still ? 1 : c)).toFixed(1) + 'px,' + (off * off * cw * 0.011 * (still ? 1 : c)).toFixed(1) + 'px,0) rotate(' +
            (off * 11 * (still ? 1 : c)).toFixed(1) + 'deg) scale(' + (still ? 1 : 0.5 + 0.5 * c).toFixed(3) + ')';
        }
      }
    }
    resize();
    root.addEventListener('resize', function () { resize(); measure(); });
    UI.onScroll(measure);
    /* the nav takes its tone from the day, not from a fixed section colour */
    UI.setNavTone(function () {
      var r = sec.getBoundingClientRect();
      if (!(r.top <= 30 && r.bottom > 30)) return null;
      /* worked out here, not read from the last frame: after a jump the nav is asked before the stage has moved */
      var span = sec.offsetHeight - root.innerHeight;
      return pos(span > 0 ? clamp(-r.top / span, 0, 1) : 0) > N - 1.5 ? 'dark' : 'light';
    });
  }
  var seq = $('[data-seq]');
  if (seq) Seq(seq);

  /* ───────── 2. sections from data ───────── */
  var four = $('[data-four]');
  if (four) {
    four.innerHTML = D.chips.map(function (c) {
      return '<article class="card rv" style="--world:' + c.world + '" data-morph="' + c.id + '">' +
        '<a class="card__link" href="chip.html?c=' + c.id + '">' +
        '<div class="card__pic" data-morph-part="bag"><figure class="slot" data-shot="' + c.id + '-bag" data-sizes="(max-width: 700px) 78vw, 24vw"></figure></div>' +
        '<p class="mono card__day">Día ' + c.dayLabel + ' <span>·</span> ' + esc(c.gloss) + '</p>' +
        '<h3 class="card__name" data-morph-part="name">' + esc(c.name) + '</h3>' +
        '<p class="card__flavor">' + esc(c.flavor) + '</p></a>' +
        '<div class="card__buy"><span class="card__price">' + money(D.sizes[0].price) + ' <small>' + esc(D.sizes[0].label) + '</small></span>' +
        '<button class="btn btn--sm" type="button" data-add="' + c.id + '" aria-label="Add ' + esc(c.name) + ' to your bag">Add</button></div></article>';
    }).join('');
    MEDIA.all(four);
    UI.watch(four);
    /* the "drag one to turn it" line only belongs here while the cards show 3D bags, not photos */
    var hint = $('.hint3d');
    if (hint && !four.querySelector('.b3')) hint.parentNode.removeChild(hint);
  }

  var steps = $('[data-steps]');
  if (steps) {
    steps.innerHTML = D.steps.map(function (s, i) {
      return '<li class="step rv" style="transition-delay:' + i * 60 + 'ms"><span class="mono step__n">' + pad(i + 1) + '</span>' +
        '<div><h3 class="step__es">' + esc(s.es) + '<small>' + esc(s.en) + '</small></h3><p>' + esc(s.text) + '</p></div></li>';
    }).join('');
    UI.watch(steps);
  }

  var pairs = $('[data-pairs]');
  if (pairs) {
    pairs.innerHTML = D.chips.map(function (c) {
      return '<article class="pair rv"><div class="rv-clip"><figure class="slot" data-shot="' + c.id + '-pair" data-sizes="(max-width: 700px) 84vw, 40vw"></figure></div>' +
        '<p class="mono pair__with"><i style="background:' + c.world + '"></i>' + esc(c.name) + ' with</p>' +
        '<h3 class="pair__name">' + esc(c.pair.name) + '</h3><p>' + esc(c.pair.what) + '</p></article>';
    }).join('');
    MEDIA.all(pairs);
    UI.watch(pairs);
  }

  var map = $('[data-map]');
  if (map) map.innerHTML = ART.map();

  /* the painted wheel turns with the page */
  var wheel = $('[data-wheel]');
  if (wheel) {
    wheel.innerHTML = ART.wheel('maduro');
    var w = wheel.firstChild;
    UI.onScroll(function (y) {
      if (UI.reduce()) return;
      var r = wheel.getBoundingClientRect();
      if (r.bottom < -100 || r.top > root.innerHeight + 100) return;
      w.style.transform = 'rotate(' + (y * 0.035).toFixed(2) + 'deg)';
    });
  }

  /* the gauge at the edge: how far the page has ripened */
  var dot = $('[data-gauge] i');
  if (dot) UI.onScroll(function (y) {
    var max = document.documentElement.scrollHeight - root.innerHeight;
    dot.style.transform = 'translate3d(0,' + (clamp(y / Math.max(1, max), 0, 1) * 168).toFixed(1) + 'px,0)';
  });

  /* la caja: the sign-up (front end only) */
  var form = $('[data-signup]');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('input[type="email"]', form), msg = $('[data-signup-msg]', form);
    if (!input.value || !input.checkValidity()) { msg.textContent = 'That email does not look complete. Check it and try again.'; input.focus(); return; }
    msg.textContent = 'You are on the list. We will write when the first racimo is cut.';
    input.value = '';
  });
})(window);
