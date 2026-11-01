import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function DeleteProductButton({ producto, onEliminado }) {
  const navigate = useNavigate();
  const dialogo = useRef(null);
  const pendiente = useRef(false);
  const activo = useRef(true);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    activo.current = true;
    return () => { activo.current = false; };
  }, []);

  function confirmar() {
    setError("");
    dialogo.current.showModal();
  }

  async function eliminar(event) {
    event.preventDefault();
    if (pendiente.current) return;
    pendiente.current = true;
    setEliminando(true);
    setError("");

    try {
      const res = await fetch(`/api/productos/${producto._id}`, { method: "DELETE" });
      if (res.status !== 204 && res.status !== 404) {
        throw new Error("No pudimos eliminar el producto. Intentá nuevamente.");
      }
      onEliminado(producto._id);
      if (activo.current) {
        dialogo.current.close();
        navigate("/productos", {
          replace: true,
          state: { aviso: res.status === 404 ? "El producto ya no estaba disponible." : "Producto eliminado correctamente." },
        });
      }
    } catch (err) {
      if (activo.current) {
        setError(err instanceof TypeError
          ? "No pudimos conectar con el servidor. Revisá la conexión antes de reintentar."
          : err.message);
      }
    } finally {
      pendiente.current = false;
      if (activo.current) setEliminando(false);
    }
  }

  return (
    <>
      <button type="button" className="button button--danger" onClick={confirmar}>Eliminar producto</button>
      <dialog
        ref={dialogo}
        className="delete-dialog"
        aria-labelledby="eliminar-titulo"
        aria-describedby="eliminar-descripcion"
        onCancel={event => { if (pendiente.current) event.preventDefault(); }}
      >
        <h2 id="eliminar-titulo">¿Eliminar este producto?</h2>
        <p id="eliminar-descripcion">Se eliminará «{producto.nombre}» del catálogo. Esta acción no se puede deshacer.</p>
        <form onSubmit={eliminar} aria-busy={eliminando}>
          <div className="product-admin-actions">
            <button type="button" className="button button--ghost" disabled={eliminando} autoFocus onClick={() => dialogo.current.close()}>Cancelar</button>
            <button type="submit" className="button button--danger" disabled={eliminando}>{eliminando ? "Eliminando…" : "Confirmar eliminación"}</button>
          </div>
          {eliminando && <p role="status">Eliminando producto…</p>}
          {error && <p role="alert" className="form-message">{error}</p>}
        </form>
      </dialog>
    </>
  );
}

export default DeleteProductButton;
