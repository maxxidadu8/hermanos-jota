import { Link } from "react-router-dom";
import ProductImage from "./ProductImage.jsx";
import { formatearPrecio, describirStock } from "../utils/productos.js";

function ProductCard({ producto }) {
  return (
    <article className="product-card">
      <ProductImage
        imagenUrl={producto.imagenUrl}
        alt={producto.nombre}
        width="1024"
        height="1024"
        loading="lazy"
      />
      <div className="product-card__body">
        <h3>{producto.nombre}</h3>
        <p>{producto.descripcion}</p>
        <p className="price-note">{formatearPrecio(producto.precio)}</p>
        <p>{describirStock(producto.stock)}</p>
        <Link to={`/productos/${producto._id}`}>
          Ver pieza <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;
