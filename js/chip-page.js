/*
 * RACIMO: a chip page (chip.html?c=verde). One template, drawn from js/data.js.
 * It runs before common.js, so the page exists (and its hero is named for the page morph)
 * before the first paint. Controls are wired afterwards in RC_PAGE_INIT.
 */
(function (root) {
  var D = root.RACIMO, ART = root.RC_ART;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var money = function (n) { return '$' + n.toFixed(2); };
  var id = (new URLSearchParams(location.search).get('c') || 'verde').toLowerCase();
  var c = D.byId[id] || D.chips[0];
  var next = D.chips[(c.index + 1) % D.chips.length];
  var dark = c.fg === 'paper';
  var dots = function (n) { var o = ''; for (var i = 1; i <= 5; i++) o += '<i class="' + (i <= n ? 'on' : '') + '"></i>'; return o; };
  var N = c.nutrition;

  document.title = c.name + ' · ' + c.flavor + ' · Racimo plantain chips';
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', 'Racimo ' + c.name + ': plantain chips cut on day ' + c.day + '. ' + c.line);
  document.documentElement.style.setProperty('--world', c.world);
  document.documentElement.style.setProperty('--next', next.world);

  var main = document.querySelector('[data-chip]');
  main.innerHTML =
    /* hero */
    '<section class="phero phero--' + c.fg + ' seam" data-tone="' + (dark ? 'dark' : 'light') + '" style="--seam: var(--papel)">' +
    '<div class="phero__text">' +
    '<a class="back mono" href="index.html#cuatro">← All four days</a>' +
    '<p class="mono phero__day">Día ' + c.dayLabel + ' of ' + D.days + ' <span>·</span> ' + esc(c.gloss) + '</p>' +
    '<h1 class="phero__name" id="name">' + esc(c.name) + '</h1>' +
    '<p class="phero__flavor">' + esc(c.flavor) + ' <span class="mono">' + esc(c.flavorEs) + '</span></p>' +
    '<p class="phero__blurb">' + esc(c.blurb) + '</p>' +
    '<dl class="meters"><div><dt>Crunch</dt><dd aria-label="' + c.crunch + ' of 5">' + dots(c.crunch) + '</dd></div>' +
    '<div><dt>Sweet</dt><dd aria-label="' + c.sweet + ' of 5">' + dots(c.sweet) + '</dd></div></dl>' +
    '<form class="buy" data-buy><fieldset class="sizes"><legend class="sr">Size</legend>' +
    D.sizes.map(function (s, i) {
      return '<label><input type="radio" name="size" value="' + s.id + '" data-price="' + s.price + '"' + (i ? '' : ' checked') + '><span>' + esc(s.label) + '</span></label>';
    }).join('') + '</fieldset>' +
    '<div class="buy__row"><output class="buy__price" data-price-out>' + money(D.sizes[0].price) + '</output>' +
    '<button class="btn btn--lg" type="submit">Add to bag</button></div></form>' +
    '</div>' +
    '<div class="phero__pack">' +
    '<div class="pack3d" id="pack">' +
    ART.bag3d(c.id, 'hero') +
    '<div class="pack3d__chips" aria-hidden="true">' + [3, 4, 5].map(function (n) { return ART.chip(c.id, { seed: n, rot: n * 37 }); }).join('') + '</div></div>' +
    '<div class="pack3d__bar"><button class="turn mono" type="button" data-b3-turn hidden aria-pressed="false">Turn the bag over</button>' +
    '<span class="mono pack3d__hint" data-b3-hint hidden>or drag it <i>·</i> double-click flips it</span></div>' +
    '</div></section>' +

    /* the day */
    '<section class="sec sec--paper day seam" data-tone="light" id="dia" style="--seam: var(--hoja)">' +
    '<div class="day__text"><p class="mono kicker">The day</p>' +
    '<h2 class="h2" data-split>Why day ' + c.day + '.</h2>' +
    '<p class="lead rv">' + esc(c.day_note) + '</p>' +
    '<div class="day__tool rv"><div class="day__fruit" data-day-fruit></div>' +
    '<p class="day__read"><b class="mono" data-day-n>Día ' + c.dayLabel + '</b><span data-day-note></span></p>' +
    '<div data-day-rule></div><p class="mono day__hint">Drag the marker to any day. Starch and sugar are illustrative.</p></div></div>' +
    '<div class="day__pic rv-clip"><figure class="slot" data-shot="' + c.id + '-fruit" data-sizes="(max-width: 800px) 92vw, 40vw"></figure></div>' +
    '</section>' +

    /* the cut */
    '<section class="sec cut seam" data-tone="dark" id="corte" style="--seam: var(--papel)">' +
    '<div class="cut__pic rv-clip"><figure class="slot" data-shot="' + c.id + '-pile" data-sizes="(max-width: 800px) 92vw, 38vw"></figure></div>' +
    '<div class="cut__text"><p class="mono kicker">The cut</p>' +
    '<h2 class="h2" data-split>' + esc(c.cut.name) + '.</h2>' +
    '<div class="cut__chip rv">' + ART.chip(c.id, { seed: 3, rot: -8 }) + '</div>' +
    '<dl class="spec rv"><div><dt>Shape</dt><dd>' + esc(c.cut.what) + '</dd></div><div><dt>Thickness</dt><dd>' + esc(c.cut.thick) + '</dd></div>' +
    '<div><dt>The kettle</dt><dd>' + esc(c.cut.fry) + '</dd></div><div><dt>It tastes</dt><dd>' + esc(c.taste.join(', ')) + '</dd></div>' +
    '<div><dt>In the bag</dt><dd>' + esc(c.ingredients) + '</dd></div></dl></div>' +
    '</section>' +

    /* con qué */
    '<section class="sec sec--paper with seam" data-tone="light" id="con-que" style="--seam: var(--next)">' +
    '<div class="with__pic rv-clip"><figure class="slot" data-shot="' + c.id + '-pair" data-sizes="(max-width: 800px) 92vw, 54vw"></figure></div>' +
    '<div class="with__text"><p class="mono kicker">Con qué <span>·</span> what to eat it with</p>' +
    '<h2 class="h2" data-split>' + esc(c.pair.name) + '.</h2><p class="lead rv">' + esc(c.pair.what) + '</p>' +
    '<details class="nutri rv"><summary>Nutrition, per 28 g</summary><table class="facts"><tbody>' +
    [['Energy', N.kcal + ' kcal'], ['Fat', N.fat], ['Carbohydrate', N.carbs], ['of which sugars', N.sugars], ['Fibre', N.fibre], ['Protein', N.protein], ['Sodium', N.sodium]].map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('') + '</tbody></table><p class="mono">Concept values, not a tested label.</p></details></div>' +
    '</section>' +

    /* next day */
    '<a class="nextday nextday--' + next.fg + ' seam" style="--seam: var(--noche)" href="chip.html?c=' + next.id + '" data-morph="' + next.id + '" data-tone="' + (next.fg === 'paper' ? 'dark' : 'light') + '">' +
    '<span class="mono">' + (next.index ? 'Three days later' : 'The next racimo is already hanging') + ' <i>·</i> Día ' + next.dayLabel + '</span>' +
    '<strong data-morph-part="name">' + esc(next.name) + '</strong>' +
    '<span class="nextday__bag" data-morph-part="bag">' + ART.bag3d(next.id, 'pose') + '</span>' +
    '<span class="nextday__go" aria-hidden="true">→</span></a>';

  /* the names the page morph lands on */
  var pack = main.querySelector('#pack'), title = main.querySelector('#name');
  pack.style.viewTransitionName = 'bag-' + c.id; pack.style.viewTransitionClass = 'bag';
  title.style.viewTransitionName = 'name-' + c.id; title.style.viewTransitionClass = 'name';

  root.RC_PAGE_INIT = function (UI) {
    /* turn the bag over: the button appears once the 3D bag has loaded (js/bag3d.js) */
    var bag = pack.querySelector('.b3'), btn = main.querySelector('[data-b3-turn]');
    btn.addEventListener('click', function () { if (root.RC_BAG3D) root.RC_BAG3D.turn(bag); });
    bag.addEventListener('b3:face', function (e) {
      btn.setAttribute('aria-pressed', String(e.detail.back));
      btn.textContent = e.detail.back ? 'Turn it back' : 'Turn the bag over';
    });

    /* size and price */
    var buy = main.querySelector('[data-buy]'), out = main.querySelector('[data-price-out]');
    buy.addEventListener('change', function () {
      out.textContent = money(parseFloat(buy.querySelector('input:checked').getAttribute('data-price')));
    });
    buy.addEventListener('submit', function (e) {
      e.preventDefault();
      var size = buy.querySelector('input:checked').value;
      var b = document.createElement('button');
      b.setAttribute('data-add', c.id); b.setAttribute('data-size', size); b.hidden = true;
      buy.appendChild(b); b.click(); buy.removeChild(b);
    });

    /* the ruler: drag to any day */
    var fruitEl = main.querySelector('[data-day-fruit]'), nEl = main.querySelector('[data-day-n]'), noteEl = main.querySelector('[data-day-note]');
    fruitEl.innerHTML = ART.plantain({ seed: 20 + c.index });
    var svg = fruitEl.firstChild;
    var rule = UI.ruler(main.querySelector('[data-day-rule]'), { input: true, day: c.day });
    function show(day) {
      var t = D.tOf(day), cut = D.chips.filter(function (x) { return x.day === day; })[0];
      ART.ripen(svg, t);
      rule.set(t);
      nEl.textContent = 'Día ' + (day < 10 ? '0' : '') + day;
      noteEl.innerHTML = cut
        ? (cut.id === c.id ? 'Today we cut ' + esc(cut.name) + '.' : 'Today we cut <a href="chip.html?c=' + cut.id + '">' + esc(cut.name) + '</a>.')
        : esc(D.wait[day]);
    }
    rule.input.addEventListener('input', function () { show(parseInt(rule.input.value, 10)); });
    show(c.day);
  };
})(window);
