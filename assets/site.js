const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const basePath = window.MONKLAND_BASE || "";
const productIndex = window.MONKLAND_PRODUCTS || {};
const searchIndex = window.MONKLAND_INDEX || [];
const cartKey = "monkland-redesign-cart";

initNavigation();
initHeaderBehavior();
initReveal();
initParallax();
initScrollProgress();
initPointerSurfaces();
initMagneticButtons();
initPageTransitions();
initFilters();
initCart();
initSearch();

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("is-nav-open");
    document.body.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      document.body.classList.remove("is-nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initHeaderBehavior() {
  const header = document.querySelector("[data-header]");
  if (!header || prefersReducedMotion) return;
  let lastY = window.scrollY;

  window.addEventListener("scroll", () => {
    const nextY = window.scrollY;
    header.classList.toggle("is-hidden", nextY > 420 && nextY > lastY);
    lastY = nextY;
  }, { passive: true });
}

function initReveal() {
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length) return;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
    observer.observe(item);
  });
}

function initParallax() {
  const layers = [...document.querySelectorAll(".parallax")];
  if (!layers.length || prefersReducedMotion) return;

  let ticking = false;
  const update = () => {
    const viewport = window.innerHeight;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0.04);
      const rect = layer.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - viewport / 2;
      layer.style.transform = `translate3d(0, ${centerOffset * depth * -1}px, 0)`;
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

function initScrollProgress() {
  if (prefersReducedMotion) return;
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  const update = () => {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    progress.style.transform = `scaleX(${Math.min(window.scrollY / max, 1)})`;
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initPointerSurfaces() {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
  const surfaces = document.querySelectorAll(".product-card, .collection-card, .stage-panel, .subhero-object, .product-orbit");
  surfaces.forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const strength = surface.classList.contains("product-card") || surface.classList.contains("collection-card") ? 3.4 : 2.2;
      surface.style.setProperty("--pointer-x", x.toFixed(3));
      surface.style.setProperty("--pointer-y", y.toFixed(3));
      surface.style.setProperty("--tilt-x", `${(-y * strength).toFixed(2)}deg`);
      surface.style.setProperty("--tilt-y", `${(x * strength).toFixed(2)}deg`);
    });
    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--pointer-x", "0");
      surface.style.setProperty("--pointer-y", "0");
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
    });
  });
}

function initMagneticButtons() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

function initPageTransitions() {
  if (prefersReducedMotion) return;
  const wipe = document.createElement("div");
  wipe.className = "page-wipe";
  wipe.setAttribute("aria-hidden", "true");
  document.body.append(wipe);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    if (url.href === window.location.href) return;

    event.preventDefault();
    wipe.style.setProperty("--wipe-x", `${event.clientX}px`);
    wipe.style.setProperty("--wipe-y", `${event.clientY}px`);
    wipe.classList.add("is-active");
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 300);
  });
}

function initFilters() {
  const bar = document.querySelector("[data-filter-bar]");
  const grid = document.querySelector("[data-product-grid]");
  if (!bar || !grid) return;

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;

    bar.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
    grid.querySelectorAll(".product-card").forEach((card, index) => {
      const visible = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !visible);
      if (visible) {
        card.style.transitionDelay = `${Math.min(index, 8) * 28}ms`;
        window.setTimeout(() => {
          card.style.transitionDelay = "";
        }, 420);
      }
    });
  });
}

function initCart() {
  updateCartCount();

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");
    if (!addButton) return;
    const slug = addButton.dataset.product;
    if (!productIndex[slug]) return;
    const cart = readCart();
    cart[slug] = (cart[slug] || 0) + 1;
    writeCart(cart);
    updateCartCount();
    renderCart();
    showToast(`${productIndex[slug].name} added to basket`);
  });

  document.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-cart-action]");
    if (!quantityButton) return;
    const slug = quantityButton.dataset.product;
    const action = quantityButton.dataset.cartAction;
    const cart = readCart();
    if (action === "increase") cart[slug] = (cart[slug] || 0) + 1;
    if (action === "decrease") cart[slug] = Math.max((cart[slug] || 0) - 1, 0);
    if (action === "remove" || cart[slug] === 0) delete cart[slug];
    writeCart(cart);
    updateCartCount();
    renderCart();
  });

  renderCart();
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey) || "{}");
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function updateCartCount() {
  const count = Object.values(readCart()).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = String(count);
  });
}

function renderCart() {
  const target = document.querySelector("[data-cart-items]");
  if (!target) return;

  const cart = readCart();
  const entries = Object.entries(cart).filter(([slug]) => productIndex[slug]);
  if (!entries.length) {
    target.innerHTML = `<div class="cart-row"><div><h2>Your basket is quiet.</h2><p>Explore the counter and add a few pieces.</p><a class="button button-ghost" href="${withBase("/c/our-cheeses/")}">Shop cheeses</a></div></div>`;
    setCartTotal(0);
    return;
  }

  let total = 0;
  target.innerHTML = entries.map(([slug, quantity]) => {
    const product = productIndex[slug];
    const amount = Number(product.priceAmount || priceToNumber(product.price));
    total += amount * quantity;
    return `<article class="cart-row">
      <img src="${product.image}" alt="">
      <div>
        <p class="eyebrow">${product.category}</p>
        <h2><a href="${product.href}">${product.name}</a></h2>
        <p>${product.price} / ${product.availability || "Counter item"}</p>
      </div>
      <div>
        <div class="quantity-controls" aria-label="Quantity controls">
          <button type="button" data-cart-action="decrease" data-product="${slug}" aria-label="Decrease ${product.name}">-</button>
          <strong>${quantity}</strong>
          <button type="button" data-cart-action="increase" data-product="${slug}" aria-label="Increase ${product.name}">+</button>
        </div>
        <button class="remove-item" type="button" data-cart-action="remove" data-product="${slug}">Remove</button>
      </div>
    </article>`;
  }).join("");
  setCartTotal(total);
}

function setCartTotal(total) {
  document.querySelectorAll("[data-cart-total]").forEach((item) => {
    item.textContent = currency(total);
  });
}

function priceToNumber(price) {
  const match = String(price || "").replace(",", "").match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function currency(amount) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

function showToast(message) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function initSearch() {
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  if (!input || !results) return;

  const render = () => {
    const query = input.value.trim().toLowerCase();
    const matches = searchIndex
      .filter((item) => !query || item.search.toLowerCase().includes(query) || item.title.toLowerCase().includes(query))
      .slice(0, 18);

    results.innerHTML = matches.map((item) => `<a class="search-result reveal is-visible" href="${item.href}">
      ${item.image ? `<img src="${item.image}" alt="">` : "<div></div>"}
      <div>
        <span>${item.type} / ${item.category}</span>
        <h2>${highlight(item.title, query)}</h2>
      </div>
      <strong>${item.price || "View"}</strong>
    </a>`).join("") || `<p>No results yet. Try cheese, cafe, tour, hamper or biscuit.</p>`;
  };

  input.addEventListener("input", render);
  render();
  input.focus({ preventScroll: true });
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${escaped})`, "ig"), "<mark>$1</mark>");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function withBase(href) {
  if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return href;
  const clean = href.startsWith("/") ? href : `/${href}`;
  if (!basePath) return clean;
  if (clean === "/") return `${basePath}/`;
  return `${basePath}${clean}`.replace(/\/{2,}/g, "/");
}
