/* ==========================================================================
   Helpers
   ========================================================================== */

const $ = (s, c = document) => c.querySelector(s);
const imagePath = (n) => `assets/img/${encodeURIComponent(n)}`;
const cartKey = "hermanosJotaCart";

/* ==========================================================================
   Cart
   ========================================================================== */

function cart() {
  return JSON.parse(localStorage.getItem(cartKey) || "[]");
}

function updateCart() {
  document.querySelectorAll("[data-cart-count]").forEach((e) => {
    e.textContent = cart().length;
  });
}

/* ==========================================================================
   Layout
   ========================================================================== */

function header() {
  const el = $("[data-header]");
  if (!el) return;

  el.innerHTML = `
    <a class="brand" href="index.html">
      <img src="assets/img/logo.svg" alt="">
      <span>Hermanos Jota</span>
    </a>
    <nav class="nav" aria-label="Principal">
      <a href="index.html">Inicio</a>
      <a href="productos.html">Catálogo</a>
      <a href="contacto.html">Contacto</a>
      <a class="cart" href="productos.html" aria-label="Carrito con ${cart().length} productos">
        Carrito <span class="cart-count" data-cart-count>${cart().length}</span>
      </a>
    </nav>
  `;
}

function footer() {
  const el = $("[data-footer]");
  if (!el) return;

  el.innerHTML = `
    <div>
      <a class="brand footer-brand" href="index.html">
        <img src="assets/img/logo.svg" alt="">
        <span>Hermanos Jota</span>
      </a>
    </div>
    <div class="footer-info">
      <span>Av. San Juan 2847 · CABA</span>
      <a href="mailto:info@hermanosjota.com.ar">info@hermanosjota.com.ar</a>
      <a href="https://www.instagram.com/hermanosjota_ba/" target="_blank" rel="noopener">@hermanosjota_ba</a>
      <span>© 2026 Hermanos Jota</span>
    </div>
  `;
}

/* ==========================================================================
   Product cards
   ========================================================================== */

function card(p) {
  return `
    <article class="product-card">
      <img src="${imagePath(p.imagen)}" alt="${p.nombre}" loading="lazy" width="1024" height="1024">
      <div class="product-card__body">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <a href="producto.html?id=${p.id}">Ver pieza <span aria-hidden="true">→</span></a>
      </div>
    </article>
  `;
}

/* ==========================================================================
   Catalog
   ========================================================================== */

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
          .includes(q)
      )
    );
  });
}

function featured() {
  const grid = $("[data-featured]");
  if (grid) {
    setTimeout(() => {
      grid.innerHTML = productos.slice(0, 4).map(card).join("");
    }, 350);
  }
}

/* ==========================================================================
   Product detail
   ========================================================================== */

function detail() {
  const el = $("[data-product-detail]");
  if (!el) return;

  const p =
    productos.find((x) => x.id === new URLSearchParams(location.search).get("id")) ||
    productos[0];

  el.innerHTML = `
    <img class="product-detail__image" src="${imagePath(p.imagen)}" alt="${p.nombre}" width="1024" height="1024">
    <div class="product-detail__info">
      <p class="eyebrow">Pieza Hermanos Jota</p>
      <h1>${p.nombre}</h1>
      <p class="product-detail__description">${p.descripcion}</p>
      <p class="price-note">Precio: a consultar</p>
      <ul class="specs">
        ${Object.entries(p.detalles)
          .map(([k, v]) => `<li><strong>${k}</strong><span>${v}</span></li>`)
          .join("")}
      </ul>
      <button class="button" data-add="${p.id}">Añadir al carrito</button>
      <p class="form-message" data-cart-message aria-live="polite"></p>
    </div>
  `;

  $("[data-add]").addEventListener("click", (e) => {
    const items = cart();
    items.push(e.currentTarget.dataset.add);
    localStorage.setItem(cartKey, JSON.stringify(items));
    updateCart();
    $("[data-cart-message]").textContent = "La pieza fue añadida al carrito.";
  });
}

/* ==========================================================================
   Contact
   ========================================================================== */

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

/* ==========================================================================
   Init
   ========================================================================== */

header();
footer();
featured();
catalog();
detail();
contact();
