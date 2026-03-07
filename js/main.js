/**
 * NamxDigital — main.js
 * Self-contained: Pure Canvas 3D engine, CSS 3D transforms,
 * vanilla scroll animations, no external dependencies.
 */

'use strict';

/* ============================================================
   0. Tiny Math Utilities
   ============================================================ */
var M = {
  lerp: function(a, b, t) { return a + (b - a) * t; },
  clamp: function(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  rand: function(lo, hi) { return lo + Math.random() * (hi - lo); },

  /* Perspective projection: 3D → 2D */
  project: function(x, y, z, cx, cy, fov) {
    var scale = fov / (fov + z);
    return { x: cx + x * scale, y: cy + y * scale, scale: scale };
  },

  /* Rotate a point around X axis */
  rotX: function(y, z, a) {
    return { y: y * Math.cos(a) - z * Math.sin(a), z: y * Math.sin(a) + z * Math.cos(a) };
  },

  /* Rotate a point around Y axis */
  rotY: function(x, z, a) {
    return { x: x * Math.cos(a) + z * Math.sin(a), z: -x * Math.sin(a) + z * Math.cos(a) };
  },

  /* Rotate a point around Z axis */
  rotZ: function(x, y, a) {
    return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
  }
};

/* ============================================================
   1. PRELOADER
   ============================================================ */
(function initPreloader() {
  var preloader = document.getElementById('preloader');
  var fill      = document.getElementById('preloaderFill');
  if (!preloader || !fill) return;

  var progress = 0;
  var interval = setInterval(function() {
    progress += M.rand(4, 18);
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      fill.style.width = '100%';
      setTimeout(function() {
        preloader.classList.add('is-done');
        document.body.classList.add('loaded');
        initHeroAnimations();
      }, 500);
    } else {
      fill.style.width = progress + '%';
    }
  }, 70);
})();

/* ============================================================
   2. CUSTOM CURSOR
   ============================================================ */
(function initCursor() {
  var cursor   = document.getElementById('cursor');
  var follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;

  var mx = window.innerWidth  / 2;
  var my = window.innerHeight / 2;
  var fx = mx, fy = my;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  document.addEventListener('mousedown', function() { cursor.classList.add('is-clicking'); });
  document.addEventListener('mouseup',   function() { cursor.classList.remove('is-clicking'); });

  (function tick() {
    fx = M.lerp(fx, mx, 0.1);
    fy = M.lerp(fy, my, 0.1);
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .service-card, .work-item, [data-tilt]').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      cursor.classList.add('is-hovering');
      follower.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', function() {
      cursor.classList.remove('is-hovering');
      follower.classList.remove('is-hovering');
    });
  });
})();

/* ============================================================
   3. NAVIGATION
   ============================================================ */
(function initNav() {
  var nav    = document.getElementById('nav');
  var burger = document.getElementById('navBurger');
  var menu   = document.getElementById('mobileMenu');
  if (!nav) return;

  var lastScroll = 0;
  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 80);
    lastScroll = y;
  }, { passive: true });

  if (burger && menu) {
    burger.addEventListener('click', function() {
      burger.classList.toggle('is-open');
      menu.classList.toggle('is-open');
      document.body.style.overflow = menu.classList.contains('is-open') ? 'hidden' : '';
    });
    menu.querySelectorAll('.mobile-link').forEach(function(link) {
      link.addEventListener('click', function() {
        burger.classList.remove('is-open');
        menu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }
})();

/* ============================================================
   4. HERO 3D CANVAS ENGINE
   ============================================================ */
(function initHeroCanvas() {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H, cx, cy;

  function resize() {
    W  = canvas.width  = window.innerWidth;
    H  = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Mouse parallax ── */
  var mouse = { x: 0, y: 0 };
  var smoothMouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', function(e) {
    mouse.x = (e.clientX / W - 0.5) * 2;
    mouse.y = (e.clientY / H - 0.5) * 2;
  });

  /* ── 3D Point helper ── */
  function Point3D(x, y, z) {
    this.ox = x; this.oy = y; this.oz = z;
    this.x  = x; this.y  = y; this.z  = z;
  }

  Point3D.prototype.rotate = function(rx, ry, rz) {
    var p;
    /* X */
    p = M.rotX(this.y, this.z, rx);
    this.y = p.y; this.z = p.z;
    /* Y */
    p = M.rotY(this.x, this.z, ry);
    this.x = p.x; this.z = p.z;
    /* Z */
    p = M.rotZ(this.x, this.y, rz);
    this.x = p.x; this.y = p.y;
  };

  Point3D.prototype.project = function(fov) {
    return M.project(this.x, this.y, this.z, cx, cy, fov);
  };

  /* ── Icosahedron vertices ── */
  var PHI = (1 + Math.sqrt(5)) / 2;
  function makeIco(r) {
    var verts = [
      new Point3D( 0,  1,  PHI), new Point3D( 0, -1,  PHI), new Point3D( 0,  1, -PHI), new Point3D( 0, -1, -PHI),
      new Point3D( 1,  PHI, 0), new Point3D(-1,  PHI, 0), new Point3D( 1, -PHI, 0), new Point3D(-1, -PHI, 0),
      new Point3D( PHI, 0,  1), new Point3D(-PHI, 0,  1), new Point3D( PHI, 0, -1), new Point3D(-PHI, 0, -1)
    ];
    verts.forEach(function(v) {
      var l = Math.sqrt(v.ox*v.ox + v.oy*v.oy + v.oz*v.oz);
      v.ox = v.x = v.ox / l * r;
      v.oy = v.y = v.oy / l * r;
      v.oz = v.z = v.oz / l * r;
    });
    return verts;
  }

  var ICO_EDGES = [
    [0,1],[0,4],[0,5],[0,8],[0,9],
    [1,6],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,5],[2,10],[2,11],
    [3,6],[3,7],[3,10],[3,11],
    [4,5],[4,8],[4,10],
    [5,9],[5,11],
    [6,7],[6,8],[6,10],
    [7,9],[7,11],
    [8,10],[9,11]
  ];

  /* ── Torus-like ring ── */
  function makeRing(R, r, segsR, segsr) {
    var verts = [];
    for (var i = 0; i < segsR; i++) {
      var theta = (i / segsR) * Math.PI * 2;
      for (var j = 0; j < segsr; j++) {
        var phi = (j / segsr) * Math.PI * 2;
        var x = (R + r * Math.cos(phi)) * Math.cos(theta);
        var y = (R + r * Math.cos(phi)) * Math.sin(theta);
        var z = r * Math.sin(phi);
        verts.push(new Point3D(x, y, z));
      }
    }
    return { verts: verts, segsR: segsR, segsr: segsr };
  }

  var ring1 = makeRing(120, 8, 80, 12);
  var ring2 = makeRing(90, 5, 60, 8);
  var ring3 = makeRing(160, 4, 100, 8);

  /* ── Central Icosahedron ── */
  var ico1 = { verts: makeIco(80), rot: { x: 0, y: 0, z: 0 } };
  var ico2 = { verts: makeIco(140), rot: { x: 0, y: 0, z: 0 } };

  /* ── Small floating shapes ── */
  var floaters = [];
  var FLOATER_COUNT = 20;
  for (var fi = 0; fi < FLOATER_COUNT; fi++) {
    var size = M.rand(10, 30);
    floaters.push({
      verts: makeIco(size),
      pos:  { x: M.rand(-300, 300), y: M.rand(-200, 200), z: M.rand(-100, 100) },
      rot:  { x: M.rand(0, Math.PI * 2), y: M.rand(0, Math.PI * 2), z: 0 },
      speed: { x: M.rand(0.003, 0.015), y: M.rand(0.002, 0.012), z: M.rand(0.001, 0.008) },
      floatAmp: M.rand(20, 60),
      floatSpeed: M.rand(0.3, 0.8),
      floatOffset: M.rand(0, Math.PI * 2),
      alpha: M.rand(0.3, 0.7)
    });
  }

  /* ── Particles — reduce count on lower-end devices ── */
  var PARTICLE_COUNT = window.devicePixelRatio < 2 && navigator.hardwareConcurrency < 4 ? 250 : 600;
  var particles = [];
  for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
    var theta2 = Math.random() * Math.PI * 2;
    var phi2   = Math.acos(2 * Math.random() - 1);
    var rad    = M.rand(180, 320);
    particles.push({
      x: rad * Math.sin(phi2) * Math.cos(theta2),
      y: rad * Math.sin(phi2) * Math.sin(theta2),
      z: rad * Math.cos(phi2),
      size: M.rand(0.5, 2.5),
      alpha: M.rand(0.2, 0.9),
      twinkleSpeed: M.rand(0.5, 2.0),
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }

  /* ── Draw helpers ── */
  var GOLD   = '#c9a84c';
  var GOLD_L = '#e8c96e';
  var GOLD_D = 'rgba(201,168,76,';
  var FOV    = 500;

  function setStroke(alpha, width, color) {
    ctx.globalAlpha = M.clamp(alpha, 0, 1);
    ctx.strokeStyle = color || GOLD;
    ctx.lineWidth   = width || 0.5;
  }

  function drawEdges(verts, edges, alpha, width) {
    if (alpha <= 0) return;
    ctx.beginPath();
    setStroke(alpha, width);
    edges.forEach(function(e) {
      var a = verts[e[0]].project(FOV);
      var b = verts[e[1]].project(FOV);
      if (a.scale < 0.01 || b.scale < 0.01) return;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawVerts(verts, r, alpha) {
    if (alpha <= 0) return;
    verts.forEach(function(v) {
      var p = v.project(FOV);
      if (p.scale < 0.01) return;
      ctx.beginPath();
      ctx.globalAlpha = alpha * p.scale;
      ctx.fillStyle   = GOLD_L;
      ctx.arc(p.x, p.y, r * p.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawRing(ring, alpha) {
    if (alpha <= 0) return;
    var verts = ring.verts;
    var segsR = ring.segsR;
    var segsr = ring.segsr;
    ctx.beginPath();
    setStroke(alpha, 0.4);
    for (var i = 0; i < segsR; i++) {
      for (var j = 0; j < segsr; j++) {
        var idx  = i * segsr + j;
        var next = ((i + 1) % segsR) * segsr + j;
        var a = verts[idx].project(FOV);
        var b = verts[next].project(FOV);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawParticles(rx, ry) {
    particles.forEach(function(p) {
      /* apply same scene rotation */
      var yr  = M.rotY(p.x, p.z, ry);
      var xr  = M.rotX(yr.x !== undefined ? p.y : p.y, yr.z, rx);
      var prj = M.project(yr.x, xr.y, xr.z, cx, cy, FOV);
      if (prj.scale < 0.1) return;
      var twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 * p.twinkleSpeed + p.twinkleOffset);
      var a = p.alpha * twinkle * prj.scale;
      ctx.beginPath();
      ctx.globalAlpha = M.clamp(a, 0, 1);
      ctx.fillStyle   = GOLD_L;
      ctx.arc(prj.x, prj.y, p.size * prj.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ── State ── */
  var rotX = 0, rotY = 0, rotZ = 0;
  var scrollY = 0;
  window.addEventListener('scroll', function() { scrollY = window.scrollY; }, { passive: true });

  /* ── Main loop ── */
  var startTime = Date.now();
  var frameCount = 0;
  var lastFpsCheck = Date.now();
  var isLowPerf = false;

  (function frame() {
    requestAnimationFrame(frame);

    /* Skip heavy rendering when hero is well out of view */
    if (scrollY > window.innerHeight * 1.2) return;

    var t     = (Date.now() - startTime) * 0.001;
    var alpha = 1 - (scrollY / (window.innerHeight * 0.8));
    alpha = M.clamp(alpha, 0, 1);

    /* Smooth mouse */
    smoothMouse.x = M.lerp(smoothMouse.x, mouse.x, 0.04);
    smoothMouse.y = M.lerp(smoothMouse.y, mouse.y, 0.04);

    /* Global rotation */
    rotX = t * 0.06 + smoothMouse.y * 0.25;
    rotY = t * 0.10 + smoothMouse.x * 0.30;
    rotZ = t * 0.03;

    /* Clear */
    ctx.clearRect(0, 0, W, H);

    /* Background glow */
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.6);
    grd.addColorStop(0, 'rgba(201,168,76,0.04)');
    grd.addColorStop(1, 'rgba(5,5,7,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    /* ── Rotate all verts ── */
    function rotateVerts(verts) {
      verts.forEach(function(v) {
        v.x = v.ox; v.y = v.oy; v.z = v.oz;
        v.rotate(rotX, rotY, rotZ);
      });
    }

    rotateVerts(ico1.verts);
    rotateVerts(ico2.verts);

    /* Ring rotations (offset) */
    ring1.verts.forEach(function(v) {
      v.x = v.ox; v.y = v.oy; v.z = v.oz;
      v.rotate(rotX * 0.5 + t * 0.1, rotY, 0);
    });
    ring2.verts.forEach(function(v) {
      v.x = v.ox; v.y = v.oy; v.z = v.oz;
      v.rotate(rotX, rotY * 0.7 - t * 0.08, rotZ);
    });
    ring3.verts.forEach(function(v) {
      v.x = v.ox; v.y = v.oy; v.z = v.oz;
      v.rotate(rotX * 0.3 + Math.PI / 2, rotY - t * 0.05, 0);
    });

    /* ── Draw ── */
    /* Particles */
    drawParticles(rotX, rotY);

    /* Rings */
    drawRing(ring3, 0.12 * alpha);
    drawRing(ring1, 0.25 * alpha);
    drawRing(ring2, 0.18 * alpha);

    /* Outer ico wireframe */
    drawEdges(ico2.verts, ICO_EDGES, 0.18 * alpha, 0.5);
    drawVerts(ico2.verts, 1.5, 0.3 * alpha);

    /* Inner ico solid-ish */
    drawEdges(ico1.verts, ICO_EDGES, 0.7 * alpha, 1.5);
    drawVerts(ico1.verts, 3, 0.8 * alpha);

    /* Central glow */
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    glow.addColorStop(0, 'rgba(201,168,76,0.15)');
    glow.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.globalAlpha = (0.4 + 0.2 * Math.sin(t * 0.8)) * alpha;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    /* Floaters */
    floaters.forEach(function(f) {
      var dy = f.floatAmp * Math.sin(t * f.floatSpeed + f.floatOffset);
      f.rot.x += f.speed.x;
      f.rot.y += f.speed.y;
      f.rot.z += f.speed.z;

      f.verts.forEach(function(v) {
        v.x = v.ox + f.pos.x;
        v.y = v.oy + f.pos.y + dy;
        v.z = v.oz + f.pos.z;
        /* Rotate around own center */
        var p;
        p = M.rotX(v.y - (f.pos.y + dy), v.z - f.pos.z, f.rot.x);
        v.y = p.y + f.pos.y + dy; v.z = p.z + f.pos.z;
        p = M.rotY(v.x - f.pos.x, v.z - f.pos.z, f.rot.y);
        v.x = p.x + f.pos.x; v.z = p.z + f.pos.z;
        /* Apply global rotation */
        v.rotate(rotX, rotY, 0);
      });

      drawEdges(f.verts, ICO_EDGES, f.alpha * 0.5 * alpha, 0.6);
      drawVerts(f.verts, 1, f.alpha * 0.6 * alpha);
    });
  })();
})();

/* ============================================================
   5. CONTACT CANVAS
   ============================================================ */
(function initContactCanvas() {
  var canvas = document.getElementById('contactCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    var parent = canvas.parentElement;
    W = canvas.width  = parent.offsetWidth;
    H = canvas.height = parent.offsetHeight || 600;
  }
  resize();
  window.addEventListener('resize', resize);

  var GRID = 16;
  var spacing;
  var pts = [];

  function buildGrid() {
    spacing = Math.min(W, H) / GRID;
    pts = [];
    for (var xi = 0; xi <= GRID; xi++) {
      for (var yi = 0; yi <= GRID; yi++) {
        pts.push({
          x: xi * spacing + (W - GRID * spacing) / 2,
          y: yi * spacing + (H - GRID * spacing) / 2,
          phase: Math.random() * Math.PI * 2,
          amp: M.rand(8, 25),
          speed: M.rand(0.4, 1.2)
        });
      }
    }
  }
  buildGrid();
  window.addEventListener('resize', buildGrid);

  var t0 = Date.now();

  (function frame() {
    var t = (Date.now() - t0) * 0.001;
    ctx.clearRect(0, 0, W, H);

    var COLS = GRID + 1;
    ctx.strokeStyle = 'rgba(201,168,76,0.08)';
    ctx.lineWidth   = 0.5;

    /* Horizontal lines */
    for (var yi = 0; yi <= GRID; yi++) {
      ctx.beginPath();
      for (var xi = 0; xi <= GRID; xi++) {
        var p = pts[xi * COLS + yi];
        var py = p.y + p.amp * Math.sin(t * p.speed + p.phase);
        if (xi === 0) ctx.moveTo(p.x, py);
        else          ctx.lineTo(p.x, py);
      }
      ctx.stroke();
    }

    /* Dots */
    pts.forEach(function(p) {
      var py = p.y + p.amp * Math.sin(t * p.speed + p.phase);
      var a  = 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase));
      ctx.beginPath();
      ctx.globalAlpha = a;
      ctx.fillStyle   = '#c9a84c';
      ctx.arc(p.x, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  })();
})();

/* ============================================================
   6. HERO ANIMATIONS (called after preloader)
   ============================================================ */
function initHeroAnimations() {
  /* Tag */
  animateIn('.hero-tag',   0.2, 0.8);
  /* Title words */
  var words = document.querySelectorAll('.hero-line .word');
  words.forEach(function(w, i) {
    animateIn(w, 0.4 + i * 0.15, 1, true);
  });
  /* Sub */
  animateIn('.hero-sub',    0.9, 0.8);
  /* Actions */
  animateIn('.hero-actions', 1.0, 0.8);
  /* Scroll indicator */
  animateIn('.hero-scroll-indicator', 1.3, 0.8);
  /* Stats */
  animateIn('.hero-stats', 1.2, 0.8);
}

function animateIn(target, delay, duration, clipReveal) {
  var els = typeof target === 'string' ? document.querySelectorAll(target) : [target];
  els.forEach(function(el) {
    if (!el) return;
    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.style.transform  = clipReveal ? 'translateY(100%)' : 'translateY(30px)';
    setTimeout(function() {
      el.style.transition = 'opacity ' + duration + 's cubic-bezier(0.16,1,0.3,1), transform ' + duration + 's cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, delay * 1000);
  });
}

/* ============================================================
   7. INTERSECTION OBSERVER — SCROLL REVEALS
   ============================================================ */
(function initScrollReveals() {
  if (!window.IntersectionObserver) return;

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-scroll-reveal]').forEach(function(el) {
    obs.observe(el);
  });

  /* Service cards stagger */
  var cards = document.querySelectorAll('.service-card');
  var cardObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var idx = parseInt(el.getAttribute('data-card-idx') || '0', 10);
      setTimeout(function() {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0) rotateX(0)';
      }, idx * 100);
      cardObs.unobserve(el);
    });
  }, { threshold: 0.1 });

  cards.forEach(function(card, i) {
    card.setAttribute('data-card-idx', i % 3);
    card.style.opacity   = '0';
    card.style.transform = 'translateY(50px) rotateX(15deg)';
    card.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
    cardObs.observe(card);
  });

  /* Process steps stagger */
  var steps = document.querySelectorAll('.process-step');
  var stepObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el  = entry.target;
      var idx = parseInt(el.getAttribute('data-step-idx') || '0', 10);
      setTimeout(function() {
        el.style.opacity   = '1';
        el.style.transform = 'translateX(0)';
      }, idx * 150);
      stepObs.unobserve(el);
    });
  }, { threshold: 0.1 });

  steps.forEach(function(step, i) {
    step.setAttribute('data-step-idx', i);
    step.style.opacity   = '0';
    step.style.transform = 'translateX(-30px)';
    step.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
    stepObs.observe(step);
  });

  /* Testimonials stagger */
  var tCards = document.querySelectorAll('.testimonial-card');
  var tObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el  = entry.target;
      var idx = parseInt(el.getAttribute('data-t-idx') || '0', 10);
      setTimeout(function() {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0) scale(1)';
      }, idx * 120);
      tObs.unobserve(el);
    });
  }, { threshold: 0.1 });

  tCards.forEach(function(card, i) {
    card.setAttribute('data-t-idx', i);
    card.style.opacity   = '0';
    card.style.transform = 'translateY(40px) scale(0.97)';
    card.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
    tObs.observe(card);
  });

  /* Work items */
  var workItems = document.querySelectorAll('.work-item');
  var wObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0) rotateX(0)';
      wObs.unobserve(entry.target);
    });
  }, { threshold: 0.05 });

  workItems.forEach(function(item) {
    item.style.opacity   = '0';
    item.style.transform = 'translateY(60px) rotateX(8deg)';
    item.style.transition = 'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)';
    wObs.observe(item);
  });
})();

/* ============================================================
   8. COUNT-UP NUMBERS
   ============================================================ */
(function initCountUp() {
  if (!window.IntersectionObserver) return;

  var counters = document.querySelectorAll('.count-up');
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el     = entry.target;
      var target = parseInt(el.getAttribute('data-target'), 10);
      var start  = Date.now();
      var duration = 2400;

      obs.unobserve(el);

      (function tick() {
        var progress = Math.min((Date.now() - start) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3); /* cubic ease-out */
        el.textContent = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(tick);
      })();
    });
  }, { threshold: 0.5 });

  counters.forEach(function(c) { obs.observe(c); });
})();

/* ============================================================
   9. MAGNETIC BUTTONS
   ============================================================ */
(function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(function(el) {
    el.addEventListener('mousemove', function(e) {
      var rect = el.getBoundingClientRect();
      var dx   = e.clientX - (rect.left + rect.width  / 2);
      var dy   = e.clientY - (rect.top  + rect.height / 2);
      el.style.transform    = 'translate(' + dx * 0.35 + 'px, ' + dy * 0.35 + 'px)';
      el.style.transition   = 'transform 0.25s ease-out';
    });
    el.addEventListener('mouseleave', function() {
      el.style.transform  = '';
      el.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
    });
  });
})();

/* ============================================================
   10. CARD 3D TILT
   ============================================================ */
(function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(function(card) {
    card.style.transformStyle     = 'preserve-3d';
    card.style.willChange         = 'transform';

    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x    = (e.clientX - rect.left) / rect.width  - 0.5;
      var y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transition = 'transform 0.2s ease-out';
      card.style.transform  = 'perspective(800px) rotateX(' + (-y * 12) + 'deg) rotateY(' + (x * 12) + 'deg) scale3d(1.02,1.02,1.02)';
    });

    card.addEventListener('mouseleave', function() {
      card.style.transition = 'transform 0.5s ease-out';
      card.style.transform  = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    });
  });
})();

/* ============================================================
   11. SCROLL PARALLAX (hero + global)
   ============================================================ */
(function initParallax() {
  var heroContent = document.querySelector('.hero-content');
  var heroCanvas  = document.getElementById('heroCanvas');
  var orb1 = document.querySelector('.orb-1');
  var orb2 = document.querySelector('.orb-2');

  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    var H = window.innerHeight;

    /* Hero content fade + rise */
    if (heroContent) {
      var progress = y / H;
      heroContent.style.transform = 'translateY(' + (y * 0.4) + 'px)';
      heroContent.style.opacity   = String(Math.max(0, 1 - progress * 1.6));
    }

    /* Hero canvas subtle move */
    if (heroCanvas) {
      heroCanvas.style.transform = 'translateY(' + (y * 0.2) + 'px)';
    }

    /* Orbs parallax */
    if (orb1) orb1.style.transform = 'translate(' + (y * 0.05) + 'px, ' + (-y * 0.1) + 'px)';
    if (orb2) orb2.style.transform = 'translateY(' + (-y * 0.06) + 'px)';

  }, { passive: true });
})();

/* ============================================================
   12. SMOOTH SCROLL for anchor links
   ============================================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var id  = a.getAttribute('href');
      var el  = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   13. CONTACT FORM
   ============================================================ */
(function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn   = form.querySelector('.btn-primary');
    var inner = btn ? btn.querySelector('.btn-inner') : null;
    if (!inner) return;

    var orig = inner.textContent;
    inner.textContent    = 'Sending…';
    btn.style.pointerEvents = 'none';

    setTimeout(function() {
      inner.textContent    = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg,#2d6a4f,#40916c)';

      setTimeout(function() {
        inner.textContent    = orig;
        btn.style.background = '';
        btn.style.pointerEvents = '';
        form.reset();
      }, 3000);
    }, 1500);
  });
})();

/* ============================================================
   14. NUMBERS SECTION — wavy animation on scroll
   ============================================================ */
(function initNumbersParallax() {
  var items = document.querySelectorAll('.number-item');
  if (!items.length) return;

  var section = document.querySelector('.numbers');
  if (!section) return;

  window.addEventListener('scroll', function() {
    var rect     = section.getBoundingClientRect();
    var progress = 1 - (rect.bottom / (window.innerHeight + rect.height));
    items.forEach(function(item, i) {
      var wave = Math.sin(progress * Math.PI * 2 + i * 0.8) * 15;
      item.style.transform = 'translateY(' + wave + 'px)';
    });
  }, { passive: true });
})();

/* ============================================================
   15. TICKER CLONE for infinite scroll
   ============================================================ */
(function initTicker() {
  var track = document.getElementById('tickerTrack');
  if (!track) return;
  var clone = track.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.parentElement.appendChild(clone);
})();
