import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute() {
  const { usuario, cargando, errorSesion, reintentarSesion, cerrarSesion } = useAuth();
  const location = useLocation();
  if (cargando) return <main id="contenido" className="section"><p role="status">Verificando sesión…</p></main>;
  if (errorSesion) return (
    <main id="contenido" className="section">
      <h1>No pudimos verificar tu sesión</h1>
      <p role="alert">{errorSesion}</p>
      <div className="product-admin-actions">
        <button className="button" onClick={reintentarSesion}>Reintentar</button>
        <button className="button button--ghost" onClick={cerrarSesion}>Volver a iniciar sesión</button>
      </div>
    </main>
  );
  return usuario ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export default ProtectedRoute;
