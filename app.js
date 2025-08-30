// Portfolio Website JavaScript - Light Theme

document.addEventListener('DOMContentLoaded', function() {
    // Navigation elements
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile Navigation Toggle
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active navigation link highlighting
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const correspondingNavLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active class from all nav links
                navLinks.forEach(link => link.classList.remove('active'));
                // Add active class to current section's nav link
                if (correspondingNavLink) {
                    correspondingNavLink.classList.add('active');
                }
            }
        });
    }

    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Initial call to set active link
    updateActiveNavLink();

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add fade-in class to elements and observe them
    const animatedElements = document.querySelectorAll('.timeline-item, .project-card, .education-card, .certification-card, .about-highlights .highlight');
    
    animatedElements.forEach((element, index) => {
        element.classList.add('fade-in');
        // Add delay for staggered animation
        element.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(element);
    });

    // Smooth reveal for hero section
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-description, .social-links');
    heroElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        element.style.transitionDelay = `${index * 0.2}s`;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    });

    // Add click effect to project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add a subtle click animation
            this.style.transform = 'translateY(-4px) scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'translateY(-4px) scale(1)';
            }, 150);
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Allow closing mobile menu with Escape key
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // Add focus management for accessibility
    navLinks.forEach(link => {
        link.addEventListener('focus', function() {
            // Ensure focused nav links are visible when using keyboard navigation
            if (navMenu.classList.contains('active') === false && window.innerWidth <= 768) {
                navMenu.classList.add('active');
            }
        });
    });

    // Add resize event listener to handle responsive changes
    window.addEventListener('resize', function() {
        // Close mobile menu when resizing to desktop
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
        
        // Recalculate active nav link position
        updateActiveNavLink();
    });

    // Initialize tooltips for social links
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function(e) {
            const icon = this.querySelector('i');
            let tooltip = '';
            
            if (icon.classList.contains('fa-linkedin')) {
                tooltip = 'Connect on LinkedIn';
            } else if (icon.classList.contains('fa-github')) {
                tooltip = 'View GitHub Profile';
            } else if (icon.classList.contains('fa-envelope')) {
                tooltip = 'Send Email';
            }
            
            // Set tooltip as title attribute
            this.setAttribute('title', tooltip);
        });
    });

    // Add loading animation for page
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        
        // Add a subtle entrance animation to the entire page
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });

    // Performance optimization: Throttle scroll events
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Apply throttling to scroll events
    const throttledScrollHandler = throttle(function() {
        updateActiveNavLink();
        
        // Navbar scroll effect
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, 10);

    window.addEventListener('scroll', throttledScrollHandler);

    // Add smooth hover effects to cards
    const cards = document.querySelectorAll('.highlight, .timeline-content, .project-card, .education-card, .certification-card, .skill-tag');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });

    // Add typing effect for hero subtitle (subtle enhancement)
    function addTypingEffect() {
        const subtitle = document.querySelector('.hero-subtitle');
        const text = subtitle.textContent;
        subtitle.textContent = '';
        
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        
        // Start typing after hero animation
        setTimeout(typeWriter, 800);
    }

    // Initialize typing effect
    addTypingEffect();

    // Add parallax effect to hero section (subtle)
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const rate = scrolled * -0.5;
        
        if (hero && scrolled < hero.offsetHeight) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    }

    window.addEventListener('scroll', throttle(updateParallax, 10));

    // Add staggered animation to skill tags
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach((tag, index) => {
        tag.style.opacity = '0';
        tag.style.transform = 'translateY(20px)';
        tag.style.transition = 'all 0.4s ease';
        tag.style.transitionDelay = `${index * 0.1}s`;
        
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.5 });
        
        skillObserver.observe(tag);
    });

    // Add click to copy email functionality
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) {
        emailLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = 'devanshpandey87@gmail.com';
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(email).then(() => {
                    showTemporaryMessage('Email copied to clipboard!');
                }).catch(() => {
                    // Fallback to opening email client
                    window.location.href = `mailto:${email}`;
                });
            } else {
                // Fallback to opening email client
                window.location.href = `mailto:${email}`;
            }
        });
    }

    // Show temporary message function
    function showTemporaryMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--color-primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageElement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageElement.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 3000);
    }
});