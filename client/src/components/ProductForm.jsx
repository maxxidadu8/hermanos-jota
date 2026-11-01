import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function datosDelProducto(producto) {
  return {
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precio: producto?.precio ?? "",
    stock: producto?.stock ?? "",
    imagenUrl: producto?.imagenUrl ?? "",
  };
}

function ProductForm({ productoInicial, onGuardado }) {
  const editando = Boolean(productoInicial);
  const navigate = useNavigate();
  const [datos, setDatos] = useState(() => datosDelProducto(productoInicial));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const activo = useRef(true);

  useEffect(() => {
    activo.current = true;
    return () => { activo.current = false; };
  }, []);

  function cambiarCampo(event) {
    const { name, value } = event.target;
    setDatos(actual => ({ ...actual, [name]: value }));
    setError("");
  }

  async function guardarProducto(event) {
    event.preventDefault();
    if (pendiente.current) return;
    setError("");

    if (!event.currentTarget.checkValidity() || !datos.nombre.trim()) {
      setError("Completá el nombre y un precio válido. El stock, si lo indicás, debe ser un número entero mayor o igual a cero.");
      event.currentTarget.reportValidity();
      return;
    }

    const precio = Number(datos.precio);
    const stock = datos.stock === "" ? undefined : Number(datos.stock);
    if (!Number.isFinite(precio) || precio < 0 ||
        (stock !== undefined && (!Number.isInteger(stock) || stock < 0))) {
      setError("Revisá el precio y el stock: deben ser números válidos mayores o iguales a cero.");
      return;
    }

    pendiente.current = true;
    setEnviando(true);
    try {
      const res = await fetch(editando ? `/api/productos/${productoInicial._id}` : "/api/productos", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion.trim(),
          precio,
          ...(stock === undefined ? (editando ? { stock: null } : {}) : { stock }),
          imagenUrl: datos.imagenUrl.trim(),
        }),
      });
      const producto = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 404) throw new Error("El producto ya no existe. Volvé al catálogo para comprobarlo.");
        throw new Error(res.status === 400 && producto?.error
          ? producto.error
          : "No pudimos guardar el producto. Intentá nuevamente.");
      }
      if (res.status !== (editando ? 200 : 201) || !producto?._id) {
        throw new Error("No pudimos confirmar el guardado. Revisá el catálogo antes de volver a enviar.");
      }
      onGuardado(producto);
      if (activo.current) navigate(`/productos/${producto._id}`, { replace: true });
    } catch (err) {
      if (activo.current) {
        setError(err instanceof TypeError
          ? "No pudimos conectar con el servidor. Revisá la conexión y el catálogo antes de reintentar."
          : err.message);
      }
    } finally {
      pendiente.current = false;
      if (activo.current) setEnviando(false);
    }
  }

  return (
    <main id="contenido" className="section product-editor">
      <p className="eyebrow">Administración</p>
      <h1>{editando ? "Editar producto" : "Crear producto"}</h1>
      <p>{editando ? "Actualizá los datos de esta pieza." : "Agregá una nueva pieza al catálogo."} Nombre y precio son obligatorios.</p>
      <form className="contact-form" onSubmit={guardarProducto} noValidate aria-busy={enviando}>
        <fieldset disabled={enviando} className="product-fields">
          <legend className="sr-only">Datos del producto</legend>
          <div>
            <label htmlFor="producto-nombre">Nombre (obligatorio)</label>
            <input id="producto-nombre" name="nombre" required value={datos.nombre} onChange={cambiarCampo} />
          </div>
          <div>
            <label htmlFor="producto-descripcion">Descripción</label>
            <textarea id="producto-descripcion" name="descripcion" rows="4" value={datos.descripcion} onChange={cambiarCampo} />
          </div>
          <div>
            <label htmlFor="producto-precio">Precio en pesos (obligatorio)</label>
            <input id="producto-precio" name="precio" type="number" required min="0" step="0.01" value={datos.precio} onChange={cambiarCampo} />
          </div>
          <div>
            <label htmlFor="producto-stock">Stock</label>
            <input id="producto-stock" name="stock" type="number" min="0" step="1" value={datos.stock} onChange={cambiarCampo} />
          </div>
          <div>
            <label htmlFor="producto-imagen">URL o ruta de imagen</label>
            <input id="producto-imagen" name="imagenUrl" type="text" aria-describedby="imagen-ayuda" value={datos.imagenUrl} onChange={cambiarCampo} />
            <p id="imagen-ayuda" className="field-help">Podés usar una dirección https:// o una ruta como /assets/img/mesa_comedor_pampa.png.</p>
          </div>
          <button className="button" type="submit">{enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear producto"}</button>
        </fieldset>
        {error && <p className="form-message" role="alert">{error}</p>}
        {enviando && <p role="status">Guardando el producto…</p>}
        {!enviando && <Link className="text-link" to={editando ? `/productos/${productoInicial._id}` : "/productos"}>{editando ? "Cancelar y volver al producto" : "Cancelar y volver al catálogo"}</Link>}
      </form>
    </main>
  );
}

export default ProductForm;
