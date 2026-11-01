import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductDetail from "./ProductDetail.jsx";

function ProductPage({ onAgregar, onEliminado }) {
  const { id } = useParams();
  // Reiniciar el estado y cancelar la petición anterior cuando cambia el ID.
  return <ProductLoader key={id} id={id} onAgregar={onAgregar} onEliminado={onEliminado} />;
}

function ProductLoader({ id, onAgregar, onEliminado }) {
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError(null);

    async function cargarProducto() {
      try {
        const res = await fetch(`/api/productos/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (res.status === 404) throw new Error("Producto no encontrado.");
        if (res.status === 400) throw new Error("El ID del producto es inválido.");
        if (!res.ok) throw new Error("No pudimos cargar el producto. Intentá nuevamente.");
        const datos = await res.json();
        if (!datos?._id) throw new Error("El servidor devolvió un producto inválido.");
        if (!controller.signal.aborted) setProducto(datos);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof TypeError ? "No pudimos conectar con el servidor. Intentá nuevamente." : err.message);
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    cargarProducto();
    return () => controller.abort();
  }, [id, intento]);

  if (cargando || error) {
    return (
      <main id="contenido" className="section">
        <h1>Detalle de producto</h1>
        {cargando ? <p role="status">Cargando producto…</p> : (
          <div role="alert">
            <p>{error}</p>
            <button className="button" type="button" onClick={() => setIntento(n => n + 1)}>Reintentar</button>
          </div>
        )}
        <Link className="back-link" to="/productos">← Volver al catálogo</Link>
      </main>
    );
  }

  return <ProductDetail producto={producto} onAgregar={onAgregar} onEliminado={onEliminado} />;
}

export default ProductPage;
