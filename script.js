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
})();
