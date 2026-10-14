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

  const visual = document.querySelector(".engineering-visual");
  const scene = document.querySelector("#stack-scene");
  const stack = document.querySelector("#stack-object");
  const caption = document.querySelector("#visual-caption");
  const motionButton = document.querySelector(".motion-control");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let paused = reducedMotion.matches;
  let frame = 0;
  let pointer = null;
  visual.dataset.view = "system";
  document.querySelector(".visual-controls").hidden = false;
  const resetTilt = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    pointer = null;
    stack.style.transform = "";
  };
  const syncMotion = () => {
    document.documentElement.dataset.motion = paused ? "paused" : "active";
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.disabled = reducedMotion.matches;
    motionButton.textContent = reducedMotion.matches
      ? "Reduced motion on"
      : paused
        ? "Enable motion"
        : "Pause motion";
    resetTilt();
  };
  syncMotion();
  motionButton.addEventListener("click", () => {
    paused = !paused;
    syncMotion();
  });
  reducedMotion.addEventListener("change", (event) => {
    paused = event.matches;
    syncMotion();
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      resetTilt();
      visual.dataset.view = button.dataset.view;
      document
        .querySelectorAll("[data-view]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      caption.textContent =
        button.dataset.view === "system"
          ? "Relevant context → grounded generation → a useful experience."
          : "One connected product: intelligence behind a considered interface.";
    });
  });
  scene.addEventListener("pointermove", (event) => {
    if (
      paused ||
      reducedMotion.matches ||
      !finePointer.matches ||
      event.pointerType === "touch"
    )
      return;
    pointer = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!pointer) return;
      const rect = scene.getBoundingClientRect();
      const x = Math.max(
        -1,
        Math.min(1, ((pointer.x - rect.left) / rect.width) * 2 - 1),
      );
      const y = Math.max(
        -1,
        Math.min(1, ((pointer.y - rect.top) / rect.height) * 2 - 1),
      );
      const app = visual.dataset.view === "application";
      stack.style.transform = `translateX(-50%) rotateX(${(app ? 15 : 56) - y * 4}deg) rotateZ(${(app ? -9 : -32) + x * 5}deg)`;
    });
  });
  scene.addEventListener("pointerleave", resetTilt);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetTilt();
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
})();
