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
import AuthPage from "./components/AuthPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CheckoutPage from "./components/CheckoutPage.jsx";
import OrdersPage from "./components/OrdersPage.jsx";
import { useCart } from "./context/CartContext.jsx";

const titulos = {
  "/": "Hermanos Jota | Muebles con historia",
  "/productos": "Catálogo | Hermanos Jota",
  "/contacto": "Contacto | Hermanos Jota",
  "/login": "Iniciar sesión | Hermanos Jota",
  "/registro": "Crear cuenta | Hermanos Jota",
  "/perfil": "Mi perfil | Hermanos Jota",
  "/mis-pedidos": "Mis pedidos | Hermanos Jota",
  "/finalizar-compra": "Finalizar compra | Hermanos Jota",
  "/admin/crear-producto": "Crear producto | Hermanos Jota",
};

function App() {
  const { pathname } = useLocation();
  const { actualizarProducto: actualizarCarrito, eliminarProducto: eliminarDelCarrito } = useCart();

  // Ciclo de vida de la petición al backend.
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

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

  const reintentar = () => setIntento((n) => n + 1);
  const actualizarProducto = (producto) => {
    actualizarCarrito(producto);
    reintentar();
  };
  const eliminarProducto = (id) => {
    setProductos(actual => actual.filter(producto => producto._id !== id));
    eliminarDelCarrito(id);
    reintentar();
  };

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Navbar
        onAbrirCarrito={() => setCarritoAbierto(true)}
      />

      <Routes>
        <Route path="/" element={
          <Home productos={productos} cargando={cargando} error={error} onReintentar={reintentar} />
        } />
        <Route path="/productos" element={
          <Catalog productos={productos} cargando={cargando} error={error} onReintentar={reintentar} />
        } />
        <Route path="/productos/:id" element={<ProductPage onEliminado={eliminarProducto} />} />
        <Route path="/contacto" element={<ContactForm />} />
        <Route path="/login" element={<AuthPage key="login" />} />
        <Route path="/registro" element={<AuthPage key="registro" registro />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/mis-pedidos" element={<OrdersPage />} />
          <Route path="/finalizar-compra" element={<CheckoutPage />} />
          <Route path="/admin/crear-producto" element={<CreateProductPage onCreado={reintentar} />} />
          <Route path="/admin/editar-producto/:id" element={<EditProductPage onActualizado={actualizarProducto} />} />
        </Route>
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
        <CartDrawer onCerrar={() => setCarritoAbierto(false)} />
      )}
    </>
  );
}

export default App;
