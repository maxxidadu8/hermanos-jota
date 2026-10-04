import ProductList from "./ProductList.jsx";

function Home({ productos, cargando, error, onReintentar, onVerDetalle, onNavegar }) {
  return (
    <main id="contenido">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Casa taller · Buenos Aires</p>
          <h1>Muebles que guardan historias.</h1>
          <p>
            Cada pieza une artesanía, materiales nobles y diseño pensado para acompañar tu vida.
          </p>
          <a className="button" href="#destacados">Conocé la colección</a>
        </div>
        <img
          className="hero__image"
          src="/assets/img/aparador_uspallata.png"
          alt="Aparador Uspallata de madera"
          width="1024"
          height="1024"
        />
      </section>

      <section className="intro section">
        <p className="eyebrow">Nuestra mirada</p>
        <h2>Herencia, innovación y calidez.</h2>
        <p>
          Creemos en piezas que envejecen con gracia: hechas con maderas responsables, detalles
          cuidados y una belleza esencial.
        </p>
      </section>

      <section id="destacados" className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selección</p>
            <h2>Piezas destacadas</h2>
          </div>
          <a
            className="text-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavegar("catalogo");
            }}
          >
            Ver todo el catálogo <span aria-hidden="true">→</span>
          </a>
        </div>
        <ProductList
          productos={productos.slice(0, 4)}
          cargando={cargando}
          error={error}
          onReintentar={onReintentar}
          onVerDetalle={onVerDetalle}
        />
      </section>

      <section className="values">
        <div>
          <p className="eyebrow">Materiales y oficio</p>
          <h2>Diseño que permanece.</h2>
        </div>
        <div className="values__list">
          <p>
            <strong>Maderas responsables</strong>
            <br />
            Priorizamos madera certificada FSC y proveedores locales.
          </p>
          <p>
            <strong>Acabados naturales</strong>
            <br />
            Usamos opciones de bajo COV para cuidar cada ambiente.
          </p>
          <p>
            <strong>Herencia viva</strong>
            <br />
            Piezas pensadas para acompañarte durante muchos años.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Home;
