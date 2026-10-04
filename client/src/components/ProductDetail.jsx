import { useState } from "react";

function ProductDetail({ producto, onVolver, onAgregar }) {
  const [agregado, setAgregado] = useState(false);

  return (
    <main id="contenido" className="section">
      <a
        className="back-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onVolver();
        }}
      >
        ← Volver al catálogo
      </a>
      <article className="product-detail">
        <img
          className="product-detail__image"
          src={`/${producto.imagen}`}
          alt={producto.nombre}
          width="1024"
          height="1024"
        />
        <div className="product-detail__info">
          <p className="eyebrow">Pieza Hermanos Jota</p>
          <h1>{producto.nombre}</h1>
          <p className="product-detail__description">{producto.descripcion}</p>
          <p className="price-note">Precio: a consultar</p>
          <ul className="specs">
            {Object.entries(producto.detalles).map(([clave, valor]) => (
              <li key={clave}>
                <strong>{clave}</strong>
                <span>{valor}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="button"
            onClick={() => {
              onAgregar(producto);
              setAgregado(true);
            }}
          >
            Añadir al carrito
          </button>
          <p className="form-message" aria-live="polite">
            {agregado && "La pieza fue añadida al carrito."}
          </p>
        </div>
      </article>
    </main>
  );
}

export default ProductDetail;
