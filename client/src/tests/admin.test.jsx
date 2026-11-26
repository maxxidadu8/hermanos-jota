// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { TOKEN_KEY } from "../utils/sesion.js";

const usuario = { _id: "507f1f77bcf86cd799439011", nombre: "Ana", email: "ana@ejemplo.com" };
const producto = { _id: "507f191e810c19729de860ea", nombre: "Mesa original", descripcion: "Madera", precio: 120, stock: 2, imagenUrl: "" };
const token = `cabecera.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.firma`;
const respuesta = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const detalle = `/api/productos/${producto._id}`;

function abrir(ruta, handler = () => undefined) {
  const fetch = vi.fn(async (url, opciones) => {
    const resultado = handler(url, opciones);
    if (resultado !== undefined) return resultado;
    if (url === "/api/auth/perfil") return respuesta({ usuario });
    if (url === "/api/productos") return respuesta([producto]);
    if (url === detalle) return respuesta(producto);
    return respuesta({}, 404);
  });
  vi.stubGlobal("fetch", fetch);
  render(<MemoryRouter initialEntries={[ruta]}><AuthProvider><CartProvider><App /></CartProvider></AuthProvider></MemoryRouter>);
  return fetch;
}
function completar() {
  fireEvent.change(screen.getByLabelText("Nombre (obligatorio)"), { target: { value: "Mesa nueva" } });
  fireEvent.change(screen.getByLabelText("Precio en pesos (obligatorio)"), { target: { value: "150" } });
}
function peticiones(fetch, method) {
  return fetch.mock.calls.filter(([, opciones]) => opciones?.method === method);
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(TOKEN_KEY, token);
  window.scrollTo = vi.fn();
  // JSDOM no implementa la apertura y cierre nativos del diálogo.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each([
  { nombre: "", precio: "10", stock: "" },
  { nombre: "   ", precio: "10", stock: "" },
  { nombre: "Mesa", precio: "-1", stock: "" },
  { nombre: "Mesa", precio: "10", stock: "-1" },
  { nombre: "Mesa", precio: "10", stock: "0.5" },
])("alta rechaza datos inválidos sin enviar POST: %j", async datos => {
  const fetch = abrir("/admin/crear-producto");
  await screen.findByRole("heading", { name: "Crear producto" });
  for (const [campo, valor] of Object.entries(datos)) {
    const etiquetas = { nombre: "Nombre (obligatorio)", precio: "Precio en pesos (obligatorio)", stock: "Stock" };
    fireEvent.change(screen.getByLabelText(etiquetas[campo]), { target: { value: valor } });
  }
  fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(peticiones(fetch, "POST")).toHaveLength(0);
});

it("alta conserva datos ante un error del servidor y permite reintentar", async () => {
  let fallo = true;
  const creado = { ...producto, nombre: "Mesa nueva", precio: 150 };
  const fetch = abrir("/admin/crear-producto", (url, opciones) => {
    if (url === "/api/productos" && opciones?.method === "POST") return respuesta(fallo ? {} : creado, fallo ? 500 : 201);
    if (url === detalle) return respuesta(creado);
  });
  await screen.findByRole("heading", { name: "Crear producto" });
  completar();
  fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Nombre (obligatorio)").value).toBe("Mesa nueva");
  expect(screen.getByLabelText("Precio en pesos (obligatorio)").value).toBe("150");
  fallo = false;
  fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
  await screen.findByRole("heading", { name: "Mesa nueva" });
  expect(peticiones(fetch, "POST")).toHaveLength(2);
});

it("alta bloquea envíos duplicados mientras espera la confirmación", async () => {
  let resolver;
  const fetch = abrir("/admin/crear-producto", (url, opciones) => {
    if (url === "/api/productos" && opciones?.method === "POST") return new Promise(resolve => { resolver = resolve; });
  });
  await screen.findByRole("heading", { name: "Crear producto" });
  completar();
  const form = screen.getByLabelText("Nombre (obligatorio)").closest("form");
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(peticiones(fetch, "POST")).toHaveLength(1);
  expect(form.querySelector("fieldset").disabled).toBe(true);
  await act(async () => { resolver(respuesta({}, 500)); });
  await screen.findByRole("alert");
  expect(form.querySelector("fieldset").disabled).toBe(false);
});

it("edición precarga, envía PUT con Bearer y permite dejar stock a consultar", async () => {
  const actualizado = { ...producto, precio: 99, stock: null };
  const fetch = abrir(`/admin/editar-producto/${producto._id}`, (url, opciones) => {
    if (url === detalle && opciones?.method === "PUT") return respuesta(actualizado);
  });
  await screen.findByRole("button", { name: "Guardar cambios" });
  expect(screen.getByLabelText("Nombre (obligatorio)").value).toBe(producto.nombre);
  expect(screen.getByLabelText("Stock").value).toBe("2");
  fireEvent.change(screen.getByLabelText("Precio en pesos (obligatorio)"), { target: { value: "99" } });
  fireEvent.change(screen.getByLabelText("Stock"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByRole("heading", { name: producto.nombre });
  const [url, opciones] = peticiones(fetch, "PUT")[0];
  expect(url).toBe(detalle);
  expect(opciones.headers.get("Authorization")).toBe(`Bearer ${token}`);
  expect(JSON.parse(opciones.body)).toEqual({ nombre: producto.nombre, descripcion: producto.descripcion, precio: 99, stock: null, imagenUrl: producto.imagenUrl });
});

it("cancelar edición vuelve al detalle sin guardar", async () => {
  const fetch = abrir(`/admin/editar-producto/${producto._id}`);
  await screen.findByRole("button", { name: "Guardar cambios" });
  fireEvent.change(screen.getByLabelText("Nombre (obligatorio)"), { target: { value: "Cambio sin guardar" } });
  fireEvent.click(screen.getByRole("link", { name: "Cancelar y volver al producto" }));
  await screen.findByRole("heading", { name: producto.nombre });
  expect(peticiones(fetch, "PUT")).toHaveLength(0);
});

it("edición muestra producto inexistente y permite reintentar la carga", async () => {
  let fallo = true;
  abrir(`/admin/editar-producto/${producto._id}`, url => url === detalle ? respuesta(fallo ? {} : producto, fallo ? 404 : 200) : undefined);
  await screen.findByText("Producto no encontrado.");
  expect(screen.queryByRole("button", { name: "Guardar cambios" })).toBeNull();
  fallo = false;
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await screen.findByRole("button", { name: "Guardar cambios" });
});

it("edición cancela la consulta al abandonar la página y descarta su respuesta tardía", async () => {
  let resolver, signal;
  abrir(`/admin/editar-producto/${producto._id}`, (url, opciones) => {
    if (url === detalle) { signal = opciones.signal; return new Promise(resolve => { resolver = resolve; }); }
  });
  await screen.findByText("Cargando producto…");
  fireEvent.click(screen.getByRole("link", { name: /Volver al catálogo/ }));
  expect(signal.aborted).toBe(true);
  await act(async () => { resolver(respuesta(producto)); });
  expect(screen.queryByRole("button", { name: "Guardar cambios" })).toBeNull();
});

it("cancelar el diálogo de borrado no envía DELETE", async () => {
  const fetch = abrir(`/productos/${producto._id}`);
  await screen.findByRole("heading", { name: producto.nombre });
  fireEvent.click(screen.getByRole("button", { name: "Eliminar producto" }));
  const dialogo = screen.getByRole("dialog", { name: "¿Eliminar este producto?" });
  expect(within(dialogo).getByText(/Mesa original/)).toBeTruthy();
  fireEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(peticiones(fetch, "DELETE")).toHaveLength(0);
});

it.each([204, 404])("borrado %s limpia catálogo y carrito, envía Bearer y vuelve al catálogo", async status => {
  let eliminado = false;
  const fetch = abrir(`/productos/${producto._id}`, (url, opciones) => {
    if (url === detalle && opciones?.method === "DELETE") { eliminado = true; return respuesta(null, status); }
    if (url === "/api/productos" && eliminado) return respuesta([]);
  });
  await screen.findByRole("heading", { name: producto.nombre });
  fireEvent.click(screen.getByRole("button", { name: "Añadir al carrito" }));
  fireEvent.click(screen.getByRole("button", { name: "Eliminar producto" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  await screen.findByText(status === 204 ? "Producto eliminado correctamente." : "El producto ya no estaba disponible.");
  expect(screen.queryByRole("heading", { name: producto.nombre })).toBeNull();
  const [url, opciones] = peticiones(fetch, "DELETE")[0];
  expect(url).toBe(detalle);
  expect(opciones.headers.get("Authorization")).toBe(`Bearer ${token}`);
  fireEvent.click(screen.getByRole("button", { name: /Carrito/ }));
  await screen.findByText("Todavía no hay piezas en tu pedido.");
});

it("borrado fallido conserva el diálogo y el producto, y permite reintentar", async () => {
  let fallo = true;
  const fetch = abrir(`/productos/${producto._id}`, (url, opciones) => {
    if (url === detalle && opciones?.method === "DELETE") return respuesta(null, fallo ? 500 : 204);
  });
  await screen.findByRole("heading", { name: producto.nombre });
  fireEvent.click(screen.getByRole("button", { name: "Eliminar producto" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByRole("heading", { name: producto.nombre })).toBeTruthy();
  fallo = false;
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  await screen.findByText("Producto eliminado correctamente.");
  expect(peticiones(fetch, "DELETE")).toHaveLength(2);
});
