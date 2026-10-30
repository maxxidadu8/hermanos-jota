import ProductCard from "./ProductCard.jsx";

// Muestra la grilla de productos o el estado de la petición (carga / error).
function ProductList({ productos, cargando, error, onReintentar, onVerDetalle, mensajeVacio = "Todavía no hay productos en el catálogo." }) {
  if (cargando) {
    return <p className="estado" role="status">Cargando piezas…</p>;
  }

  if (error) {
    return (
      <div className="estado estado--error" role="alert">
        <p>{error}</p>
        <button type="button" className="button" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    );
  }

  if (productos.length === 0) {
    return <p className="estado" role="status">{mensajeVacio}</p>;
  }

  return (
    <div className="product-grid">
      {productos.map((producto) => (
        <ProductCard key={producto._id} producto={producto} onVerDetalle={onVerDetalle} />
      ))}
    </div>
  );
}

export default ProductList;
