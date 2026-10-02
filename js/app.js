const $ = (s, c = document) => c.querySelector(s);
// Los textos se insertan con textContent, nunca como HTML.
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function productImage(p, className, size = 1024) {
  const img = element("img", className);
  // Solo se permiten archivos de la carpeta local con nombres seguros.
  if (/^assets\/img\/[a-z0-9_]+\.png$/.test(p.imagen)) img.src = p.imagen;
  img.alt = p.nombre;
  img.width = size;
  img.height = size;
  return img;
}
const cartKey = "hermanosJotaCart";
function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(cartKey) || "[]");
    return Array.isArray(items)
      ? items.filter((id) => productos.some((p) => p.id === id))
      : [];
  } catch {
    return [];
  }
}
function setCart(ids) {
  const active = document.activeElement;
  const drawer = $("[data-cart-drawer]");
  const action = active?.dataset && Object.entries(active.dataset)
    .find(([key]) => ["qtyPlus", "qtyMinus", "remove", "cartClear"].includes(key));
  localStorage.setItem(cartKey, JSON.stringify(ids));
  updateCart();
  renderCart();
  if (drawer?.contains(active) || (action && drawer && !drawer.hidden)) {
    const next = action && [...drawer.querySelectorAll("button")]
      .find((button) => button.dataset[action[0]] === action[1]);
    (next || $("[data-cart-close]"))?.focus();
  }
}
function cartCount() {
  return getCart().length;
}
function groupedCart() {
  const counts = getCart().reduce((m, id) => {
    m[id] = (m[id] || 0) + 1;
    return m;
  }, {});
  return Object.entries(counts)
    .map(([id, qty]) => {
      const p = productos.find((x) => x.id === id);
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean);
}
function addItem(id) {
  const items = getCart();
  items.push(id);
  setCart(items);
}
function setQty(id, qty) {
  const others = getCart().filter((x) => x !== id);
  const n = Math.max(0, Number(qty) || 0);
  setCart(n ? others.concat(Array(n).fill(id)) : others);
}
function removeItem(id) {
  setCart(getCart().filter((x) => x !== id));
}
function clearCart() {
  setCart([]);
}
function updateCart() {
  const n = cartCount();
  document
    .querySelectorAll("[data-cart-count]")
    .forEach((e) => (e.textContent = n));
  document
    .querySelectorAll("[data-cart-open]")
    .forEach((e) => e.setAttribute("aria-label", `Carrito con ${n} productos`));
}
function header() {
  const el = $("[data-header]");
  if (!el) return;
  // Esta plantilla contiene únicamente HTML fijo escrito por nosotros.
  el.innerHTML = `<a class="brand" href="index.html"><img src="assets/img/logo.svg" alt=""><span>Hermanos Jota</span></a><button type="button" class="menu-toggle" data-menu-toggle aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú"><span aria-hidden="true">☰</span></button><nav id="menu-principal" class="nav" aria-label="Principal"><a href="index.html">Inicio</a><a href="productos.html">Catálogo</a><a href="contacto.html">Contacto</a><button type="button" class="cart" data-cart-open aria-haspopup="dialog" aria-controls="carrito" aria-label="Carrito con 0 productos">Carrito <span class="cart-count" data-cart-count aria-live="polite">0</span></button></nav>`;
  updateCart();
  if (!$("[data-cart-drawer]"))
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="cart-overlay" data-cart-overlay hidden></div><aside id="carrito" class="cart-drawer" data-cart-drawer hidden role="dialog" aria-modal="true" aria-labelledby="cart-title"><div class="cart-drawer__head"><h2 id="cart-title">Tu pedido</h2><button type="button" class="cart-drawer__close" data-cart-close aria-label="Cerrar carrito">×</button></div><div class="cart-drawer__body" data-cart-list></div><div class="cart-drawer__foot" data-cart-foot></div></aside>`,
    );
}
function footer() {
  const el = $("[data-footer]");
  if (!el) return;
  el.innerHTML = `<div><a class="brand footer-brand" href="index.html"><img src="assets/img/logo.svg" alt=""><span>Hermanos Jota</span></a></div><div class="footer-info"><span>Av. San Juan 2847 · CABA</span><a href="mailto:info@hermanosjota.com.ar">info@hermanosjota.com.ar</a><a href="https://www.instagram.com/hermanosjota_ba/" target="_blank" rel="noopener">@hermanosjota_ba</a><span>© 2026 Hermanos Jota</span></div>`;
}
function mobileMenu() {
  const toggle = $("[data-menu-toggle]");
  const nav = $("#menu-principal");
  if (!toggle || !nav) return;
  const mobile = window.matchMedia("(max-width: 759px)");
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.hidden = mobile.matches && !open;
  };
  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) setOpen(false);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-header]")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
  mobile.addEventListener("change", () => {
    const hadFocus = nav.contains(document.activeElement);
    setOpen(false);
    if (mobile.matches && hadFocus) toggle.focus();
  });
  setOpen(false);
}
function card(p) {
  const article = element("article", "product-card");
  const img = productImage(p);
  img.loading = "lazy";
  const body = element("div", "product-card__body");
  const link = element("a", "", "Ver pieza ");
  link.href = `producto.html?id=${encodeURIComponent(p.id)}`;
  const arrow = element("span", "", "→");
  arrow.setAttribute("aria-hidden", "true");
  link.append(arrow);
  body.append(element("h3", "", p.nombre), element("p", "", p.descripcion), link);
  article.append(img, body);
  return article;
}
function catalog() {
  const grid = $("[data-products]");
  if (!grid) return;
  const results = $("[data-results]");
  const search = $("[data-search]");
  const render = () => {
    const q = search.value.trim().toLowerCase();
    const items = productos.filter((p) =>
      (p.nombre + p.descripcion + Object.values(p.detalles).join(" "))
        .toLowerCase().includes(q),
    );
    grid.replaceChildren(...items.map(card));
    results.textContent = `${items.length} ${items.length === 1 ? "pieza encontrada" : "piezas encontradas"}`;
  };
  setTimeout(render, 350);
  search.addEventListener("input", render);
}
function featured() {
  const grid = $("[data-featured]");
  if (grid) setTimeout(() => grid.replaceChildren(...productos.slice(0, 4).map(card)), 350);
}
function detail() {
  const el = $("[data-product-detail]");
  if (!el) return;
  const p = productos.find((x) => x.id === new URLSearchParams(location.search).get("id")) || productos[0];
  const info = element("div", "product-detail__info");
  const specs = element("ul", "specs");
  for (const [key, value] of Object.entries(p.detalles)) {
    const li = element("li");
    li.append(element("strong", "", key), element("span", "", value));
    specs.append(li);
  }
  const button = element("button", "button", "Añadir al carrito");
  button.type = "button";
  button.dataset.add = p.id;
  const message = element("p", "form-message");
  message.dataset.cartMessage = "";
  message.setAttribute("aria-live", "polite");
  info.append(
    element("p", "eyebrow", "Pieza Hermanos Jota"),
    element("h1", "", p.nombre),
    element("p", "product-detail__description", p.descripcion),
    element("p", "price-note", "Precio: a consultar"), specs, button, message,
  );
  el.replaceChildren(productImage(p, "product-detail__image"), info);
  button.addEventListener("click", () => {
    addItem(p.id);
    message.textContent = "La pieza fue añadida al carrito.";
  });
}
function contact() {
  const form = $("[data-contact]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = $("[data-form-message]");
    if (!form.checkValidity()) {
      message.textContent = "Completá los campos requeridos con datos válidos.";
      form.reportValidity();
      return;
    }
    message.textContent = "Gracias por escribirnos. Tu consulta fue enviada.";
    form.reset();
  });
}
function openCart() {
  const overlay = $("[data-cart-overlay]");
  const drawer = $("[data-cart-drawer]");
  if (!drawer) return;
  overlay.hidden = false;
  drawer.hidden = false;
  document.body.classList.add("cart-open");
  $("[data-cart-close]")?.focus();
}
function closeCart() {
  const overlay = $("[data-cart-overlay]");
  const drawer = $("[data-cart-drawer]");
  if (!drawer || drawer.hidden) return;
  overlay.hidden = true;
  drawer.hidden = true;
  document.body.classList.remove("cart-open");
  if (location.hash === "#carrito")
    history.replaceState(null, "", location.pathname + location.search);
  const opener = $("#menu-principal")?.hidden
    ? $("[data-menu-toggle]")
    : $("[data-cart-open]");
  opener?.focus();
}
function renderCart() {
  const list = $("[data-cart-list]");
  const foot = $("[data-cart-foot]");
  if (!list || !foot) return;
  const items = groupedCart();
  const n = cartCount();
  if (!items.length) {
    list.innerHTML = `<div class="cart-empty"><p>Todavía no hay piezas en tu pedido.</p><a class="text-link" href="productos.html" data-cart-close>Ver el catálogo</a></div>`;
    foot.replaceChildren();
    return;
  }
  list.replaceChildren(...items.map((p) => {
    const article = element("article", "cart-item");
    const info = element("div", "cart-item__info");
    const actions = element("div", "cart-item__actions");
    const qty = element("div", "qty");
    qty.setAttribute("role", "group");
    qty.setAttribute("aria-label", `Cantidad de ${p.nombre}`);
    const minus = element("button", "", "−");
    minus.type = "button";
    minus.dataset.qtyMinus = p.id;
    minus.setAttribute("aria-label", `Restar ${p.nombre}`);
    const plus = element("button", "", "+");
    plus.type = "button";
    plus.dataset.qtyPlus = p.id;
    plus.setAttribute("aria-label", `Sumar ${p.nombre}`);
    qty.append(minus, element("span", "", p.qty), plus);
    const remove = element("button", "cart-item__remove", "Quitar");
    remove.type = "button";
    remove.dataset.remove = p.id;
    actions.append(qty, remove);
    info.append(element("h3", "", p.nombre), element("p", "", "Precio a consultar"), actions);
    article.append(productImage(p, "", 80), info);
    return article;
  }));
  const summary = element("p", "cart-summary", `${n} ${n === 1 ? "pieza" : "piezas"} · precio a consultar`);
  const actions = element("div", "cart-drawer__actions");
  const clear = element("button", "button button--ghost", "Vaciar");
  clear.type = "button";
  clear.dataset.cartClear = "";
  const contactLink = element("a", "button", "Solicitar consulta");
  contactLink.href = "contacto.html";
  actions.append(clear, contactLink);
  foot.replaceChildren(summary, actions);
}
function cartDrawer() {
  renderCart();
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cart-open]")) {
      e.preventDefault();
      openCart();
      return;
    }
    if (
      e.target.closest("[data-cart-overlay]") ||
      e.target.closest("[data-cart-close]")
    ) {
      closeCart();
      return;
    }
    const plus = e.target.closest("[data-qty-plus]");
    if (plus) {
      const id = plus.dataset.qtyPlus;
      const item = groupedCart().find((x) => x.id === id);
      setQty(id, (item?.qty || 0) + 1);
      return;
    }
    const minus = e.target.closest("[data-qty-minus]");
    if (minus) {
      const id = minus.dataset.qtyMinus;
      const item = groupedCart().find((x) => x.id === id);
      setQty(id, (item?.qty || 1) - 1);
      return;
    }
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      removeItem(remove.dataset.remove);
      return;
    }
    if (e.target.closest("[data-cart-clear]")) clearCart();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
    const drawer = $("[data-cart-drawer]");
    if (e.key !== "Tab" || !drawer || drawer.hidden) return;
    const controls = [...drawer.querySelectorAll("a[href], button:not([disabled])")];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!drawer.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) {
      e.preventDefault();
      (e.shiftKey ? last : first)?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  });
  if (location.hash === "#carrito") openCart();
}
header();
mobileMenu();
footer();
featured();
catalog();
detail();
contact();
cartDrawer();
