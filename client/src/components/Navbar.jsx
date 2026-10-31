import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const enlaces = [
  { ruta: "/", texto: "Inicio" },
  { ruta: "/productos", texto: "Catálogo" },
  { ruta: "/contacto", texto: "Contacto" },
  { ruta: "/admin/crear-producto", texto: "Crear producto" },
];

function Navbar({ cantidadCarrito, onAbrirCarrito }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const { pathname } = useLocation();
  useEffect(() => { setMenuAbierto(false); }, [pathname]);

  return (
    <header className="site-header">
      <Link className="brand" to="/" onClick={() => setMenuAbierto(false)}>
        <img src="/assets/img/logo.svg" alt="" />
        <span>Hermanos Jota</span>
      </Link>
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
          <NavLink key={enlace.ruta} to={enlace.ruta} end onClick={() => setMenuAbierto(false)}>
            {enlace.texto}
          </NavLink>
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
