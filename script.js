"use strict";

// All essential content, project details, and contact links work without JavaScript.
(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navigation");
  const mobile = window.matchMedia("(max-width: 620px)");
  document.documentElement.classList.add("js-nav");
  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };
  const syncMenu = () => {
    menuButton.hidden = !mobile.matches;
    closeMenu();
  };
  syncMenu();
  mobile.addEventListener("change", syncMenu);
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".site-header") &&
      menuButton.getAttribute("aria-expanded") === "true"
    )
      closeMenu();
  });

  const filters = document.querySelector(".filters");
  const projects = [...document.querySelectorAll(".project")];
  filters.hidden = false;
  filters.addEventListener("click", (event) => {
    const selected = event.target.closest("[data-filter]");
    if (!selected) return;
    const category = selected.dataset.filter;
    filters
      .querySelectorAll("button")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button === selected)),
      );
    projects.forEach((project) => {
      project.hidden =
        category !== "all" && project.dataset.category !== category;
    });
    const count = projects.filter((project) => !project.hidden).length;
    document.querySelector("#filter-status").textContent =
      `${count} projects shown${category === "all" ? "" : category === "ai" ? ": AI engineering" : ": application engineering"}.`;
  });

  const copyButton = document.querySelector(".copy-email");
  const copyStatus = document.querySelector(".copy-status");
  let copyTimer;
  if (navigator.clipboard && window.isSecureContext) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      clearTimeout(copyTimer);
      try {
        await navigator.clipboard.writeText("devanshpandey87@gmail.com");
        copyStatus.textContent = "Copied.";
      } catch {
        copyStatus.textContent =
          "Please select the email address above to copy it.";
      }
      copyTimer = setTimeout(() => {
        copyStatus.textContent = "";
      }, 5000);
    });
  }

  if ("IntersectionObserver" in window) {
    const navigationLinks = [...navigation.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navigationLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${visible.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("main > section[id]")
      .forEach((section) => observer.observe(section));
  }

  // Motion is progressive: the complete portfolio remains visible without JS.
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const motionButton = document.querySelector(".motion-toggle");
  const hero = document.querySelector(".hero");
  const cloud = document.querySelector(".hero-cloud");
  const aboutSection = document.querySelector(".about");
  const featureRows = [...document.querySelectorAll(".feature-row")];
  const roleLines = [...document.querySelectorAll(".hero-line")];
  let manuallyPaused = false;
  let motionFrame = 0;
  let roleTimer = 0;
  let activeRole = 2;
  let targetX = 0,
    targetY = 0,
    pointerX = 0,
    pointerY = 0;
  const isPaused = () => manuallyPaused || reducedMotion.matches;
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const revealNodes = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 25px 0px" },
    );
    revealNodes.forEach((node, index) => {
      if (node.classList.contains("project"))
        node.style.transitionDelay = `${(index % 4) * 80}ms`;
      revealObserver.observe(node);
    });
    document.documentElement.classList.add("motion-ready");
  }

  function updateScene() {
    motionFrame = 0;
    if (isPaused() || document.hidden) return;
    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom > 0) {
      pointerX += (targetX - pointerX) * 0.075;
      pointerY += (targetY - pointerY) * 0.075;
      cloud.style.setProperty("--pointer-x", `${pointerX.toFixed(2)}px`);
      cloud.style.setProperty("--pointer-y", `${pointerY.toFixed(2)}px`);
      cloud.style.setProperty(
        "--scroll-shift",
        `${(-heroRect.top * 0.14).toFixed(1)}px`,
      );
    }
    const aboutRect = aboutSection.getBoundingClientRect();
    if (aboutRect.top < innerHeight && aboutRect.bottom > 0) {
      const progress = clamp(
        (innerHeight - aboutRect.top) / (innerHeight + aboutRect.height),
      );
      aboutSection.style.setProperty("--about-progress", progress.toFixed(3));
      aboutSection.style.setProperty(
        "--ghost-x",
        `${(-progress * 260).toFixed(1)}px`,
      );
    }
    featureRows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) {
        const progress = clamp(
          (innerHeight - rect.top) / (innerHeight + rect.height),
        );
        row.style.setProperty("--feature-progress", progress.toFixed(3));
      }
    });
    if (
      heroRect.bottom > 0 &&
      (Math.abs(targetX - pointerX) > 0.05 ||
        Math.abs(targetY - pointerY) > 0.05)
    )
      scheduleScene();
  }
  function scheduleScene() {
    if (!motionFrame && !isPaused() && !document.hidden)
      motionFrame = requestAnimationFrame(updateScene);
  }
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || event.pointerType === "touch" || isPaused())
        return;
      const rect = hero.getBoundingClientRect();
      targetX = (event.clientX / innerWidth - 0.5) * 22;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      scheduleScene();
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    scheduleScene();
  });
  addEventListener("scroll", scheduleScene, { passive: true });
  addEventListener("resize", scheduleScene, { passive: true });
  function scheduleRole() {
    clearTimeout(roleTimer);
    if (isPaused() || document.hidden) return;
    roleTimer = setTimeout(() => {
      if (hero.getBoundingClientRect().bottom > 0) {
        activeRole = (activeRole + 1) % roleLines.length;
        roleLines.forEach((line, index) =>
          line.classList.toggle("is-active", index === activeRole),
        );
      }
      scheduleRole();
    }, 2400);
  }
  function syncMotion() {
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    clearTimeout(roleTimer);
    const paused = isPaused();
    document.documentElement.dataset.motion = paused ? "paused" : "active";
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.disabled = reducedMotion.matches;
    motionButton.innerHTML = reducedMotion.matches
      ? "REDUCED MOTION"
      : paused
        ? '<span aria-hidden="true">▶</span> PLAY MOTION'
        : '<span aria-hidden="true">Ⅱ</span> PAUSE MOTION';
    if (reducedMotion.matches)
      revealNodes.forEach((node) => node.classList.add("is-visible"));
    scheduleRole();
    scheduleScene();
  }
  motionButton.hidden = false;
  motionButton.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    syncMotion();
  });
  reducedMotion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  filters.addEventListener("click", () => {
    projects
      .filter((project) => !project.hidden)
      .forEach((project) => project.classList.add("is-visible"));
    scheduleScene();
  });
  syncMotion();
})();
