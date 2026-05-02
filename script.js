/**
 * Minimalist Constellation Network (High-Visibility & Retina-Safe)
 */
function buildMinimalNetwork(canvas, options) {
  const cfg = Object.assign({
    particleCount: 65,       
    maxDistance: 150,        
    mouseDistance: 200,      
    baseColor: '192, 57, 43',// Theme red
    particleSize: 2,         // Slightly larger dots
    speed: 0.35              
  }, options);

  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d');
  
  let cssWidth, cssHeight;

  // Retina-safe resize function
  function resize() {
    cssWidth = canvas.offsetWidth;
    cssHeight = canvas.offsetHeight;
    
    // Set actual canvas size multiplied by device pixel ratio
    canvas.width  = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  // Track mouse position
  const mouse = { x: -1000, y: -1000 };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Particle Class
  class Particle {
    constructor() {
      this.x = Math.random() * cssWidth;
      this.y = Math.random() * cssHeight;
      this.vx = (Math.random() - 0.5) * cfg.speed;
      this.vy = (Math.random() - 0.5) * cfg.speed;
      this.radius = Math.random() * cfg.particleSize + 1; // Brighter dots
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around screen edges smoothly
      if (this.x < 0) this.x = cssWidth;
      if (this.x > cssWidth) this.x = 0;
      if (this.y < 0) this.y = cssHeight;
      if (this.y > cssHeight) this.y = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cfg.baseColor}, 0.8)`; // High opacity
      ctx.fill();
    }
  }

  const particles = [];
  for (let i = 0; i < cfg.particleCount; i++) {
    particles.push(new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale context for Retina displays
    ctx.save();
    ctx.scale(dpr, dpr);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();

      // Connect to other particles
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cfg.maxDistance) {
          // Opacity fades as they get further apart
          const alpha = (1 - dist / cfg.maxDistance) * 0.65; // Brighter lines
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${cfg.baseColor}, ${alpha})`;
          ctx.lineWidth = 1.2; // Thicker lines
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // Connect to mouse
      const mouseDx = particles[i].x - mouse.x;
      const mouseDy = particles[i].y - mouse.y;
      const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

      if (mouseDist < cfg.mouseDistance) {
        // Subtle magnetic pull to the mouse
        particles[i].x -= mouseDx * 0.02;
        particles[i].y -= mouseDy * 0.02;

        // Draw line to mouse
        const mouseAlpha = (1 - mouseDist / cfg.mouseDistance) * 0.8;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${cfg.baseColor}, ${mouseAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }

      particles[i].draw();
    }

    ctx.restore();
    requestAnimationFrame(draw);
  }

  draw();
}

// Initialize on load
window.addEventListener('load', () => {
  const heroCanvas    = document.getElementById('globe-hero');
  const contactCanvas = document.getElementById('globe-contact');

  if (heroCanvas) {
    buildMinimalNetwork(heroCanvas, {
      particleCount: 80,
      maxDistance: 140,
      speed: 0.35
    });
  }
  
  if (contactCanvas) {
    buildMinimalNetwork(contactCanvas, {
      particleCount: 50,
      maxDistance: 120,
      speed: 0.25
    });
  }
});

// Scroll fade-in observer
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));