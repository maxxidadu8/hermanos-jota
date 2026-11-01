import { useState } from "react";
import { useLocation } from "react-router-dom";
import ProductList from "./ProductList.jsx";

function Catalog({ productos, cargando, error, onReintentar }) {
  const { state } = useLocation();
  const [busqueda, setBusqueda] = useState("");

  const texto = busqueda.trim().toLowerCase();
  const filtrados = productos.filter((p) =>
    [p.nombre, p.descripcion ?? ""].join(" ")
      .toLowerCase()
      .includes(texto),
  );

  return (
    <main id="contenido" className="section catalog">
      <p className="eyebrow">Colección completa</p>
      <h1>Hechos para quedarse.</h1>
      {state?.aviso && <p role="status">{state.aviso}</p>}
      <p className="catalog__intro">
        Explorá nuestras piezas y encontrá esa que hará de tu casa un lugar más tuyo.
      </p>
      <label className="search">
        <span className="sr-only">Buscar productos</span>
        <input
          type="search"
          placeholder="Buscar por nombre o tipo de mueble…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </label>
      <p className="results" aria-live="polite">
        {!cargando && !error &&
          `${filtrados.length} ${filtrados.length === 1 ? "pieza encontrada" : "piezas encontradas"}`}
      </p>
      <ProductList
        productos={filtrados}
        cargando={cargando}
        error={error}
        onReintentar={onReintentar}
        mensajeVacio={productos.length === 0 ? "Todavía no hay productos en el catálogo." : "No encontramos productos con esa búsqueda."}
      />
    </main>
  );
}

export default Catalog;
