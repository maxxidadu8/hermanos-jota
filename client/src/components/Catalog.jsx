import { useState } from "react";
import ProductList from "./ProductList.jsx";

function Catalog({ productos, cargando, error, onReintentar, onVerDetalle }) {
  const [busqueda, setBusqueda] = useState("");

  const texto = busqueda.trim().toLowerCase();
  const filtrados = productos.filter((p) =>
    (p.nombre + p.descripcion + Object.values(p.detalles).join(" "))
      .toLowerCase()
      .includes(texto),
  );

  return (
    <main id="contenido" className="section catalog">
      <p className="eyebrow">Colección completa</p>
      <h1>Hechos para quedarse.</h1>
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
        onVerDetalle={onVerDetalle}
      />
    </main>
  );
}

export default Catalog;
