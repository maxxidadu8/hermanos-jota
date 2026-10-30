import ProductCard from "./ProductCard.jsx";

// Muestra la grilla de productos o el estado de la petición (carga / error).
function ProductList({ productos, cargando, error, onReintentar, onVerDetalle }) {
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

  return (
    <div className="product-grid">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onVerDetalle={onVerDetalle} />
      ))}
    </div>
  );
}

export default ProductList;
