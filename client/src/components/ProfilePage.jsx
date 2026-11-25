import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProfilePage() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  return (
    <main id="contenido" className="section product-editor">
      <p className="eyebrow">Tu cuenta</p>
      <h1>Mi perfil</h1>
      <dl className="profile-data">
        <dt>Nombre</dt><dd>{usuario.nombre}</dd>
        <dt>Email</dt><dd>{usuario.email}</dd>
      </dl>
      <p><Link className="text-link" to="/mis-pedidos">Ver mis pedidos</Link></p>
      <button className="button" onClick={() => { cerrarSesion(); navigate("/login", { replace: true }); }}>Cerrar sesión</button>
    </main>
  );
}

export default ProfilePage;
