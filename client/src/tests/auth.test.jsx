// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { AuthProvider, useAuth } from "../context/AuthContext.jsx";
import { destinoTrasLogin, TOKEN_KEY } from "../utils/sesion.js";

const usuario = { _id: "507f1f77bcf86cd799439011", nombre: "Ana", email: "ana@ejemplo.com" };
function crearToken(segundos = 3600, sub = usuario._id) {
  const payload = btoa(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + segundos })).replace(/=+$/, "");
  return `cabecera.${payload}.firma`;
}
function respuesta(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function simularFetch(handler = () => undefined) {
  const mock = vi.fn(async (ruta, opciones) => {
    const resultado = handler(ruta, opciones);
    if (resultado !== undefined) return resultado;
    if (ruta === "/api/productos") return respuesta([]);
    if (ruta === "/api/auth/perfil") return respuesta({ usuario });
    return respuesta({ error: "No encontrado" }, 404);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}
function abrir(ruta) {
  return render(<MemoryRouter initialEntries={[ruta]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
}
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("autenticación y rutas de la aplicación", () => {
  it("redirige una ruta privada al login y no muestra opciones de administración al invitado", async () => {
    simularFetch();
    abrir("/admin/crear-producto");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Crear producto" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Crear producto" })).toBeNull();
    expect(screen.getByRole("link", { name: "Registrarme" })).toBeTruthy();
  });

  it("login guarda solo el JWT, verifica el perfil y vuelve a la ruta protegida solicitada", async () => {
    const token = crearToken();
    const fetch = simularFetch(ruta => ruta === "/api/auth/login" ? respuesta({ token, usuario }) : undefined);
    abrir("/admin/crear-producto");
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: usuario.email } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveDePrueba123" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByRole("heading", { name: "Crear producto" })).toBeTruthy();
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(JSON.stringify(localStorage)).not.toContain("ClaveDePrueba123");
    const perfil = fetch.mock.calls.find(([ruta]) => ruta === "/api/auth/perfil");
    expect(perfil[1].headers.Authorization).toBe(`Bearer ${token}`);
    expect(screen.getByRole("link", { name: "Mi perfil" })).toBeTruthy();
  });

  it("restaura una sesión al recargar sin mostrar el contenido privado antes del perfil", async () => {
    localStorage.setItem(TOKEN_KEY, crearToken());
    let resolver;
    simularFetch(ruta => ruta === "/api/auth/perfil" ? new Promise(resolve => { resolver = resolve; }) : undefined);
    abrir("/perfil");
    expect(screen.queryByRole("heading", { name: "Mi perfil" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Iniciar sesión" })).toBeNull();
    await act(async () => { resolver(respuesta({ usuario })); });
    expect(await screen.findByRole("heading", { name: "Mi perfil" })).toBeTruthy();
    expect(screen.getByText(usuario.email)).toBeTruthy();
  });

  it("cerrar sesión borra el token y abandona las páginas privadas", async () => {
    localStorage.setItem(TOKEN_KEY, crearToken());
    simularFetch();
    abrir("/perfil");
    await screen.findByRole("heading", { name: "Mi perfil" });
    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar sesión" })[1]);
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeTruthy();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.queryByRole("link", { name: "Crear producto" })).toBeNull();
  });

  it.each(["token-invalido", crearToken(-1)])("descarta un JWT inválido o vencido antes de consultar el perfil: %s", async token => {
    localStorage.setItem(TOKEN_KEY, token);
    const fetch = simularFetch();
    abrir("/perfil");
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(fetch.mock.calls.some(([ruta]) => ruta === "/api/auth/perfil")).toBe(false);
  });

  it("rechaza una sesión revocada por la API", async () => {
    localStorage.setItem(TOKEN_KEY, crearToken());
    simularFetch(ruta => ruta === "/api/auth/perfil" ? respuesta({}, 401) : undefined);
    abrir("/perfil");
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("conserva el token ante un fallo de red y permite recuperar la sesión reintentando", async () => {
    const token = crearToken();
    localStorage.setItem(TOKEN_KEY, token);
    let fallo = true;
    simularFetch(ruta => {
      if (ruta === "/api/auth/perfil" && fallo) return Promise.reject(new TypeError("Sin conexión"));
    });
    abrir("/perfil");
    await screen.findByRole("heading", { name: "No pudimos verificar tu sesión" });
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    fallo = false;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("heading", { name: "Mi perfil" });
  });

  it("un login fallido conserva email, muestra el error y no crea sesión", async () => {
    simularFetch(ruta => ruta === "/api/auth/login" ? respuesta({ error: "Email o contraseña incorrectos." }, 401) : undefined);
    abrir("/login");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: usuario.email } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "incorrecta" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Email o contraseña incorrectos");
    expect(screen.getByLabelText("Email").value).toBe(usuario.email);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("el registro envía los tres campos y lleva al perfil", async () => {
    const token = crearToken();
    const fetch = simularFetch(ruta => ruta === "/api/auth/registro" ? respuesta({ token, usuario }, 201) : undefined);
    abrir("/registro");
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: usuario.nombre } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: usuario.email } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveDePrueba123" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrarme" }));
    await screen.findByRole("heading", { name: "Mi perfil" });
    const alta = fetch.mock.calls.find(([ruta]) => ruta === "/api/auth/registro");
    expect(JSON.parse(alta[1].body)).toEqual({ nombre: usuario.nombre, email: usuario.email, password: "ClaveDePrueba123" });
  });

  it("protege también la ruta de edición de productos", async () => {
    simularFetch();
    abrir("/admin/editar-producto/507f191e810c19729de860ea");
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    expect(screen.queryByRole("heading", { name: "Editar producto" })).toBeNull();
  });
});

describe("peticiones autenticadas", () => {
  it("cierra la sesión cuando vence el token durante el uso de la aplicación", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    localStorage.setItem(TOKEN_KEY, crearToken(5));
    simularFetch();
    function Probe() {
      const { usuario } = useAuth();
      return <p>{usuario?.email ?? "sin sesión"}</p>;
    }
    await act(async () => { render(<AuthProvider><Probe /></AuthProvider>); });
    expect(screen.getByText(usuario.email)).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(6000); });
    expect(screen.getByText("sin sesión")).toBeTruthy();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("sincroniza el cierre de sesión entre pestañas", async () => {
    localStorage.setItem(TOKEN_KEY, crearToken());
    simularFetch();
    function Probe() {
      const { usuario } = useAuth();
      return <p>{usuario?.email ?? "sin sesión"}</p>;
    }
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText(usuario.email);
    await act(async () => {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_KEY, newValue: null }));
    });
    expect(screen.getByText("sin sesión")).toBeTruthy();
  });

  it("envía Bearer al guardar un producto y actualiza el catálogo", async () => {
    const token = crearToken();
    localStorage.setItem(TOKEN_KEY, token);
    const producto = { _id: "507f191e810c19729de860ea", nombre: "Mesa nueva", precio: 0, stock: 2 };
    const fetch = simularFetch((ruta, opciones) => {
      if (ruta === "/api/productos" && opciones?.method === "POST") return respuesta(producto, 201);
      if (ruta === `/api/productos/${producto._id}`) return respuesta(producto);
    });
    abrir("/admin/crear-producto");
    await screen.findByRole("heading", { name: "Crear producto" });
    fireEvent.change(screen.getByLabelText("Nombre (obligatorio)"), { target: { value: producto.nombre } });
    fireEvent.change(screen.getByLabelText("Precio en pesos (obligatorio)"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
    await screen.findByRole("heading", { name: "Mesa nueva" });
    const alta = fetch.mock.calls.find(([ruta, opciones]) => ruta === "/api/productos" && opciones?.method === "POST");
    expect(alta[1].headers.get("Authorization")).toBe(`Bearer ${token}`);
  });

  it("un 401 durante una operación cierra sesión y vuelve al login", async () => {
    localStorage.setItem(TOKEN_KEY, crearToken());
    simularFetch((ruta, opciones) => ruta === "/api/productos" && opciones?.method === "POST" ? respuesta({}, 401) : undefined);
    abrir("/admin/crear-producto");
    await screen.findByRole("heading", { name: "Crear producto" });
    fireEvent.change(screen.getByLabelText("Nombre (obligatorio)"), { target: { value: "Mesa" } });
    fireEvent.change(screen.getByLabelText("Precio en pesos (obligatorio)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("un 401 de una sesión anterior no cierra una nueva sesión", async () => {
    const viejo = crearToken();
    const nuevo = crearToken(3600, "otro-usuario");
    localStorage.setItem(TOKEN_KEY, viejo);
    let terminarPeticion;
    simularFetch(ruta => {
      if (ruta === "/api/privada") return new Promise(resolve => { terminarPeticion = resolve; });
      if (ruta === "/api/auth/login") return respuesta({ token: nuevo, usuario });
    });
    let auth;
    function Probe() { auth = useAuth(); return <p>{auth.usuario?.email ?? "sin sesión"}</p>; }
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText(usuario.email);
    let peticion;
    await act(async () => { peticion = auth.fetchAutenticado("/api/privada").catch(error => error); });
    await act(async () => { await auth.iniciarSesion({ email: usuario.email, password: "clave" }); });
    await waitFor(() => expect(auth.usuario?.email).toBe(usuario.email));
    await act(async () => { terminarPeticion(respuesta({}, 401)); await peticion; });
    expect(localStorage.getItem(TOKEN_KEY)).toBe(nuevo);
    expect(auth.usuario?.email).toBe(usuario.email);
  });
});

describe("retorno después del login", () => {
  it("acepta solo destinos internos", () => {
    expect(destinoTrasLogin({ pathname: "/productos", search: "?q=mesa", hash: "#lista" })).toBe("/productos?q=mesa#lista");
    for (const pathname of ["https://otro-sitio.com", "//otro-sitio.com", "/\\otro-sitio.com", "/login", "/registro"]) {
      expect(destinoTrasLogin({ pathname })).toBe("/perfil");
    }
  });
});
