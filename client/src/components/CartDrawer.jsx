import { useEffect } from "react";

function CartDrawer({
  carrito,
  cantidadTotal,
  onCerrar,
  onCambiarCantidad,
  onQuitar,
  onVaciar,
  onNavegar,
}) {
  useEffect(() => {
    const cerrarConEscape = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onCerrar]);

  const irA = (e, vista) => {
    e.preventDefault();
    onNavegar(vista);
  };

  return (
    <>
      <div className="cart-overlay" onClick={onCerrar}></div>
      <aside
        id="carrito"
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-drawer__head">
          <h2 id="cart-title">Tu pedido</h2>
          <button
            type="button"
            className="cart-drawer__close"
            aria-label="Cerrar carrito"
            onClick={onCerrar}
            autoFocus
          >
            ×
          </button>
        </div>

        <div className="cart-drawer__body">
          {carrito.length === 0 ? (
            <div className="cart-empty">
              <p>Todavía no hay piezas en tu pedido.</p>
              <a className="text-link" href="#" onClick={(e) => irA(e, "catalogo")}>
                Ver el catálogo
              </a>
            </div>
          ) : (
            carrito.map(({ producto, cantidad }) => (
              <article className="cart-item" key={producto.id}>
                <img src={`/${producto.imagen}`} alt={producto.nombre} width="80" height="80" />
                <div className="cart-item__info">
                  <h3>{producto.nombre}</h3>
                  <p>Precio a consultar</p>
                  <div className="cart-item__actions">
                    <div className="qty" role="group" aria-label={`Cantidad de ${producto.nombre}`}>
                      <button
                        type="button"
                        aria-label={`Restar ${producto.nombre}`}
                        onClick={() => onCambiarCantidad(producto.id, -1)}
                      >
                        −
                      </button>
                      <span>{cantidad}</span>
                      <button
                        type="button"
                        aria-label={`Sumar ${producto.nombre}`}
                        onClick={() => onCambiarCantidad(producto.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() => onQuitar(producto.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {carrito.length > 0 && (
          <div className="cart-drawer__foot">
            <p className="cart-summary">
              {cantidadTotal} {cantidadTotal === 1 ? "pieza" : "piezas"} · precio a consultar
            </p>
            <div className="cart-drawer__actions">
              <button type="button" className="button button--ghost" onClick={onVaciar}>
                Vaciar
              </button>
              <a className="button" href="#" onClick={(e) => irA(e, "contacto")}>
                Solicitar consulta
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;
