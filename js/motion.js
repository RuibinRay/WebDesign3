/*
 * Motion setting, read before the page paints.
 * Full motion by default on desktop. Phones and tablets follow the system "reduce motion"
 * switch. A visitor's own choice, made with the footer button, is remembered and always wins.
 */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var saved = null;
  try { saved = localStorage.getItem('racimo.motion'); } catch (e) {}
  var touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var sysReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (saved === 'reduce' || (saved === null && touch && sysReduce)) d.classList.add('reduce');
  /* A page morph the browser abandons (a background tab, a quick reload) rejects its promises. That is
     not an error. Caught here, in the head, because the reveal can happen before the later scripts run. */
  ['pageswap', 'pagereveal'].forEach(function (name) {
    window.addEventListener(name, function (e) {
      var t = e.viewTransition;
      if (t) [t.ready, t.finished, t.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () {}); });
    });
  });
  /* In a background tab the browser can abandon the morph before any event hands the page its promises,
     so nothing above can catch it. Only that one harmless rejection is silenced here. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(String(r.message))) e.preventDefault();
  });
  /* ?sync: testing aid for background tabs, where animation frames never fire */
  if (/[?&]sync\b/.test(location.search)) {
    d.classList.add('sync'); /* and no CSS transitions: a hidden tab freezes them half way */
    window.requestAnimationFrame = function (f) { return setTimeout(function () { f(performance.now()); }, 16); };
    window.cancelAnimationFrame = clearTimeout;
  }
})();
