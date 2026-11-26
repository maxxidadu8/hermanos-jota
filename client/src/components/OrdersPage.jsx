import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { formatearPrecio } from "../utils/productos.js";

function OrdersPage() {
  const { usuario, versionSesion, fetchAutenticado } = useAuth();
  const { state } = useLocation();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setPedidos([]);
    setError("");
    async function cargar() {
      try {
        const res = await fetchAutenticado("/api/pedidos", { signal: controller.signal });
        if (!res.ok) throw new Error("No pudimos cargar tus pedidos. Intentá nuevamente.");
        const datos = await res.json();
        if (!Array.isArray(datos)) throw new Error("No pudimos interpretar tus pedidos. Intentá nuevamente.");
        if (!controller.signal.aborted) setPedidos(datos);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof TypeError ? "No pudimos conectar con el servidor." : err.message);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }
    cargar();
    return () => controller.abort();
  }, [usuario._id, versionSesion, fetchAutenticado, intento]);

  return (
    <main id="contenido" className="section">
      <p className="eyebrow">Tu cuenta</p>
      <h1>Mis pedidos</h1>
      {state?.pedidoCreado && <p role="status">Tu pedido se registró correctamente.</p>}
      {cargando ? <p role="status">Cargando tus pedidos…</p> : error ? <div role="alert">
        <p>{error}</p>
        <button className="button" onClick={() => setIntento(n => n + 1)}>Reintentar</button>
      </div> : pedidos.length === 0 ? <p>Todavía no realizaste pedidos.</p> : <div className="orders-list">
        {pedidos.map(pedido => <article className="order-card" key={pedido._id}>
          <h2>Pedido #{pedido._id.slice(-6)}</h2>
          <p>{new Date(pedido.createdAt).toLocaleString("es-AR")} · Estado: {pedido.estado}</p>
          <ul className="checkout-items">
            {pedido.items.map(item => <li key={item.producto}>
              <span>{item.nombre} × {item.cantidad} · {formatearPrecio(item.precio)} por unidad</span>
              <strong>{formatearPrecio(item.subtotal)}</strong>
            </li>)}
          </ul>
          <p className="price-note">Total: {formatearPrecio(pedido.total)}</p>
        </article>)}
      </div>}
      <Link className="back-link" to="/productos">← Volver al catálogo</Link>
    </main>
  );
}

export default OrdersPage;
