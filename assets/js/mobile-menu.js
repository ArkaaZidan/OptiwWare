(() => {
  const app = document.querySelector(".app-container");
  const sidebar = document.getElementById("app-sidebar");
  const toggle = document.querySelector(".mobile-menu-toggle");

  if (!app || !sidebar || !toggle) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");

  function setMenuOpen(isOpen) {
    const shouldOpen = mobileQuery.matches && isOpen;
    app.classList.toggle("menu-open", shouldOpen);
    toggle.setAttribute("aria-expanded", String(shouldOpen));
    toggle.setAttribute(
      "aria-label",
      shouldOpen ? "Tutup menu navigasi" : "Buka menu navigasi",
    );
    sidebar.setAttribute(
      "aria-hidden",
      String(mobileQuery.matches && !shouldOpen),
    );
    sidebar.inert = mobileQuery.matches && !shouldOpen;
  }

  toggle.addEventListener("click", () => {
    setMenuOpen(!app.classList.contains("menu-open"));
  });

  app.addEventListener("click", (event) => {
    if (event.target === app && app.classList.contains("menu-open")) {
      setMenuOpen(false);
    }
  });

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && app.classList.contains("menu-open")) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  function syncMenuForViewport() {
    if (!mobileQuery.matches) {
      app.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Buka menu navigasi");
      sidebar.removeAttribute("aria-hidden");
      sidebar.inert = false;
      return;
    }

    setMenuOpen(false);
  }

  mobileQuery.addEventListener("change", syncMenuForViewport);
  syncMenuForViewport();
})();
