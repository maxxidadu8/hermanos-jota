import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatearPrecio } from "../utils/productos.js";

function CheckoutPage() {
  const { usuario } = useAuth();
  const { carrito, total, enviando, finalizarCompra } = useCart();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const activo = useRef(true);
  useEffect(() => { activo.current = true; return () => { activo.current = false; }; }, []);

  async function confirmar() {
    setError("");
    try {
      const pedido = await finalizarCompra();
      if (activo.current && pedido) navigate("/mis-pedidos", { replace: true, state: { pedidoCreado: pedido._id } });
    } catch (err) {
      if (activo.current) setError(err.message);
    }
  }

  return (
    <main id="contenido" className="section product-editor">
      <p className="eyebrow">Tu compra</p>
      <h1>Finalizar compra</h1>
      {carrito.length === 0 ? <>
        <p>Tu carrito está vacío.</p>
        <Link className="button" to="/productos">Ver el catálogo</Link>
      </> : <>
        <p>El pedido se registrará a nombre de {usuario.nombre} ({usuario.email}).</p>
        <ul className="checkout-items">
          {carrito.map(({ producto, cantidad }) => <li key={producto._id}>
            <span>{producto.nombre} × {cantidad}</span>
            <strong>{formatearPrecio(Math.round((producto.precio + Number.EPSILON) * 100) * cantidad / 100)}</strong>
          </li>)}
        </ul>
        <p className="price-note">Total estimado: {formatearPrecio(total)}</p>
        <p>El total y la disponibilidad se verifican al confirmar. Esta operación registra el pedido; no realiza un cobro.</p>
        <div className="product-admin-actions">
          <button className="button" disabled={enviando} onClick={confirmar}>{enviando ? "Registrando…" : "Confirmar pedido"}</button>
          {!enviando && <Link className="text-link" to="/productos">Seguir viendo productos</Link>}
        </div>
      </>}
      {enviando && <p role="status">Estamos registrando tu pedido…</p>}
      {error && <div role="alert"><p>{error}</p><Link to="/mis-pedidos">Consultar Mis pedidos</Link></div>}
    </main>
  );
}

export default CheckoutPage;
