// Footer year
document.querySelectorAll('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Header background ("Breeze"): sparse, slow wind streamlines circling a storm, like a live wind map.
(function drawBreeze() {
  const host = document.querySelector('.hero-art');
  if (!host) return;
  const c = document.createElement('canvas');
  c.className = 'breeze-art';
  host.appendChild(c);
  const ctx = c.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, cx = 0, cy = 0, R = 90, color = '', alpha = 0.28, width = 1, parts = [], frame = 0, visible = true;
  const spawn = () => ({ x: Math.random() * w, y: Math.random() * h, life: 60 + Math.random() * 160 });
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = host.clientWidth; h = host.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = w < 720;
    cx = narrow ? w * 0.95 : w * 0.8; cy = narrow ? h * 0.15 : h * 0.45;
    R = Math.min(w, h) * 0.14;
    parts = Array.from({ length: Math.min(420, Math.round((w * h) / 2200)) }, spawn);
  };
  // Vortex: speed rises to the radius of max winds, then decays; slight inflow and westward drift
  const field = (x, y) => {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) || 1;
    const v = (r < R ? r / R : Math.pow(R / r, 0.55)) * 1.5;
    return [(dy / r) * v - (dx / r) * v * 0.25 - 0.15, (-dx / r) * v - (dy / r) * v * 0.25];
  };
  const step = () => {
    // re-read the color now and then so it follows the light/dark toggle;
    // light mode gets stronger, slightly thicker lines so they stand out on the pale background
    if (frame++ % 60 === 0) {
      color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const dark = document.documentElement.dataset.theme === 'dark';
      alpha = dark ? 0.28 : 0.55;
      width = dark ? 1 : 1.3;
    }
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.045)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width;
    ctx.beginPath();
    for (const p of parts) {
      const [vx, vy] = field(p.x, p.y);
      const nx = p.x + vx, ny = p.y + vy;
      ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (--p.life < 0 || nx < -10 || ny < -10 || nx > w + 10 || ny > h + 10 || Math.hypot(nx - cx, ny - cy) < R * 0.2) Object.assign(p, spawn());
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  resize();
  window.addEventListener('resize', resize);
  if (reduceMotion) {
    for (let i = 0; i < 160; i++) step(); // draw one still frame
  } else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host); // pause when scrolled away
    const loop = () => { if (visible) step(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
})();

// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }
  });
}

// Dark / light toggle (light by default; remembers your choice)
document.querySelectorAll('.theme-toggle').forEach((btn) => btn.addEventListener('click', () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
}));

// Highlight the nav link for the section on screen
const navLinks = [...document.querySelectorAll('.nav-links a')];
if (navLinks.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => observer.observe(s));
}

