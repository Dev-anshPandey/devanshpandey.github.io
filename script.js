/**
 * script.js
 * Intro particle → name formation animation,
 * Interactive constellation background,
 * Scroll reveals, nav interactions, mobile menu.
 */

document.addEventListener('DOMContentLoaded', () => {




  // Background canvas hidden per preference
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    bgCanvas.style.display = 'none';
  }


  // ═══════════════════════════════════════════════════════════
  // 3. NAVIGATION — Active section tracking
  // ═══════════════════════════════════════════════════════════
  const navBtns = document.querySelectorAll('.nav-desktop .nav-btn, .nav-mobile-menu .nav-btn');
  const sectionIds = ['home', 'projects', 'skills', 'services', 'experience', 'certifications', 'education', 'writing', 'contact'];

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sectionId = btn.getAttribute('data-section');
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu) mobileMenu.classList.remove('open');
    });
  });

  function updateActiveNav() {
    let current = 'home';
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 150) current = id;
      }
    }
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-section') === current);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();


  // ═══════════════════════════════════════════════════════════
  // 4. MOBILE MENU TOGGLE
  // ═══════════════════════════════════════════════════════════
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }


  // ═══════════════════════════════════════════════════════════
  // 5. SCROLL REVEAL (Intersection Observer)
  // ═══════════════════════════════════════════════════════════
  const revealElements = document.querySelectorAll('.reveal');
  const revealChildren = document.querySelectorAll('.reveal-children');

  // Initially hide
  revealElements.forEach(el => el.classList.add('scroll-hidden'));
  revealChildren.forEach(parent => {
    Array.from(parent.children).forEach(child => {
      child.classList.add('scroll-hidden');
    });
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('scroll-hidden');
        entry.target.classList.add('scroll-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));

  const childObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = Array.from(entry.target.children);
        children.forEach((child, i) => {
          setTimeout(() => {
            child.classList.remove('scroll-hidden');
            child.classList.add('scroll-visible');
          }, i * 80);
        });
        childObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealChildren.forEach(el => childObserver.observe(el));

});
