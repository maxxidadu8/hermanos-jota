import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { usuario, cargando, errorSesion, versionSesion, esSesionActual, fetchAutenticado } = useAuth();
  const [carrito, setCarrito] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const pendiente = useRef(false);
  const actual = useRef(null);
  actual.current = { carrito, usuario, cargando, errorSesion, versionSesion };

  const agregarAlCarrito = useCallback(producto => {
    if (pendiente.current || !producto?._id || (Number.isFinite(producto.stock) && producto.stock <= 0)) return;
    setCarrito(items => {
      const existente = items.find(item => item.producto._id === producto._id);
      if (existente) {
        if ((Number.isFinite(producto.stock) && existente.cantidad >= producto.stock) || !Number.isSafeInteger(existente.cantidad + 1)) return items;
        return items.map(item => item.producto._id === producto._id ? { producto, cantidad: item.cantidad + 1 } : item);
      }
      return [...items, { producto, cantidad: 1 }];
    });
  }, []);

  const cambiarCantidad = useCallback((id, cambio) => {
    if (pendiente.current || !Number.isSafeInteger(cambio)) return;
    setCarrito(items => items.map(item => {
      if (item.producto._id !== id) return item;
      const cantidad = item.cantidad + cambio;
      if (!Number.isSafeInteger(cantidad) || (Number.isFinite(item.producto.stock) && cantidad > item.producto.stock && cambio > 0)) return item;
      return { ...item, cantidad };
    }).filter(item => item.cantidad > 0));
  }, []);

  const quitarDelCarrito = useCallback(id => {
    if (!pendiente.current) setCarrito(items => items.filter(item => item.producto._id !== id));
  }, []);
  const vaciarCarrito = useCallback(() => {
    if (!pendiente.current) setCarrito([]);
  }, []);
  const actualizarProducto = useCallback(producto => {
    setCarrito(items => items.map(item => item.producto._id === producto._id ? { ...item, producto } : item));
  }, []);
  const eliminarProducto = useCallback(id => {
    setCarrito(items => items.filter(item => item.producto._id !== id));
  }, []);

  const finalizarCompra = useCallback(async () => {
    if (pendiente.current) throw new Error("Ya estamos registrando tu pedido.");
    const sesion = actual.current;
    if (!sesion.usuario || sesion.cargando || sesion.errorSesion) throw new Error("Iniciá sesión para finalizar la compra.");
    if (sesion.carrito.length === 0) throw new Error("El carrito está vacío.");
    pendiente.current = true;
    setEnviando(true);
    try {
      const res = await fetchAutenticado("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: sesion.carrito.map(({ producto, cantidad }) => ({ productoId: producto._id, cantidad })) }),
      });
      const pedido = await res.json().catch(() => null);
      if (!res.ok) throw new Error(res.status < 500 && typeof pedido?.error === "string" ? pedido.error : "No pudimos registrar el pedido. Revisá Mis pedidos antes de reintentar.");
      if (res.status !== 201 || !pedido?._id || pedido.usuario !== sesion.usuario._id) {
        throw new Error("No pudimos confirmar el pedido. Revisá Mis pedidos antes de reintentar.");
      }
      // Una respuesta de otra sesión no vacía el carrito ni navega por la cuenta actual.
      if (!esSesionActual(sesion.versionSesion)) return null;
      setCarrito([]);
      return pedido;
    } catch (error) {
      if (error instanceof TypeError) throw new Error("Se perdió la conexión. Revisá Mis pedidos antes de reintentar; el carrito se conservó.");
      throw error;
    } finally {
      pendiente.current = false;
      setEnviando(false);
    }
  }, [fetchAutenticado, esSesionActual]);

  const cantidadCarrito = carrito.reduce((total, item) => total + item.cantidad, 0);
  const total = carrito.reduce((centavos, item) => centavos + Math.round((item.producto.precio + Number.EPSILON) * 100) * item.cantidad, 0) / 100;
  const valor = useMemo(() => ({ carrito, cantidadCarrito, total, enviando, agregarAlCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito, actualizarProducto, eliminarProducto, finalizarCompra }),
    [carrito, cantidadCarrito, total, enviando, agregarAlCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito, actualizarProducto, eliminarProducto, finalizarCompra]);
  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}

export function useCart() {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error("useCart debe usarse dentro de CartProvider");
  return contexto;
}
