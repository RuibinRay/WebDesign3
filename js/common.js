/*
 * RACIMO: shared behaviour for every page. The mark, image slots, the nav and its tone, word
 * reveals, picture reveals, smooth scrolling, page morphs, the ripeness ruler, the bag (cart),
 * the toast and the motion setting.
 */
(function (root) {
  var d = document.documentElement, D = root.RACIMO, ART = root.RC_ART;
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduce = function () { return d.classList.contains('reduce'); };
  var clamp = ART.clamp, smooth = ART.smooth;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* marks and image slots */
  $$('[data-mark]').forEach(function (el) { el.innerHTML = ART.mark({ color: el.getAttribute('data-mark') === 'color', onDark: el.hasAttribute('data-on-dark') }); });
  root.RC_MEDIA.all();
  ART.paint();

  /* headings that rise word by word from behind a mask */
  $$('[data-split]').forEach(function (el) {
    var html = el.innerHTML.trim().split(/(<br\s*\/?>)/i), n = 0;
    el.innerHTML = html.map(function (part) {
      if (/^<br/i.test(part)) return part;
      return part.split(/\s+/).filter(Boolean).map(function (w) {
        return '<span class="w"><span style="transition-delay:' + (n++ * 45) + 'ms">' + w + '</span></span>';
      }).join(' ');
    }).join('');
    el.classList.add('rv-words');
  });

  /* scroll: one listener, many subscribers */
  var subs = [], ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY;
    for (var i = 0; i < subs.length; i++) subs[i](y);
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  var onScroll = function (fn) { subs.push(fn); fn(window.scrollY); };

  /* nav: takes the tone of whatever is under it; tucks away reading down */
  var nav = document.querySelector('[data-nav]');
  var lastY = 0, navTone = null;
  if (nav) onScroll(function (y) {
    var down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > window.innerHeight * 0.9) nav.classList.add('is-hidden');
    else if (up || y < 80) nav.classList.remove('is-hidden');
    lastY = y;
    var tone = navTone && navTone(y);
    if (!tone) {
      var secs = $$('[data-tone]');
      for (var i = secs.length - 1; i >= 0; i--) {
        var r = secs[i].getBoundingClientRect();
        if (r.top <= 30 && r.bottom > 30) { tone = secs[i].getAttribute('data-tone'); break; }
      }
    }
    nav.setAttribute('data-on', tone || 'dark');
  });

  /* ───────── smooth scrolling ─────────
     Lenis on desktop with full motion. It drives the real window scroll, so every scroll scene keeps
     reading window.scrollY. Off on touch screens, under "reduce", and under ?sync (the test pane). */
  var lenis = null;
  var touch = root.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var testing = /[?&]sync\b/.test(location.search);
  function smoothOn() {
    if (lenis || reduce() || touch || testing || !root.Lenis) return;
    lenis = new root.Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 0.9, respectReducedMotion: false });
    lenis.on('scroll', kick);
  }
  function smoothOff() { if (lenis) { lenis.destroy(); lenis = null; } }
  smoothOn();

  /* same-page anchors: a long jump plays as a fast-forward, so the page ripens past you */
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function goTo(target) {
    if (lenis) {
      var screens = Math.abs(target.getBoundingClientRect().top) / window.innerHeight;
      lenis.scrollTo(target, { duration: clamp(0.9 + screens * 0.09, 0.9, 2.6), easing: easeInOut });
    } else {
      target.scrollIntoView({ behavior: reduce() || testing ? 'instant' : 'smooth', block: 'start' });
    }
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    goTo(target);
    if (history.replaceState) history.replaceState(null, '', url.hash);
  });

  /* ───────── page morphs (View Transitions between pages) ─────────
     A chip page names its hero bag "bag-<id>" and its title "name-<id>". On the page you leave, names
     are given only to the parts of the thing you clicked, at the moment you leave: a bag appears in
     several places on the home page, and two elements with one name cancel the whole transition.
     A clickable group is [data-morph="<id>"]; its parts are [data-morph-part="bag|name"] inside it,
     or anywhere with [data-morph-for="<id>"]. */
  var lastLink = null, morphed = [];
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) lastLink = a; }, true);
  function nameIt(el, name, cls) {
    if (!el) return;
    el.style.viewTransitionName = name;
    el.style.viewTransitionClass = cls;
    morphed.push(el);
  }
  function clearMorph() {
    morphed.forEach(function (el) { el.style.viewTransitionName = ''; el.style.viewTransitionClass = ''; });
    morphed = [];
  }
  function partOf(group, id, part) {
    return group.querySelector('[data-morph-part="' + part + '"]') ||
      document.querySelector('[data-morph-for="' + id + '"][data-morph-part="' + part + '"]');
  }
  function guard(t) {
    /* a transition the browser aborts (background tab, quick reload) rejects these; that is not an error */
    [t.ready, t.finished, t.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () {}); });
  }
  root.addEventListener('pageswap', function (e) {
    var t = e.viewTransition;
    if (!t) return;
    guard(t);
    if (reduce()) { t.skipTransition(); return; }
    var dest = e.activation && e.activation.entry && e.activation.entry.url;
    var group = lastLink && dest && lastLink.href === dest && lastLink.closest('[data-morph]');
    if (!group) return;
    var id = group.getAttribute('data-morph');
    nameIt(partOf(group, id, 'bag'), 'bag-' + id, 'bag');
    nameIt(partOf(group, id, 'name'), 'name-' + id, 'name');
  });
  root.addEventListener('pagereveal', function (e) {
    var t = e.viewTransition;
    if (!t) return;
    guard(t);
    if (reduce()) t.skipTransition();
    t.finished.then(clearMorph, clearMorph);
  });
  root.addEventListener('pageshow', function (e) { if (e.persisted) setTimeout(clearMorph, 1500); });

  /* entrance reveals: text rises, pictures unmask. Once each. */
  var io = 'IntersectionObserver' in root ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;
  function watch(scope) {
    $$('.rv, .rv-words, .rv-clip', scope).forEach(function (el) {
      if (io && !reduce()) io.observe(el); else el.classList.add('is-in');
    });
  }
  watch();

  /* ───────── the ripeness ruler ─────────
     Twelve days on one line. Used by the home sequence (driven by scroll) and by the chip pages
     (driven by a range input). build() returns { set(t) }. */
  function ruler(el, opts) {
    opts = opts || {};
    var ticks = '';
    for (var day = 1; day <= D.days; day++) {
      var c = D.chips.filter(function (x) { return x.day === day; })[0];
      ticks += '<li class="' + (c ? 'is-cut' : '') + '" style="left:' + (D.tOf(day) * 100) + '%"><i></i>' +
        (c ? '<span><b>' + c.dayLabel + '</b>' + esc(c.name) + '</span>' : '') + '</li>';
    }
    el.classList.add('rule');
    el.innerHTML =
      '<div class="rule__line"><div class="rule__bar"></div><ol class="rule__days" aria-hidden="true">' + ticks + '</ol><span class="rule__mark"></span>' +
      (opts.input ? '<input class="rule__input" type="range" min="1" max="' + D.days + '" step="1" value="' + (opts.day || 1) + '" aria-label="Day since the bunch was cut">' : '') + '</div>' +
      '<dl class="rule__meters"><div><dt>Starch</dt><dd><i data-m="starch"></i></dd></div><div><dt>Sugar</dt><dd><i data-m="sugar"></i></dd></div></dl>';
    var mark = el.querySelector('.rule__mark'), st = el.querySelector('[data-m="starch"]'), su = el.querySelector('[data-m="sugar"]');
    function set(t) {
      mark.style.left = (t * 100).toFixed(2) + '%';
      mark.style.backgroundColor = ART.css(ART.peelAt(t));
      st.style.transform = 'scaleX(' + (1 - smooth(0.04, 0.96, t) * 0.9).toFixed(3) + ')';
      su.style.transform = 'scaleX(' + (0.06 + smooth(0.08, 1, t) * 0.94).toFixed(3) + ')';
    }
    set(opts.day ? D.tOf(opts.day) : 0);
    return { set: set, input: el.querySelector('.rule__input') };
  }

  /* toast */
  var toastEl = document.querySelector('[data-toast]'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }

  /* the bag (front end only: kept in this browser) */
  var KEY = 'racimo.bolsa';
  function readBag() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function paintBag(bump) {
    var n = readBag().reduce(function (a, i) { return a + (i.qty || 1); }, 0);
    $$('[data-bag-count]').forEach(function (c) {
      c.textContent = n;
      c.hidden = !n;
      if (bump && !reduce()) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    });
  }
  function addToBag(item) {
    var list = readBag();
    var same = list.filter(function (i) { return i.id === item.id && i.size === item.size; })[0];
    if (same) same.qty = (same.qty || 1) + 1; else { item.qty = 1; list.push(item); }
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    paintBag(true);
    toast(item.name + ' is in your bag. Checkout opens at launch.');
  }
  paintBag(false);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-add]');
    if (b) {
      var c = D.byId[b.getAttribute('data-add')];
      addToBag({ id: c ? c.id : 'caja', name: c ? c.name : D.box.name, size: b.getAttribute('data-size') || 'bag' });
      return;
    }
    var open = e.target.closest && e.target.closest('[data-bag-open]');
    if (open) {
      var list = readBag();
      toast(list.length ? list.map(function (i) { return i.qty + ' × ' + i.name; }).join(', ') + '. Checkout opens at launch.' : 'Your bag is empty. Pick a day.');
    }
  });

  /* motion setting */
  var mb = document.querySelector('[data-motion-toggle]');
  function paintMotion() { if (mb) { mb.textContent = reduce() ? 'Full motion' : 'Reduce motion'; mb.setAttribute('aria-pressed', String(reduce())); } }
  if (mb) mb.addEventListener('click', function () {
    d.classList.toggle('reduce');
    try { localStorage.setItem('racimo.motion', reduce() ? 'reduce' : 'full'); } catch (e) {}
    if (reduce()) smoothOff(); else smoothOn();
    paintMotion();
    $$('.rv, .rv-words, .rv-clip').forEach(function (el) { el.classList.add('is-in'); });
    kick();
  });
  paintMotion();

  /* the 3D bags: fetched after everything else, and only on pages that show a bag */
  root.addEventListener('load', function () {
    if (!document.querySelector('[data-b3]')) return;
    var s = document.createElement('script');
    s.src = 'js/bag3d.js';
    document.body.appendChild(s);
  });

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  root.RC_UI = {
    $$: $$, esc: esc, onScroll: onScroll, toast: toast, watch: watch, reduce: reduce, kick: kick, clamp: clamp, smooth: smooth,
    ruler: ruler, goTo: goTo, testing: testing,
    setNavTone: function (fn) { navTone = fn; kick(); },
  };
  /* a page that draws itself before this file runs (the chip page) wires its controls here */
  if (root.RC_PAGE_INIT) root.RC_PAGE_INIT(root.RC_UI);
})(window);
