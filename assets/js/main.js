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

  /* Menu tabs (location + season) — each .menu-tabs group is scoped by data-group,
     so switching one group (e.g. location) never touches another group's tabs/panels. */
  document.querySelectorAll(".menu-tabs[data-group]").forEach(function (tabGroup) {
    var groupName = tabGroup.dataset.group;
    var tabs = tabGroup.querySelectorAll("button");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll('.menu-season[data-group="' + groupName + '"]').forEach(function (s) {
          s.classList.toggle("is-active", s.id === tab.dataset.target);
        });
        var cats = document.getElementById("cats-" + tab.dataset.target);
        document.querySelectorAll('.menu-cats[data-group="' + groupName + '"]').forEach(function (c) {
          c.hidden = c !== cats;
        });
      });
    });
  });

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

  /* ---------------------------------------------------------------------
     E-shop: cart + checkout (client-side demo — no real payment/shipping
     yet, order "submission" just shows a confirmation summary).
  --------------------------------------------------------------------- */
  var productGrid = document.querySelector(".product-grid");
  if (productGrid) {
    var CART_KEY = "mitte-cart";
    var money = function (n) { return n.toLocaleString("cs-CZ") + " Kč"; };

    function loadCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
      catch (e) { return []; }
    }
    function saveCart(cart) {
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }

    var cartBody = document.querySelector("[data-cart-body]");
    var cartEmpty = document.querySelector("[data-cart-empty]");
    var cartTable = document.querySelector("[data-cart-table]");
    var cartCountEls = document.querySelectorAll("[data-cart-count]");
    var subtotalEl = document.querySelector("[data-cart-subtotal]");
    var deliveryEl = document.querySelector("[data-cart-delivery]");
    var totalEl = document.querySelector("[data-cart-total]");
    var deliveryInputs = document.querySelectorAll('input[name="delivery"]');
    var checkoutForm = document.querySelector("[data-checkout-form]");
    var orderConfirm = document.querySelector("[data-order-confirm]");
    var confirmSummary = document.querySelector("[data-confirm-summary]");
    var pickupField = document.querySelector("[data-pickup-field]");

    function selectedDeliveryPrice() {
      var checked = document.querySelector('input[name="delivery"]:checked');
      return checked ? parseFloat(checked.dataset.price) : 0;
    }

    function render() {
      var cart = loadCart();
      var count = cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
      cartCountEls.forEach(function (el) { el.textContent = count; });

      if (!cartBody) return;
      cartBody.innerHTML = "";
      if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = "block";
        if (cartTable) cartTable.style.display = "none";
      } else {
        if (cartEmpty) cartEmpty.style.display = "none";
        if (cartTable) cartTable.style.display = "table";
        cart.forEach(function (item) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            '<td><div class="cart-name">' + item.name + '</div><div class="cart-origin">' + item.origin + '</div></td>' +
            '<td><div class="qty-stepper">' +
              '<button type="button" data-qty-minus="' + item.id + '" aria-label="Snížit množství">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-qty-plus="' + item.id + '" aria-label="Zvýšit množství">+</button>' +
            '</div></td>' +
            '<td class="cart-linetotal">' + money(item.price * item.qty) + '</td>' +
            '<td><button type="button" class="cart-remove" data-remove="' + item.id + '">Odebrat</button></td>';
          cartBody.appendChild(tr);
        });
      }

      var subtotal = cart.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
      var delivery = cart.length ? selectedDeliveryPrice() : 0;
      if (subtotalEl) subtotalEl.textContent = money(subtotal);
      if (deliveryEl) deliveryEl.textContent = cart.length ? money(delivery) : "—";
      if (totalEl) totalEl.textContent = money(subtotal + delivery);
    }

    productGrid.querySelectorAll(".add-to-cart").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".product-card");
        var id = card.dataset.id;
        var cart = loadCart();
        var existing = cart.find(function (i) { return i.id === id; });
        if (existing) { existing.qty += 1; }
        else {
          cart.push({
            id: id,
            name: card.dataset.name,
            origin: card.dataset.origin,
            price: parseFloat(card.dataset.price),
            qty: 1
          });
        }
        saveCart(cart);
        render();
        btn.dataset.added = "true";
        var original = btn.textContent;
        btn.textContent = "Přidáno ✓";
        setTimeout(function () { btn.dataset.added = "false"; btn.textContent = original; }, 1200);
      });
    });

    if (cartBody) {
      cartBody.addEventListener("click", function (e) {
        var cart = loadCart();
        var plusId = e.target.getAttribute("data-qty-plus");
        var minusId = e.target.getAttribute("data-qty-minus");
        var removeId = e.target.getAttribute("data-remove");
        if (plusId) {
          var pi = cart.find(function (i) { return i.id === plusId; });
          if (pi) pi.qty += 1;
        } else if (minusId) {
          var mi = cart.find(function (i) { return i.id === minusId; });
          if (mi) { mi.qty -= 1; if (mi.qty <= 0) cart = cart.filter(function (i) { return i.id !== minusId; }); }
        } else if (removeId) {
          cart = cart.filter(function (i) { return i.id !== removeId; });
        } else {
          return;
        }
        saveCart(cart);
        render();
      });
    }

    deliveryInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        if (pickupField) pickupField.classList.toggle("hidden", input.value !== "zasilkovna");
        render();
      });
    });

    if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var cart = loadCart();
        if (cart.length === 0) { return; }
        var delivery = document.querySelector('input[name="delivery"]:checked');
        var name = checkoutForm.querySelector('[name="customer-name"]').value;
        var email = checkoutForm.querySelector('[name="customer-email"]').value;
        var subtotal = cart.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
        var deliveryPrice = delivery ? parseFloat(delivery.dataset.price) : 0;

        if (confirmSummary) {
          var lines = cart.map(function (i) { return i.qty + '× ' + i.name + ' — ' + money(i.price * i.qty); }).join("<br>");
          confirmSummary.innerHTML =
            '<p><strong>Jméno:</strong> ' + name + '<br><strong>E-mail:</strong> ' + email + '</p>' +
            '<p style="margin-top:12px;">' + lines + '</p>' +
            '<p style="margin-top:12px;"><strong>Doprava:</strong> ' + (delivery ? delivery.closest(".delivery-option").querySelector(".dname").textContent : "—") + '</p>' +
            '<p style="margin-top:12px; font-weight:700;">Celkem: ' + money(subtotal + deliveryPrice) + '</p>';
        }
        if (orderConfirm) {
          orderConfirm.classList.add("is-visible");
          orderConfirm.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        checkoutForm.reset();
        saveCart([]);
        render();
      });
    }

    render();
  }
})();
