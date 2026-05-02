function buildGlobe(canvas, options) {
    const cfg = Object.assign({
      radius:    200,
      latLines:  14,
      lngLines:  16,
      dotRadius: 1.4,
      color:     '#c0392b',
      glowColor: 'rgba(192,57,43,0.18)',
      speed:     0.0018,
      tilt:      0.38
    }, options);
  
    const dpr = window.devicePixelRatio || 1;
  
    function resize() {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener('resize', resize);
  
    const ctx = canvas.getContext('2d');
    let angle = 0;
  
    const points = [];
    for (let lat = -90; lat <= 90; lat += 180 / cfg.latLines) {
      for (let lng = 0; lng < 360; lng += 360 / cfg.lngLines) {
        const phi   = (lat * Math.PI) / 180;
        const theta = (lng * Math.PI) / 180;
        points.push({
          x0: cfg.radius * Math.cos(phi) * Math.cos(theta),
          y0: cfg.radius * Math.sin(phi),
          z0: cfg.radius * Math.cos(phi) * Math.sin(theta)
        });
      }
    }
  
    const segments = [];
    const step = 2;
  
    for (let lat = -80; lat <= 80; lat += 180 / cfg.latLines) {
      const phi  = (lat * Math.PI) / 180;
      const ring = [];
      for (let lng = 0; lng <= 360; lng += step) {
        const theta = (lng * Math.PI) / 180;
        ring.push({
          x0: cfg.radius * Math.cos(phi) * Math.cos(theta),
          y0: cfg.radius * Math.sin(phi),
          z0: cfg.radius * Math.cos(phi) * Math.sin(theta)
        });
      }
      segments.push(ring);
    }
    for (let lng = 0; lng < 360; lng += 360 / cfg.lngLines) {
      const theta = (lng * Math.PI) / 180;
      const ring  = [];
      for (let lat = -90; lat <= 90; lat += step) {
        const phi = (lat * Math.PI) / 180;
        ring.push({
          x0: cfg.radius * Math.cos(phi) * Math.cos(theta),
          y0: cfg.radius * Math.sin(phi),
          z0: cfg.radius * Math.cos(phi) * Math.sin(theta)
        });
      }
      segments.push(ring);
    }
  
    function project(p) {
      const sinA = Math.sin(angle), cosA = Math.cos(angle);
      const sinT = Math.sin(cfg.tilt), cosT = Math.cos(cfg.tilt);
      const x1 = p.x0 * cosA - p.z0 * sinA;
      const z1 = p.x0 * sinA + p.z0 * cosA;
      const y1 = p.y0;
      const y2 = y1 * cosT - z1 * sinT;
      const z2 = y1 * sinT + z1 * cosT;
      const cx = canvas.width  / 2 / dpr;
      const cy = canvas.height / 2 / dpr;
      return { sx: cx + x1, sy: cy + y2, z: z2 };
    }
  
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
  
      const cx = canvas.width  / 2 / dpr;
      const cy = canvas.height / 2 / dpr;
  
      const grd = ctx.createRadialGradient(cx, cy, cfg.radius * 0.4, cx, cy, cfg.radius * 1.15);
      grd.addColorStop(0, cfg.glowColor);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, cfg.radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
  
      for (const ring of segments) {
        ctx.beginPath();
        let first = true;
        for (const p of ring) {
          const { sx, sy } = project(p);
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = cfg.color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth   = 0.55;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
  
      for (const p of points) {
        const { sx, sy, z } = project(p);
        const depth = (z + cfg.radius) / (2 * cfg.radius);
        const alpha = 0.12 + 0.8 * depth;
        const r     = cfg.dotRadius * (0.45 + 0.65 * depth);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle   = depth > 0.48 ? cfg.color : 'rgba(192,57,43,0.45)';
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
  
      ctx.restore();
      angle += cfg.speed;
      requestAnimationFrame(draw);
    }
  
    draw();
  }
  
  window.addEventListener('load', () => {
    const heroCanvas    = document.getElementById('globe-hero');
    const contactCanvas = document.getElementById('globe-contact');
  
    if (heroCanvas) {
      buildGlobe(heroCanvas, {
        radius:    215,
        latLines:  13,
        lngLines:  15,
        speed:     0.0015,
        glowColor: 'rgba(192,57,43,0.18)'
      });
    }
    if (contactCanvas) {
      buildGlobe(contactCanvas, {
        radius:    175,
        latLines:  12,
        lngLines:  14,
        speed:     0.002,
        glowColor: 'rgba(192,57,43,0.13)'
      });
    }
  });
  
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));