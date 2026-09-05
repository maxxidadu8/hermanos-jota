const $ = (s, c = document) => c.querySelector(s);
const imagePath = (n) => n;
const cartKey = "hermanosJotaCart";
function getCart() {
  return JSON.parse(localStorage.getItem(cartKey) || "[]");
}
function setCart(ids) {
  localStorage.setItem(cartKey, JSON.stringify(ids));
  updateCart();
  renderCart();
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
  const n = cartCount();
  el.innerHTML = `<a class="brand" href="index.html"><img src="assets/img/logo.svg" alt=""><span>Hermanos Jota</span></a><nav class="nav" aria-label="Principal"><a href="index.html">Inicio</a><a href="productos.html">Catálogo</a><a href="contacto.html">Contacto</a><button type="button" class="cart" data-cart-open aria-haspopup="dialog" aria-controls="carrito" aria-label="Carrito con ${n} productos">Carrito <span class="cart-count" data-cart-count aria-live="polite">${n}</span></button></nav>`;
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
function card(p) {
  return `<article class="product-card"><img src="${imagePath(p.imagen)}" alt="${p.nombre}" loading="lazy" width="1024" height="1024"><div class="product-card__body"><h3>${p.nombre}</h3><p>${p.descripcion}</p><a href="producto.html?id=${p.id}">Ver pieza <span aria-hidden="true">→</span></a></div></article>`;
}
function catalog() {
  const grid = $("[data-products]");
  if (!grid) return;
  const results = $("[data-results]");
  const render = (items) => {
    grid.innerHTML = items.map(card).join("");
    results.textContent = `${items.length} ${items.length === 1 ? "pieza encontrada" : "piezas encontradas"}`;
  };
  setTimeout(() => render(productos), 350);
  $("[data-search]").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    render(
      productos.filter((p) =>
        (p.nombre + p.descripcion + Object.values(p.detalles).join(" "))
          .toLowerCase()
          .includes(q),
      ),
    );
  });
}
function featured() {
  const grid = $("[data-featured]");
  if (grid)
    setTimeout(
      () => (grid.innerHTML = productos.slice(0, 4).map(card).join("")),
      350,
    );
}
function detail() {
  const el = $("[data-product-detail]");
  if (!el) return;
  const p =
    productos.find(
      (x) => x.id === new URLSearchParams(location.search).get("id"),
    ) || productos[0];
  el.innerHTML = `<img class="product-detail__image" src="${imagePath(p.imagen)}" alt="${p.nombre}" width="1024" height="1024"><div class="product-detail__info"><p class="eyebrow">Pieza Hermanos Jota</p><h1>${p.nombre}</h1><p class="product-detail__description">${p.descripcion}</p><p class="price-note">Precio: a consultar</p><ul class="specs">${Object.entries(
    p.detalles,
  )
    .map(([k, v]) => `<li><strong>${k}</strong><span>${v}</span></li>`)
    .join(
      "",
    )}</ul><button class="button" data-add="${p.id}">Añadir al carrito</button><p class="form-message" data-cart-message aria-live="polite"></p></div>`;
  $("[data-add]").addEventListener("click", (e) => {
    addItem(e.currentTarget.dataset.add);
    $("[data-cart-message]").textContent = "La pieza fue añadida al carrito.";
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
  $("[data-cart-open]")?.focus();
}
function renderCart() {
  const list = $("[data-cart-list]");
  const foot = $("[data-cart-foot]");
  if (!list || !foot) return;
  const items = groupedCart();
  const n = cartCount();
  if (!items.length) {
    list.innerHTML = `<div class="cart-empty"><p>Todavía no hay piezas en tu pedido.</p><a class="text-link" href="productos.html" data-cart-close>Ver el catálogo</a></div>`;
    foot.innerHTML = "";
    return;
  }
  list.innerHTML = items
    .map(
      (p) =>
        `<article class="cart-item"><img src="${imagePath(p.imagen)}" alt="" width="80" height="80"><div class="cart-item__info"><h3>${p.nombre}</h3><p>Precio a consultar</p><div class="cart-item__actions"><div class="qty" aria-label="Cantidad de ${p.nombre}"><button type="button" data-qty-minus="${p.id}" aria-label="Restar">−</button><span>${p.qty}</span><button type="button" data-qty-plus="${p.id}" aria-label="Sumar">+</button></div><button type="button" class="cart-item__remove" data-remove="${p.id}">Quitar</button></div></div></article>`,
    )
    .join("");
  foot.innerHTML = `<p class="cart-summary">${n} ${n === 1 ? "pieza" : "piezas"} · precio a consultar</p><div class="cart-drawer__actions"><button type="button" class="button button--ghost" data-cart-clear>Vaciar</button><a class="button" href="contacto.html">Solicitar consulta</a></div>`;
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
  });
  if (location.hash === "#carrito") openCart();
}
header();
footer();
featured();
catalog();
detail();
contact();
cartDrawer();
