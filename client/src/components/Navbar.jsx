import { useState } from "react";

const enlaces = [
  { vista: "inicio", texto: "Inicio" },
  { vista: "catalogo", texto: "Catálogo" },
  { vista: "contacto", texto: "Contacto" },
];

function Navbar({ cantidadCarrito, onNavegar, onAbrirCarrito }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const irA = (e, vista) => {
    e.preventDefault();
    setMenuAbierto(false);
    onNavegar(vista);
  };

  return (
    <header className="site-header">
      <a className="brand" href="#" onClick={(e) => irA(e, "inicio")}>
        <img src="/assets/img/logo.svg" alt="" />
        <span>Hermanos Jota</span>
      </a>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuAbierto}
        aria-controls="menu-principal"
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <nav
        id="menu-principal"
        className={menuAbierto ? "nav nav--abierto" : "nav"}
        aria-label="Principal"
      >
        {enlaces.map((enlace) => (
          <a key={enlace.vista} href="#" onClick={(e) => irA(e, enlace.vista)}>
            {enlace.texto}
          </a>
        ))}
        <button
          type="button"
          className="cart"
          aria-haspopup="dialog"
          aria-label={`Carrito con ${cantidadCarrito} productos`}
          onClick={() => {
            setMenuAbierto(false);
            onAbrirCarrito();
          }}
        >
          Carrito <span className="cart-count">{cantidadCarrito}</span>
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
