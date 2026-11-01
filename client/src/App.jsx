import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./components/Home.jsx";
import Catalog from "./components/Catalog.jsx";
import ProductPage from "./components/ProductPage.jsx";
import ContactForm from "./components/ContactForm.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import CreateProductPage from "./components/CreateProductPage.jsx";
import EditProductPage from "./components/EditProductPage.jsx";

const titulos = {
  "/": "Hermanos Jota | Muebles con historia",
  "/productos": "Catálogo | Hermanos Jota",
  "/contacto": "Contacto | Hermanos Jota",
  "/admin/crear-producto": "Crear producto | Hermanos Jota",
};

function App() {
  const { pathname } = useLocation();

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
        if (!Array.isArray(datos)) throw new Error("El catálogo recibido no es una lista");
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
    document.title = titulos[pathname] ?? (
      /^\/productos\/[^/]+\/?$/.test(pathname)
        ? "Producto | Hermanos Jota"
        : /^\/admin\/editar-producto\/[^/]+\/?$/.test(pathname)
          ? "Editar producto | Hermanos Jota"
          : "Página no encontrada | Hermanos Jota"
    );
    setCarritoAbierto(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("cart-open", carritoAbierto);
  }, [carritoAbierto]);

  const agregarAlCarrito = (producto) => {
    setCarrito((actual) =>
      actual.some((item) => item.producto._id === producto._id)
        ? actual.map((item) =>
            item.producto._id === producto._id
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
          item.producto._id === id
            ? { ...item, cantidad: item.cantidad + cambio }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  };

  const quitarDelCarrito = (id) => {
    setCarrito((actual) => actual.filter((item) => item.producto._id !== id));
  };

  const cantidadCarrito = carrito.reduce((total, item) => total + item.cantidad, 0);
  const reintentar = () => setIntento((n) => n + 1);
  const actualizarProducto = (producto) => {
    setCarrito(actual => actual.map(item => item.producto._id === producto._id
      ? { ...item, producto }
      : item));
    reintentar();
  };

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Navbar
        cantidadCarrito={cantidadCarrito}
        onAbrirCarrito={() => setCarritoAbierto(true)}
      />

      <Routes>
        <Route path="/" element={
          <Home productos={productos} cargando={cargando} error={error} onReintentar={reintentar} />
        } />
        <Route path="/productos" element={
          <Catalog productos={productos} cargando={cargando} error={error} onReintentar={reintentar} />
        } />
        <Route path="/productos/:id" element={<ProductPage onAgregar={agregarAlCarrito} />} />
        <Route path="/contacto" element={<ContactForm />} />
        <Route path="/admin/crear-producto" element={<CreateProductPage onCreado={reintentar} />} />
        <Route path="/admin/editar-producto/:id" element={<EditProductPage onActualizado={actualizarProducto} />} />
        <Route path="*" element={
          <main id="contenido" className="section">
            <h1>Página no encontrada</h1>
            <p>La dirección que buscás no existe.</p>
            <Link className="button" to="/">Volver al inicio</Link>
          </main>
        } />
      </Routes>

      <Footer />

      {carritoAbierto && (
        <CartDrawer
          carrito={carrito}
          cantidadTotal={cantidadCarrito}
          onCerrar={() => setCarritoAbierto(false)}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={quitarDelCarrito}
          onVaciar={() => setCarrito([])}
        />
      )}
    </>
  );
}

export default App;
