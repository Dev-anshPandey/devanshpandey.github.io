document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // Scroll progress bar & active link update
    const progressBar = document.getElementById('progressBar');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        // Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';

        // Navbar solid bg on scroll
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // --- GSAP Animations ---
    gsap.registerPlugin(ScrollTrigger);

    // Initial Hero Animation
    const heroTl = gsap.timeline();

    heroTl.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2
    })
    .from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, "-=0.6")
    .from('.hero-description', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, "-=0.6")
    .from('.social-link', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    }, "-=0.4");

    // Parallax Effect for Hero Background
    gsap.to('.hero-bg-layer', {
        yPercent: 50,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Setup global ScrollTrigger defaults
    ScrollTrigger.defaults({
        toggleActions: "play none none reverse",
    });

    // Reveal standard sections smoothly
    gsap.utils.toArray('.gs-reveal').forEach(function(elem) {
        // Set to visible right before animating to prevent flash
        gsap.set(elem, {autoAlpha: 1});
        
        gsap.from(elem, {
            scrollTrigger: {
                trigger: elem,
                start: "top 85%",
            },
            opacity: 0,
            y: 40,
            duration: 1,
            ease: "power3.out"
        });
    });

    // Staggered Up Reveals (Cards, Skills, Highlights)
    const staggerUpSections = [
        { container: '.about-highlights', elements: '.gs-reveal-up' },
        { container: '.projects-grid', elements: '.gs-reveal-up' },
        { container: '.education-grid', elements: '.gs-reveal-up' },
        { container: '.certifications-grid', elements: '.gs-reveal-up' },
        { container: '.skills-grid', elements: '.gs-reveal-up' }
    ];

    staggerUpSections.forEach(section => {
        const container = document.querySelector(section.container);
        if (container) {
            const elements = container.querySelectorAll(section.elements);
            if(elements.length > 0) {
                 gsap.set(elements, {autoAlpha: 1});
                 gsap.from(elements, {
                    scrollTrigger: {
                        trigger: container,
                        start: "top 80%"
                    },
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "power2.out"
                });
            }
        }
    });

    // Timeline staggered left reveal
    const timelineContainer = document.querySelector('.timeline');
    if(timelineContainer) {
        const timelineItems = timelineContainer.querySelectorAll('.gs-reveal-left');
        gsap.set(timelineItems, {autoAlpha: 1});
        gsap.from(timelineItems, {
            scrollTrigger: {
                trigger: timelineContainer,
                start: "top 75%"
            },
            x: -50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out"
        });
    }
});