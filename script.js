/* ════════════════════════════════════════════════════════════
   PORTFOLIO — script.js
   Pleurat-inspired interactions: cursor, street walker parallax,
   scroll reveals, project accordion, stats bars, chatbot.
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ─── Custom Cursor ─── */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mouseX = -100, mouseY = -100;
  let curX = -100, curY = -100;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function loop() {
    curX = lerp(curX, mouseX, 0.18);
    curY = lerp(curY, mouseY, 0.18);
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
    requestAnimationFrame(loop);
  }

  loop();

  const interactEls = 'a, button, .project-row, .track-card, .exp-card, .street-view, .writing-featured-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactEls)) {
      cursor.style.width  = '24px';
      cursor.style.height = '24px';
      cursor.style.opacity = '0.5';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactEls)) {
      cursor.style.width  = '8px';
      cursor.style.height = '8px';
      cursor.style.opacity = '1';
    }
  });
})();


/* ─── Scroll Reveal ─── */
(function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.reveal-hero, .reveal-hero-delay, .reveal-up, .reveal-tag, .reveal-rule'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));
})();


/* ─── Nav Active Section Observer ─── */
(function initNavActive() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = ['home', 'projects', 'skills', 'experience', 'education', 'writing'];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          if (link.dataset.section === id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
})();





/* ─── Project Accordion ─── */
(function initProjectAccordion() {
  const rows = document.querySelectorAll('.project-row');

  rows.forEach(row => {
    const trigger = (e) => {
      // Avoid closing if clicking directly on a CTA link
      if (e && e.target.closest('a')) return;

      const isOpen = row.classList.contains('open');

      // Close other rows
      rows.forEach(r => {
        if (r !== row) {
          r.classList.remove('open');
          r.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current row
      if (isOpen) {
        row.classList.remove('open');
        row.setAttribute('aria-expanded', 'false');
      } else {
        row.classList.add('open');
        row.setAttribute('aria-expanded', 'true');
      }
    };

    row.addEventListener('click', trigger);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger(e);
      }
    });
  });
})();


/* ─── Stats Bars (Animate on Scroll) ─── */
(function initStatsBars() {
  const fills = document.querySelectorAll('.stat-bar-fill');
  const section = document.getElementById('stats');
  if (!section || !fills.length) return;

  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        fills.forEach(fill => {
          const target = fill.dataset.target || '60';
          fill.style.height = target + '%';
        });
        observer.unobserve(section);
      }
    });
  }, { threshold: 0.25 });

  observer.observe(section);
})();


/* ─── Chatbot AI Assistant ─── */
(function initChatbot() {
  const widget      = document.getElementById('chat-widget');
  const triggerBtn  = document.getElementById('chat-trigger-btn');
  const chatWin     = document.getElementById('chat-window');
  const closeBtn    = document.getElementById('chat-close-btn');
  const input       = document.getElementById('chat-input');
  const sendBtn     = document.getElementById('chat-send-btn');
  const messagesEl  = document.getElementById('chat-messages');

  if (!triggerBtn || !chatWin || !input || !sendBtn || !messagesEl) return;

  let isOpen = false;
  let hasGreeted = false;

  function toggleChat() {
    isOpen = !isOpen;
    chatWin.classList.toggle('open', isOpen);
    if (widget) widget.classList.toggle('is-open', isOpen);
    triggerBtn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      if (!hasGreeted) {
        appendMessage('bot', "Hello! I'm Devansh's AI portfolio assistant. Ask me anything about The Chronicle, my mobile work at Exly (YC W19), technical stack, education at KIET, articles, or full-time availability!");
        hasGreeted = true;
      }
      setTimeout(() => input.focus(), 150);
    }
  }

  triggerBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat();
  });

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}-msg`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msg.innerHTML = `
      <div class="chat-msg-content">${escapeHTML(text)}</div>
      <span class="chat-timestamp">${timeStr}</span>
    `;

    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot-msg';
    typing.id = 'typing-indicator';
    typing.innerHTML = `
      <div class="chat-msg-content typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return typing;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // Knowledge base responses
  const KB = [
    {
      patterns: [/chronicle/i, /rag/i, /document gen/i, /finite press/i, /llm app/i],
      answer: "The Chronicle (live at finitepress.com) is an automated document generation and intelligence platform Devansh developed using LLM APIs for structured content synthesis and formatting. It features a lightweight RAG pipeline with document chunking, strict system prompt constraints, function calling routines for deterministic JSON outputs, and a real-time streaming UI in React."
    },
    {
      patterns: [/kaash/i, /astrology/i, /consultation/i],
      answer: "Kaash is a live consultation platform on Google Play built by Devansh with Flutter and Dart. He engineered real-time consultation state modules, optimized list rendering pipelines for low-spec Android devices, and integrated Firebase Crashlytics for runtime diagnostics."
    },
    {
      patterns: [/mutual/i, /social/i, /chat/i, /websocket/i],
      answer: "Mutual Network is a real-time social platform on Google Play built in React Native and TypeScript with low-latency WebSockets and client-side indexed search algorithms for accelerated content discovery."
    },
    {
      patterns: [/vitals/i, /health/i, /fitness/i, /sensor/i],
      answer: "Vitals is a personal fitness activity tracker built in Flutter. It reads step and activity telemetry directly from device sensors, implements local caching for offline persistence, and visualizes historical activity trends."
    },
    {
      patterns: [/exly/i, /yc/i, /junior/i, /intern/i, /work/i, /job/i],
      answer: "Devansh works at Exly (YC W19). He started as a Software Engineering Intern (Jan 2025 – Apr 2025) and transitioned to Junior Software Engineer (Apr 2025 – August 2026). He engineers cross-platform mobile features in React Native and Flutter, integrates LLM API streaming workflows with structured JSON parsing, and extracts reusable component libraries."
    },
    {
      patterns: [/ukg/i, /kronos/i, /data/i],
      answer: "At UKG (Ultimate Kronos Group), Devansh served as Data Services Consultant I (Jul 2024 – Oct 2024), writing Python data transformation and cleaning scripts to automate quality verification workflows."
    },
    {
      patterns: [/dao/i, /studio/i],
      answer: "At Dao Studio (Dec 2023 – Jun 2024), Devansh worked as a Software Engineer Intern building cross-platform features with local caching and notification systems."
    },
    {
      patterns: [/education/i, /college/i, /university/i, /degree/i, /kiet/i, /kps/i, /school/i, /gpa/i, /cgpa/i, /marks/i, /percentage/i],
      answer: "Devansh holds a B.Tech in Computer Science and Engineering from KIET Group of Institutions (2020–2024) with a CGPA of 8.18/10. Prior to that, he completed his Higher Secondary Certificate (CBSE) at Krishna Public School with 94.2% in Class XII and 92.2% in Class X."
    },
    {
      patterns: [/article/i, /blog/i, /writing/i, /medium/i, /type error/i, /react navigation/i],
      answer: "Devansh authored 'How I Fixed React Navigation Type Errors in TypeScript (Without Losing My Mind)' published on Medium. It covers strictly typing nested stack and tab navigators without unsafe assertions and resolving type inference slowdowns."
    },
    {
      patterns: [/stack/i, /technolog/i, /skills/i, /react native/i, /flutter/i, /python/i, /typescript/i],
      answer: "Devansh's core stack includes Generative AI & LLMs (LangChain, OpenAI API, Anthropic API, RAG, Function Calling, Vector DBs), Mobile & Frontend (Flutter, React Native, React.js, Dart, TypeScript, JavaScript), and Tooling (Python, Firebase Crashlytics, WebSockets, Git)."
    },
    {
      patterns: [/github/i, /code/i, /repo/i, /repositories/i, /oss/i, /open source/i],
      answer: "You can explore Devansh's repositories and open-source code on GitHub at https://github.com/Dev-anshPandey (including The Chronicle at finite-press and Vitals)."
    },
    {
      patterns: [/linkedin/i, /connect/i, /network/i, /profile/i],
      answer: "You can connect with Devansh on LinkedIn at https://linkedin.com/in/devanshpandey87 to view his professional journey and network."
    },
    {
      patterns: [/social/i, /links/i, /elsewhere/i, /handles/i, /accounts/i],
      answer: "Devansh is active across GitHub (https://github.com/Dev-anshPandey), LinkedIn (https://linkedin.com/in/devanshpandey87), and Medium (https://medium.com/@devanshpandey87)."
    },
    {
      patterns: [/contact/i, /email/i, /phone/i, /hire/i, /available/i, /reach/i],
      answer: "Devansh is available immediately (0 days notice) for Frontend, Mobile, and Client-Side AI Engineering roles. You can email him at devanshpandey87@gmail.com, call +91 8770101343, or connect on LinkedIn (https://linkedin.com/in/devanshpandey87) and GitHub (https://github.com/Dev-anshPandey)."
    }
  ];

  function getBotResponse(userText) {
    const trimmed = userText.trim();
    if (!trimmed) return "Feel free to ask about Devansh's projects (The Chronicle, Kaash, Mutual Network), work at Exly (YC W19), skills, or education!";

    for (const item of KB) {
      for (const pattern of item.patterns) {
        if (pattern.test(trimmed)) {
          return item.answer;
        }
      }
    }

    return "Devansh is a Frontend App Developer & AI Engineer specializing in Generative AI, LLM interfaces, React Native, Flutter, and React.js. Feel free to ask about The Chronicle, Exly (YC W19), his Medium article, or his availability!";
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';

    const typingEl = showTyping();
    const delay = Math.min(700, 300 + text.length * 8);

    setTimeout(() => {
      removeTyping(typingEl);
      const reply = getBotResponse(text);
      appendMessage('bot', reply);
    }, delay);
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });
})();
