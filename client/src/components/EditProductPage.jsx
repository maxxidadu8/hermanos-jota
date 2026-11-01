import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductForm from "./ProductForm.jsx";

function EditProductPage({ onActualizado }) {
  const { id } = useParams();
  return <EditProductLoader key={id} id={id} onActualizado={onActualizado} />;
}

function EditProductLoader({ id, onActualizado }) {
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError("");

    async function cargar() {
      try {
        const res = await fetch(`/api/productos/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (res.status === 400) throw new Error("El ID del producto es inválido.");
        if (res.status === 404) throw new Error("Producto no encontrado.");
        if (!res.ok) throw new Error("No pudimos cargar el producto para editarlo.");
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

    cargar();
    return () => controller.abort();
  }, [id, intento]);

  if (cargando || error) {
    return (
      <main id="contenido" className="section product-editor">
        <h1>Editar producto</h1>
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

  return <ProductForm productoInicial={producto} onGuardado={onActualizado} />;
}

export default EditProductPage;
