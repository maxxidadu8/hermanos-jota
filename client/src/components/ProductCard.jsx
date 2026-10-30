function ProductCard({ producto, onVerDetalle }) {
  return (
    <article className="product-card">
      <img
        src={`/${producto.imagen}`}
        alt={producto.nombre}
        width="1024"
        height="1024"
        loading="lazy"
      />
      <div className="product-card__body">
        <h3>{producto.nombre}</h3>
        <p>{producto.descripcion}</p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onVerDetalle(producto);
          }}
        >
          Ver pieza <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}

export default ProductCard;
