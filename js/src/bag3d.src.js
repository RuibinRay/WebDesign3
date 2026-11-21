/*
 * RACIMO: the bags in real-time 3D. Source file; the site loads the bundled js/bag3d.js.
 * After editing, rebuild with:  node tools/build-3d.mjs
 *
 * Every bag on the site is a host element written by RC_ART.bag3d(id, mode):
 *
 *   <span class="b3" data-b3="verde" data-b3-mode="card"> <svg class="bag">…</svg> <canvas class="b3__c"> </span>
 *
 * The drawn SVG shows first. When this file has loaded, each host gets a pillow bag built in code and
 * wrapped in the same drawing (front and back, from RC_ART.bag / RC_ART.bagBack), so the 3D bag and the
 * flat pack can never disagree. If WebGL is not available nothing changes: the drawn bags stay.
 *
 * One WebGL renderer serves every bag on the page. It draws a bag, then copies the result into that
 * host's own 2D canvas, so sixteen bags on the home page cost one GL context, and only bags that are
 * on screen and have changed are drawn.
 *
 * Every bag can be handled:
 *   drag            turns it, all the way round, and tilts it; let go and it keeps spinning, then slows
 *   pointer nearby  it leans toward the pointer
 *   double-click    flips it over (where the bag is not inside a link)
 *   arrow keys      turn the chip page's bag; Home shows the front, End the back
 * Away from the chip page a bag settles back to its resting pose once the pointer has left it.
 * A drag never follows the link the bag sits in; a plain click still does.
 *
 * Modes:   card   rests at an angle (the shop)
 *          seq    the four-days screen: home.js sets host.__pose = { ry, o } as you scroll
 *          hero   the chip page: stays where you leave it; RC_BAG3D.turn(host) turns it over
 *          pose   rests at an angle
 *          row    data-b3="all": the four bags side by side (la caja), each one handled on its own
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, MeshBasicMaterial,
  DirectionalLight, HemisphereLight, CanvasTexture, SRGBColorSpace, BackSide, NoToneMapping,
} from 'three';

(function (root) {
  const D = root.RACIMO, ART = root.RC_ART, doc = document;
  if (!D || !ART) return;
  const hosts = [].slice.call(doc.querySelectorAll('[data-b3]'));
  if (!hosts.length) return;

  const reduce = () => doc.documentElement.classList.contains('reduce');
  const testing = /[?&]sync\b/.test(location.search);
  const fine = root.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const TAU = Math.PI * 2;

  /* ───────── one renderer ───────── */
  let renderer;
  try { renderer = new WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' }); }
  catch (e) { return; }
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping; /* the label keeps its exact brand colours */
  renderer.setScissorTest(true);

  const FOV = 26, TAN = Math.tan((FOV * Math.PI) / 360);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 60);
  scene.add(new HemisphereLight(0xffffff, 0xb9a98d, 2.75));
  const key = new DirectionalLight(0xffffff, 1.65);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new DirectionalLight(0xfff1d6, 1.1);
  rim.position.set(5, 1.5, -4);
  scene.add(rim);

  /* ───────── the bag: a pillow pouch, two shells sealed flat at the top and bottom ───────── */
  const W = 2, H = (W * ART.label.h) / ART.label.w, T = 0.4, NX = 40, NY = 58;
  const SEAL = 0.868; /* where the crimped bands begin, matching the drawing */
  function point(u, v, side) {
    const av = Math.abs(v);
    const w = av >= SEAL ? 0 : (SEAL - av) / SEAL;                 /* 0 at the seal → 1 at the middle */
    const s = 1 - Math.pow(1 - w, 2.6);                             /* swells fast, then holds */
    const c = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.3)), 0.6);
    const near = av < SEAL ? Math.exp(-w * 5) : 0;                  /* creases gather just inside the seals */
    const crease = 1 + 0.2 * near * Math.sin(u * 9 + side * 1.3) * Math.sin(u * 23 + v * 2);
    const settle = 1 - 0.16 * Math.max(0, v);                       /* the chips sit low: fuller at the bottom */
    const z = T * s * c * crease * settle;
    const band = av >= SEAL ? 0.016 * Math.sin(u * 5 + (v > 0 ? 0 : 1.7)) : 0;  /* the flat bands are never quite flat */
    return [u * (W / 2) * (1 - 0.075 * s), v * (H / 2) * (1 - 0.012 * s), side * z + band];
  }
  function shell(side) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const p = point((i / NX) * 2 - 1, (j / NY) * 2 - 1, side);
      pos.push(p[0], p[1], p[2]);
      uv.push(side > 0 ? i / NX : 1 - i / NX, j / NY);
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      if (side > 0) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  /* the ink outline: the same shell a little larger, seen only from inside out */
  function hull(g) {
    const h = g.clone(), p = h.attributes.position, n = h.attributes.normal, E = 0.022;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, (p.getX(i) + n.getX(i) * E) * 1.019, (p.getY(i) + n.getY(i) * E) * 1.014, p.getZ(i) + n.getZ(i) * E);
    }
    return h;
  }
  const frontG = shell(1), backG = shell(-1), frontH = hull(frontG), backH = hull(backG);

  const bags = {};
  D.chips.forEach((c) => {
    const front = new MeshStandardMaterial({ color: c.world, roughness: 0.52, metalness: 0.04 });
    const back = new MeshStandardMaterial({ color: c.world, roughness: 0.52, metalness: 0.04 });
    const line = new MeshBasicMaterial({ color: c.fg === 'paper' ? D.color.ambar : D.color.tinta, side: BackSide });
    const group = new Group();
    group.add(new Mesh(frontG, front), new Mesh(backG, back), new Mesh(frontH, line), new Mesh(backH, line));
    group.visible = false;
    scene.add(group);
    bags[c.id] = { group, front, back, ready: false };
  });

  /* ───────── one bag being handled: where it rests, how far you have turned it ───────── */
  function Item(base) {
    this.base = base;                 /* resting yaw */
    this.lean = this.leanX = 0;       /* toward the pointer, eased */
    this.toLean = this.toLeanX = 0;
    this.oy = this.ox = 0;            /* what the drag added: yaw (unlimited) and pitch */
    this.vel = 0;                     /* yaw speed at release, radians a second */
    this.dragging = false;
    this.turn = null;                 /* an eased turn in progress: { from, to, t0, ms } */
  }
  Item.prototype.yaw = function () { return this.base + this.lean + this.oy; };
  Item.prototype.pitch = function () { return 0.04 + this.leanX + this.ox; };
  Item.prototype.turnTo = function (to, ms) { this.vel = 0; this.turn = { from: this.oy, to: to, t0: performance.now(), ms: ms }; };
  /* free: it stays where you leave it (chip page). settle: it may go back to its resting pose now. */
  Item.prototype.update = function (dt, now, free, settle) {
    const still = reduce();
    let moving = false;
    if (Math.abs(this.toLean - this.lean) > 0.0008 || Math.abs(this.toLeanX - this.leanX) > 0.0008) {
      const k = still ? 1 : 1 - Math.exp(-dt * 9);
      this.lean += (this.toLean - this.lean) * k;
      this.leanX += (this.toLeanX - this.leanX) * k;
      moving = true;
    }
    if (this.turn) {
      const t = still ? 1 : clamp((now - this.turn.t0) / this.turn.ms, 0, 1);
      this.oy = this.turn.from + (this.turn.to - this.turn.from) * ease(t);
      if (t >= 1) this.turn = null;
      moving = true;
    } else if (!this.dragging) {
      if (Math.abs(this.vel) > 0.03) {
        this.oy += this.vel * dt;
        this.vel *= Math.exp(-dt * 3.2);
        moving = true;
      } else if (!free && settle) {
        const home = Math.round(this.oy / TAU) * TAU; /* the nearest front, not the long way back */
        if (Math.abs(home - this.oy) > 0.002) { this.oy += (home - this.oy) * (still ? 1 : 1 - Math.exp(-dt * 5)); moving = true; }
      }
      if (Math.abs(this.ox) > 0.002) { this.ox += -this.ox * (still ? 1 : 1 - Math.exp(-dt * 6)); moving = true; }
    }
    return moving;
  };
  Item.prototype.busy = function () { return this.dragging || !!this.turn || Math.abs(this.vel) > 0.03; };

  /* ───────── views: one per host ───────── */
  const BASE = { card: -0.46, seq: -0.34, hero: -0.38, pose: -0.3, row: 0 };
  const ROLL = { card: -0.035, seq: 0.03, hero: -0.02, pose: -0.05, row: 0 };
  const FILL = 0.714; /* the bag's height in its canvas: the canvas is 124% of the host, the drawn bag 88.5% of it */
  const views = [], byHost = new WeakMap();
  let bw = 0, bh = 0;

  function ready(v) { return v.row ? D.chips.every((c) => bags[c.id].ready) : !!(bags[v.id] && bags[v.id].ready); }

  function draw(v, now) {
    const dpr = Math.min(root.devicePixelRatio || 1, 2);
    const w = Math.min(1500, Math.round(v.cv.clientWidth * dpr)), h = Math.min(1800, Math.round(v.cv.clientHeight * dpr));
    if (!w || !h) return;
    if (w !== v.w || h !== v.h) { v.w = v.cv.width = w; v.h = v.cv.height = h; }
    if (w > bw || h > bh) { bw = Math.max(bw, w); bh = Math.max(bh, h); renderer.setSize(bw, bh, false); }
    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);
    camera.aspect = w / h;
    D.chips.forEach((c) => { bags[c.id].group.visible = false; });
    let dist;
    if (v.row) {
      const gap = 2.26, span = gap * 3 + W + 0.5;
      dist = Math.max(span / (2 * TAN * camera.aspect), (H + 0.5) / (2 * TAN));
      D.chips.forEach((c, i) => {
        const g = bags[c.id].group, it = v.items[i];
        g.visible = true;
        g.position.set((i - 1.5) * gap, i % 2 ? -0.07 : 0.07, 0);
        g.rotation.set(it.pitch() - 0.01, it.yaw(), i % 2 ? 0.05 : -0.05);
      });
    } else {
      const it = v.items[0], live = v.live();
      dist = H / FILL / (2 * TAN);
      const g = bags[v.id].group;
      g.visible = true;
      g.position.set(0, live ? Math.sin(now / 1700 + v.phase) * 0.035 : 0, 0);
      g.rotation.set(it.pitch(), it.yaw() + (live ? Math.sin(now / 1400 + v.phase) * 0.07 : 0), ROLL[v.mode] || 0);
    }
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    v.ctx.clearRect(0, 0, w, h);
    v.ctx.drawImage(renderer.domElement, 0, bh - h, w, h, 0, 0, w, h);
    if (!v.drawn) { v.drawn = true; v.host.classList.add('is-3d'); }
  }

  function View(host) {
    const v = this;
    v.host = host; v.id = host.dataset.b3; v.mode = host.dataset.b3Mode || 'pose';
    v.row = v.mode === 'row'; v.free = v.mode === 'hero';
    v.cv = host.querySelector('.b3__c'); v.ctx = v.cv.getContext('2d');
    const base = BASE[v.mode] == null ? -0.3 : BASE[v.mode];
    v.items = v.row ? D.chips.map((c, i) => new Item((1.5 - i) * 0.17)) : [new Item(base)];
    v.on = false; v.dirty = true; v.drawn = false; v.w = v.h = 0;
    v.phase = views.length * 1.7; v.inside = false; v.hold = 0; v.held = null; v.back = false; v.deg = -1;
    v.zone = host.closest('a, .card') || host; /* the card, link or band the bag sits in */
    const link = host.closest('a');

    /* which bag is under the pointer: always the one bag, or one of the four in the row */
    const pick = (e) => {
      if (!v.row) return v.items[0];
      const r = v.cv.getBoundingClientRect();
      return v.items[clamp(Math.floor(((e.clientX - r.left) / r.width) * 4), 0, 3)];
    };

    /* drag: turn and tilt */
    let px = 0, py = 0, pt = 0, pid = null, travelled = 0, swallow = false;
    v.cv.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      const it = pick(e);
      v.held = it; it.dragging = true; it.turn = null; it.vel = 0;
      pid = e.pointerId; px = e.clientX; py = e.clientY; pt = e.timeStamp; travelled = 0; swallow = false;
      try { v.cv.setPointerCapture(pid); } catch (err) { /* a pointer that is already gone: the drag still works inside the canvas */ }
      host.classList.add('is-held');
      wake();
    });
    v.cv.addEventListener('pointermove', (e) => {
      const it = v.held;
      if (!it || e.pointerId !== pid) return;
      const dx = e.clientX - px, dy = e.clientY - py, dt = Math.max(1, e.timeStamp - pt) / 1000;
      px = e.clientX; py = e.clientY; pt = e.timeStamp;
      travelled += Math.abs(dx) + Math.abs(dy);
      it.oy += dx * 0.011;
      it.ox = clamp(it.ox + dy * 0.005, -0.55, 0.55);
      it.vel = clamp((dx * 0.011) / dt, -10, 10);
      v.dirty = true;
      wake();
    });
    const drop = (e) => {
      if (!v.held || e.pointerId !== pid) return;
      v.held.dragging = false;
      v.held = null;
      v.hold = performance.now() + 2600;
      swallow = travelled > 6; /* that was a turn, not a click */
      host.classList.remove('is-held');
      wake();
    };
    v.cv.addEventListener('pointerup', drop);
    v.cv.addEventListener('pointercancel', drop);
    v.cv.addEventListener('click', (e) => { if (swallow) { swallow = false; e.preventDefault(); e.stopPropagation(); } });
    if (link) link.addEventListener('dragstart', (e) => { e.preventDefault(); }); /* the browser's own link drag would end ours */

    /* double-click flips a bag over, where a first click would not already have followed a link */
    if (!link) v.cv.addEventListener('dblclick', (e) => {
      const it = pick(e);
      e.preventDefault();
      it.turnTo((Math.round(it.oy / Math.PI) + 1) * Math.PI, 720);
      v.hold = performance.now() + 4000;
      wake();
    });

    /* the pointer nearby: lean toward it, and remember that it is here */
    if (fine) {
      v.zone.addEventListener('pointerenter', () => { v.inside = true; });
      v.zone.addEventListener('pointermove', (e) => {
        v.inside = true;
        if (reduce() || v.held || v.row) return;
        const r = v.zone.getBoundingClientRect(), it = v.items[0];
        it.toLean = ((e.clientX - r.left) / r.width - 0.5) * 0.8;
        it.toLeanX = ((e.clientY - r.top) / r.height - 0.5) * 0.34;
        wake();
      });
      v.zone.addEventListener('pointerleave', () => {
        v.inside = false;
        v.items.forEach((it) => { it.toLean = it.toLeanX = 0; });
        wake();
      });
    }

    /* the chip page's bag is also a control: arrow keys turn it */
    if (v.free) {
      v.cv.removeAttribute('aria-hidden');
      v.cv.tabIndex = 0;
      v.cv.setAttribute('role', 'slider');
      v.cv.setAttribute('aria-label', 'Turn the bag');
      v.cv.setAttribute('aria-valuemin', '0');
      v.cv.setAttribute('aria-valuemax', '360');
      v.cv.addEventListener('keydown', (e) => {
        const it = v.items[0], step = Math.PI / 8;
        let to = null;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') to = it.oy - step;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') to = it.oy + step;
        else if (e.key === 'Home') to = Math.round(it.oy / TAU) * TAU;
        else if (e.key === 'End') to = Math.round((it.oy - Math.PI) / TAU) * TAU + Math.PI;
        if (to === null) return;
        e.preventDefault();
        it.turnTo(to, e.key.length > 4 && e.key.indexOf('Arrow') === 0 ? 180 : 520);
        wake();
      });
    }
  }
  /* the bag on stage breathes a little; the others hold still */
  View.prototype.live = function () { return (this.mode === 'seq' || this.mode === 'hero') && !reduce() && !testing; };
  View.prototype.step = function (dt, now) {
    const v = this;
    if (!v.on || !ready(v)) return false;
    const pose = v.host.__pose;
    if (pose) {
      if (pose.o < 0.01) return false;
      v.items[0].base = pose.ry;
    }
    /* with a mouse a bag settles when the pointer leaves it; on touch, a little after you let go */
    const settle = fine ? !v.inside : now > v.hold;
    let moving = false, waiting = false;
    for (let i = 0; i < v.items.length; i++) {
      const it = v.items[i];
      if (it.update(dt, now, v.free, settle)) moving = true;
      if (!v.free && !settle && Math.abs(it.oy - Math.round(it.oy / TAU) * TAU) > 0.002) waiting = !fine;
    }
    if (moving) v.dirty = true;
    if (v.free) {
      const it = v.items[0], yaw = it.base + it.oy;
      const back = Math.cos(yaw) < 0;
      if (back !== v.back) { v.back = back; v.host.dispatchEvent(new CustomEvent('b3:face', { detail: { back: back } })); }
      const deg = Math.round((((it.oy % TAU) + TAU) % TAU) * (180 / Math.PI)) % 360;
      if (deg !== v.deg) {
        v.deg = deg;
        v.cv.setAttribute('aria-valuenow', String(deg));
        v.cv.setAttribute('aria-valuetext', back ? 'Back of the bag' : 'Front of the bag');
      }
    }
    const live = v.live();
    if (live || v.dirty) { draw(v, now); v.dirty = false; }
    return moving || live || waiting;
  };

  let raf = 0, last = 0;
  function loop(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    let again = false;
    for (let i = 0; i < views.length; i++) if (views[i].step(dt, now)) again = true;
    if (again) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function refresh() { views.forEach((v) => { v.dirty = true; }); wake(); }

  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { const v = byHost.get(e.target); if (v) { v.on = e.isIntersecting; if (v.on) v.dirty = true; } });
    wake();
  }, { rootMargin: '240px 0px' });
  hosts.forEach((h) => {
    const v = new View(h);
    views.push(v);
    byHost.set(h, v);
    /* under ?sync (a hidden test tab) the observer never reports, so every bag counts as on screen */
    if (testing) v.on = true; else io.observe(h);
  });
  root.addEventListener('resize', refresh);

  /* ───────── the label: the drawing, front then back, as textures ───────── */
  const TW = ART.label.px, TH = Math.round((TW * ART.label.h) / ART.label.w);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  function wear(mat, canvas) {
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = aniso;
    mat.map = t;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  }
  const each = (fn) => D.chips.reduce((p, c) => p.then(() => fn(c)), Promise.resolve());
  each((c) => ART.raster((css) => ART.bag(c.id, { flat: true, style: css }), TW, TH).then((cv) => {
    wear(bags[c.id].front, cv);
    bags[c.id].ready = true;
    refresh();
  })).then(() => each((c) => ART.raster((css) => ART.bagBack(c.id, { flat: true, style: css }), TW, TH).then((cv) => {
    wear(bags[c.id].back, cv);
    refresh();
  }))).then(() => {
    [].forEach.call(doc.querySelectorAll('[data-b3-turn], [data-b3-hint]'), (el) => { el.hidden = false; });
  }).catch(() => {});

  root.RC_BAG3D = {
    /* something outside changed a host's pose (home.js, on scroll) */
    poke(host) { const v = byHost.get(host); if (v) { v.dirty = true; wake(); } },
    /* turn a bag over, or back: the next half turn from wherever it is */
    turn(host) {
      const v = byHost.get(host);
      if (!v) return;
      const it = v.items[0];
      it.turnTo((Math.round(it.oy / Math.PI) + 1) * Math.PI, 720);
      v.hold = performance.now() + 4000;
      wake();
    },
    /* where a host's bag (or bags) is turned to right now: for tests and for anything that wants to follow it */
    state(host) {
      const v = byHost.get(host);
      return v ? v.items.map((it) => ({ yaw: it.yaw(), pitch: it.pitch(), turned: it.oy, spinning: Math.abs(it.vel) > 0.03 })) : null;
    },
    refresh: refresh,
  };
})(window);
