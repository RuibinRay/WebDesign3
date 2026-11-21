/*
 * RACIMO: image slots.
 *
 *   <figure class="slot" data-shot="verde-bag"></figure>
 *   <figure class="slot slot--fill" data-shot="ripen-start"></figure>
 *
 * If the shot id is listed in assets/img/ready.js (written by higgsfield/optimize.mjs), the slot
 * loads assets/img/<id>.webp (and <id>-sm.webp for small screens). If not, it draws a stand-in:
 * the right bag, chips, fruit or bunch from js/art.js on the shot's own backdrop colour, with a
 * small tag saying which picture belongs there. Nothing ever shows as a broken image.
 */
(function (root) {
  var SHOTS = root.RACIMO_SHOTS, ART = root.RC_ART;
  var READY = root.RACIMO_READY || { img: [] };
  var img = {};
  (READY.img || []).forEach(function (id) { img[id] = 1; });

  var ratio = function (a) { var p = a.split(':'); return p[0] + ' / ' + p[1]; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var light = function (h) {
    var n = parseInt(h.slice(1), 16);
    return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 > 0.4;
  };

  function pending(el, s) {
    el.classList.add('slot--pending', light(s.bg) ? 'slot--on-light' : 'slot--on-dark');
    el.innerHTML =
      ART.poster(s) +
      '<figcaption class="slot__note">' +
      '<span class="slot__tag"><b>Image pending</b><span>' + esc(s.id) + '</span><span>' + esc(s.aspect) + '</span></span>' +
      '<span class="slot__brief">' + esc(s.brief) + '</span>' +
      '</figcaption>';
    ART.paint(el);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', s.alt + ' (photo not produced yet; a drawing stands in)');
  }

  function picture(el, s) {
    var i = document.createElement('img');
    i.src = 'assets/img/' + s.id + '.webp';
    i.srcset = 'assets/img/' + s.id + '-sm.webp 900w, assets/img/' + s.id + '.webp 2000w';
    i.sizes = el.getAttribute('data-sizes') || '100vw';
    i.alt = s.alt;
    i.decoding = 'async';
    if (s.priority) { i.loading = 'eager'; i.setAttribute('fetchpriority', 'high'); } else i.loading = 'lazy';
    if (el.dataset.focus) i.style.objectPosition = el.dataset.focus;
    i.addEventListener('load', function () { el.classList.add('is-loaded'); });
    el.innerHTML = '';
    el.appendChild(i);
    el.classList.add('slot--ready');
    if (i.complete) el.classList.add('is-loaded');
  }

  function fill(el) {
    var id = el.getAttribute('data-shot');
    var s = SHOTS && SHOTS.byId[id];
    if (!s) { el.textContent = 'Unknown shot: ' + id; return; }
    if (!el.classList.contains('slot--fill') && !el.hasAttribute('data-free')) el.style.aspectRatio = ratio(s.aspect);
    el.style.setProperty('--slot-bg', s.bg);
    if (img[id]) picture(el, s); else pending(el, s);
  }

  root.RC_MEDIA = {
    fill: fill,
    all: function (scope) { Array.prototype.forEach.call((scope || document).querySelectorAll('[data-shot]'), fill); },
    ready: function (id) { return !!img[id]; },
  };
})(window);
