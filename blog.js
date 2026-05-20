const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const filterButtons = document.querySelectorAll("[data-blog-filter]");
const articles = document.querySelectorAll(".blog-article");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.getAttribute("data-blog-filter") || "all";
    filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    articles.forEach((article) => {
      const ac = article.getAttribute("data-category") || "";
      const show = cat === "all" || ac === cat;
      article.hidden = !show;
    });
  });
});
