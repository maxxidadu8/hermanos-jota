import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./components/Home.jsx";
import Catalog from "./components/Catalog.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import ContactForm from "./components/ContactForm.jsx";
import CartDrawer from "./components/CartDrawer.jsx";

function App() {
  // Vista actual: "inicio", "catalogo", "detalle" o "contacto".
  const [vista, setVista] = useState("inicio");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Ciclo de vida de la petición al backend.
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  // Carrito: array de { producto, cantidad }.
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    fetch("/api/productos")
      .then((res) => {
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        return res.json();
      })
      .then((datos) => {
        if (!cancelado) setProductos(datos);
      })
      .catch(() => {
        if (!cancelado)
          setError("No pudimos cargar el catálogo. Intentá de nuevo en unos minutos.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [intento]);

  useEffect(() => {
    document.body.classList.toggle("cart-open", carritoAbierto);
  }, [carritoAbierto]);

  const navegar = (nuevaVista) => {
    setVista(nuevaVista);
    setCarritoAbierto(false);
    window.scrollTo(0, 0);
  };

  const verDetalle = (producto) => {
    setProductoSeleccionado(producto);
    navegar("detalle");
  };

  const agregarAlCarrito = (producto) => {
    setCarrito((actual) =>
      actual.some((item) => item.producto.id === producto.id)
        ? actual.map((item) =>
            item.producto.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item,
          )
        : [...actual, { producto, cantidad: 1 }],
    );
  };

  const cambiarCantidad = (id, cambio) => {
    setCarrito((actual) =>
      actual
        .map((item) =>
          item.producto.id === id
            ? { ...item, cantidad: item.cantidad + cambio }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  };

  const quitarDelCarrito = (id) => {
    setCarrito((actual) => actual.filter((item) => item.producto.id !== id));
  };

  const cantidadCarrito = carrito.reduce((total, item) => total + item.cantidad, 0);
  const reintentar = () => setIntento((n) => n + 1);

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Navbar
        cantidadCarrito={cantidadCarrito}
        onNavegar={navegar}
        onAbrirCarrito={() => setCarritoAbierto(true)}
      />

      {vista === "inicio" && (
        <Home
          productos={productos}
          cargando={cargando}
          error={error}
          onReintentar={reintentar}
          onVerDetalle={verDetalle}
          onNavegar={navegar}
        />
      )}
      {vista === "catalogo" && (
        <Catalog
          productos={productos}
          cargando={cargando}
          error={error}
          onReintentar={reintentar}
          onVerDetalle={verDetalle}
        />
      )}
      {vista === "detalle" && productoSeleccionado && (
        <ProductDetail
          producto={productoSeleccionado}
          onVolver={() => navegar("catalogo")}
          onAgregar={agregarAlCarrito}
        />
      )}
      {vista === "contacto" && <ContactForm />}

      <Footer onNavegar={navegar} />

      {carritoAbierto && (
        <CartDrawer
          carrito={carrito}
          cantidadTotal={cantidadCarrito}
          onCerrar={() => setCarritoAbierto(false)}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={quitarDelCarrito}
          onVaciar={() => setCarrito([])}
          onNavegar={navegar}
        />
      )}
    </>
  );
}

export default App;
