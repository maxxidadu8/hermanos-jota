import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { TOKEN_KEY, guardarToken, leerToken, vencimientoToken } from "../utils/sesion.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(leerToken);
  const tokenActual = useRef(token);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(token));
  const [errorSesion, setErrorSesion] = useState("");
  const [intento, setIntento] = useState(0);
  const [versionSesion, setVersionSesion] = useState(0);
  const versionActual = useRef(0);

  const cambiarToken = useCallback(valor => {
    versionActual.current += 1;
    setVersionSesion(versionActual.current);
    tokenActual.current = valor;
    guardarToken(valor);
    setToken(valor);
    setUsuario(null);
    setErrorSesion("");
    setCargando(Boolean(valor));
  }, []);

  const cerrarSesion = useCallback(() => cambiarToken(null), [cambiarToken]);
  const esSesionActual = useCallback(version => versionActual.current === version, []);
  const reintentarSesion = useCallback(() => {
    setCargando(Boolean(tokenActual.current));
    setIntento(n => n + 1);
  }, []);

  useEffect(() => {
    function sincronizar(event) {
      if (event.key === TOKEN_KEY || event.key === null) {
        const valor = leerToken();
        if (valor !== tokenActual.current) cambiarToken(valor);
      }
    }
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, [cambiarToken]);

  useEffect(() => {
    if (!token) return;
    const vencimiento = vencimientoToken(token);
    if (!vencimiento || vencimiento <= Date.now()) {
      cerrarSesion();
      return;
    }
    const controller = new AbortController();
    const temporizador = setTimeout(() => {
      if (tokenActual.current === token) cerrarSesion();
    }, Math.min(vencimiento - Date.now(), 2147483647));

    async function recuperarSesion() {
      setCargando(true);
      setErrorSesion("");
      try {
        const res = await fetch("/api/auth/perfil", {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (controller.signal.aborted || tokenActual.current !== token) return;
        if (res.status === 401) { cerrarSesion(); return; }
        if (!res.ok) throw new Error("No pudimos verificar tu sesión. Intentá nuevamente.");
        const datos = await res.json();
        if (!datos?.usuario?._id) throw new Error("No pudimos verificar tu sesión. Intentá nuevamente.");
        if (!controller.signal.aborted && tokenActual.current === token) setUsuario(datos.usuario);
      } catch (err) {
        if (!controller.signal.aborted && tokenActual.current === token) {
          setErrorSesion(err instanceof TypeError ? "No pudimos conectar con el servidor para verificar tu sesión." : err.message);
        }
      } finally {
        if (!controller.signal.aborted && tokenActual.current === token) setCargando(false);
      }
    }
    recuperarSesion();
    return () => { controller.abort(); clearTimeout(temporizador); };
  }, [token, intento, cerrarSesion]);

  const autenticar = useCallback(async (accion, datos, signal) => {
    const anterior = tokenActual.current;
    const res = await fetch(`/api/auth/${accion}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
    });
    const respuesta = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(res.status < 500 && typeof respuesta?.error === "string"
        ? respuesta.error : "No pudimos completar la solicitud. Intentá nuevamente.");
    }
    if (!respuesta?.usuario?._id || !vencimientoToken(respuesta.token) || vencimientoToken(respuesta.token) <= Date.now()) {
      throw new Error("El servidor no pudo confirmar la sesión.");
    }
    if (signal?.aborted || tokenActual.current !== anterior) throw new Error("La solicitud de sesión fue cancelada.");
    cambiarToken(respuesta.token);
  }, [cambiarToken]);

  const iniciarSesion = useCallback((datos, signal) => autenticar("login", datos, signal), [autenticar]);
  const registrar = useCallback((datos, signal) => autenticar("registro", datos, signal), [autenticar]);

  const fetchAutenticado = useCallback(async (ruta, opciones = {}) => {
    if (!ruta.startsWith("/api/")) throw new Error("La petición autenticada debe dirigirse a la API del sitio.");
    const vigente = tokenActual.current;
    if (!vigente || (vencimientoToken(vigente) ?? 0) <= Date.now()) {
      if (vigente) cerrarSesion();
      throw new Error("Tu sesión venció. Iniciá sesión nuevamente.");
    }
    const headers = new Headers(opciones.headers);
    headers.set("Authorization", `Bearer ${vigente}`);
    const res = await fetch(ruta, { ...opciones, headers });
    if (res.status === 401) {
      if (tokenActual.current === vigente) cerrarSesion();
      throw new Error("Tu sesión venció. Iniciá sesión nuevamente.");
    }
    return res;
  }, [cerrarSesion]);

  return (
    <AuthContext.Provider value={{ usuario, cargando, errorSesion, versionSesion, esSesionActual, iniciarSesion, registrar, cerrarSesion, reintentarSesion, fetchAutenticado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return contexto;
}
