(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Menu season tabs */
  var tabs = document.querySelectorAll(".menu-tabs button");
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".menu-season").forEach(function (s) {
          s.classList.toggle("is-active", s.id === tab.dataset.target);
        });
        var cats = document.getElementById("cats-" + tab.dataset.target);
        document.querySelectorAll(".menu-cats").forEach(function (c) {
          c.hidden = c !== cats;
        });
      });
    });
  }

  /* Gallery filter */
  var filterBtns = document.querySelectorAll(".gallery-filters button");
  var photos = document.querySelectorAll(".photo-grid figure");
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        var cat = btn.dataset.filter;
        photos.forEach(function (fig) {
          var show = cat === "all" || fig.dataset.cat === cat;
          fig.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* Lightbox */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox && photos.length) {
    var lbImg = lightbox.querySelector("img");
    var lbCaption = lightbox.querySelector(".lightbox-caption");
    var visible = [];
    var current = 0;

    function openAt(index) {
      visible = Array.prototype.filter.call(photos, function (f) { return f.style.display !== "none"; });
      current = visible.indexOf(photos[index]) >= 0 ? visible.indexOf(photos[index]) : 0;
      show();
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function show() {
      var fig = visible[current];
      if (!fig) return;
      var full = fig.querySelector("img").getAttribute("src");
      lbImg.src = full;
      lbImg.alt = fig.querySelector("img").alt || "";
      lbCaption.textContent = fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent : "";
    }
    function close() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    photos.forEach(function (fig, i) {
      fig.addEventListener("click", function () { openAt(i); });
    });
    lightbox.querySelector(".lightbox-close").addEventListener("click", close);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
    lightbox.querySelector(".lightbox-prev").addEventListener("click", function () {
      current = (current - 1 + visible.length) % visible.length;
      show();
    });
    lightbox.querySelector(".lightbox-next").addEventListener("click", function () {
      current = (current + 1) % visible.length;
      show();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") { current = (current - 1 + visible.length) % visible.length; show(); }
      if (e.key === "ArrowRight") { current = (current + 1) % visible.length; show(); }
    });
  }

  /* Footer year */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
