import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { destinoTrasLogin } from "../utils/sesion.js";

function AuthPage({ registro = false }) {
  const { usuario, cargando, iniciarSesion, registrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const pendiente = useRef(null);
  useEffect(() => () => pendiente.current?.abort(), []);
  const destino = destinoTrasLogin(location.state?.from);

  function cambiar(event) {
    setDatos(actual => ({ ...actual, [event.target.name]: event.target.value }));
    setError("");
  }

  async function enviar(event) {
    event.preventDefault();
    if (pendiente.current) return;
    if (!event.currentTarget.checkValidity() || (registro && !datos.nombre.trim())) {
      setError("Completá los campos con datos válidos.");
      event.currentTarget.reportValidity();
      return;
    }
    if (new TextEncoder().encode(datos.password).length > 72) {
      setError("La contraseña no puede superar los 72 bytes. Probá una más corta.");
      return;
    }
    const controller = new AbortController();
    pendiente.current = controller;
    setEnviando(true);
    setError("");
    try {
      const accion = registro ? registrar : iniciarSesion;
      await accion({ email: datos.email.trim(), password: datos.password, ...(registro ? { nombre: datos.nombre.trim() } : {}) }, controller.signal);
      if (!controller.signal.aborted) navigate(destino, { replace: true });
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof TypeError ? "No pudimos conectar con el servidor. Intentá nuevamente." : err.message);
    } finally {
      if (!controller.signal.aborted) { pendiente.current = null; setEnviando(false); }
    }
  }

  if (!cargando && usuario) return <Navigate to={destino} replace />;

  return (
    <main id="contenido" className="section product-editor">
      <p className="eyebrow">Tu cuenta</p>
      <h1>{registro ? "Crear cuenta" : "Iniciar sesión"}</h1>
      <p>{registro ? "Registrate para realizar pedidos y consultar tu cuenta." : "Ingresá con tu email y contraseña."}</p>
      <form className="contact-form" onSubmit={enviar} noValidate aria-busy={enviando}>
        <fieldset className="product-fields" disabled={enviando || cargando}>
          <legend className="sr-only">Datos de acceso</legend>
          {registro && <div>
            <label htmlFor="cuenta-nombre">Nombre</label>
            <input id="cuenta-nombre" name="nombre" autoComplete="name" required value={datos.nombre} onChange={cambiar} />
          </div>}
          <div>
            <label htmlFor="cuenta-email">Email</label>
            <input id="cuenta-email" name="email" type="email" autoComplete="email" required value={datos.email} onChange={cambiar} />
          </div>
          <div>
            <label htmlFor="cuenta-password">Contraseña</label>
            <input id="cuenta-password" name="password" type="password" autoComplete={registro ? "new-password" : "current-password"} minLength={registro ? 8 : undefined} required value={datos.password} onChange={cambiar} />
            {registro && <p className="field-help">Usá al menos 8 caracteres.</p>}
          </div>
          <button className="button" type="submit">{enviando ? "Procesando…" : registro ? "Registrarme" : "Ingresar"}</button>
        </fieldset>
        {error && <p className="form-message" role="alert">{error}</p>}
        {cargando && <p role="status">Verificando sesión…</p>}
        <Link className="text-link" to={registro ? "/login" : "/registro"} state={location.state}>
          {registro ? "Ya tengo cuenta. Iniciar sesión" : "No tengo cuenta. Registrarme"}
        </Link>
      </form>
    </main>
  );
}

export default AuthPage;
