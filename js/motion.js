/*
 * Motion setting, read before the page paints.
 * Full motion by default on every device, Mac and phones included, whatever the system
 * "reduce motion" switch says. Only the footer button turns it down, and that choice is remembered.
 */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var saved = null;
  try { saved = localStorage.getItem('racimo.motion'); } catch (e) {}
  /* Full motion everywhere by default: Mac, Windows, iPhone, Android, whatever the system setting says.
     Only the visitor's own choice, made with the "Reduce motion" button in the footer, turns it down. */
  if (saved === 'reduce') d.classList.add('reduce');
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
