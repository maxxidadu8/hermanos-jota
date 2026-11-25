# Cliente de Hermanos Jota

Frontend en React (Vite) que consume la API de `../backend`.

## Ejecución

Usar Node.js 22.12.0 o superior.

Con el backend corriendo en el puerto `3001` (`npm start` dentro de `backend/`):

```bash
npm install
npm run dev
```

Vite sirve la aplicación en `http://localhost:5173` y redirige las peticiones
`/api` al backend (ver `vite.config.js`), por lo que no hace falta configurar CORS.

## Organización

- `src/App.jsx`: rutas, estado global de productos y carrito, y petición a
  `GET /api/productos` con sus estados de carga y error.
- `src/components/`: `Navbar`, `Footer`, `Home`, `Catalog`, `ProductList`,
  `ProductCard`, `ProductDetail`, `ContactForm` y `CartDrawer`.
- `src/styles.css`: estilos del sitio original.
- `public/assets/img/`: imágenes de los productos y logo.

La navegación utiliza `BrowserRouter`, `Routes`, `Route`, `Link` y `NavLink` de
React Router DOM. El carrito permanece en `App` al cambiar de página.
El formulario de contacto todavía no se envía al backend: no hay una ruta de
contacto. La API sí permite crear productos mediante POST.

## Estado de la integración

Este cliente se recuperó de la segunda entrega en `main` y ahora utiliza `_id`
para identificar los productos en el catálogo y el carrito. Muestra `imagenUrl`,
`precio` en pesos argentinos y `stock`; ya no requiere el campo `detalles` del
catálogo anterior. La descripción y la imagen son opcionales: las imágenes
ausentes o que no cargan se reemplazan por el logo. Se admiten rutas locales y
URLs completas de imágenes.

La base vacía y las búsquedas sin resultados muestran mensajes. Los productos
sin stock no se pueden añadir desde el detalle. El carrito continúa siendo
simulado: muestra el total, pero no reserva ni descuenta stock en MongoDB.

## Rutas del frontend

| Ruta | Página |
| --- | --- |
| `/` | Inicio |
| `/productos` | Catálogo |
| `/productos/:id` | Detalle, con `useParams` y consulta a la API por `_id` |
| `/contacto` | Formulario de contacto |
| `/registro` | Registro de usuario |
| `/login` | Inicio de sesión |
| `/perfil` | Perfil autenticado |
| `/admin/crear-producto` | Alta, requiere sesión |
| `/admin/editar-producto/:id` | Edición, requiere sesión |
| Cualquier otra | Página no encontrada |

El detalle permite acceso directo y recarga, muestra carga y errores y permite
reintentar. El botón para volver al catálogo utiliza `useNavigate`. Los enlaces
permiten abrir páginas en otra pestaña y usar Atrás/Adelante del navegador.

El enlace «Crear producto» del menú abre un formulario con los cinco campos del
modelo. Nombre y precio son obligatorios; descripción, stock e imagen son
opcionales. El precio admite cero y hasta dos decimales; el stock, cuando se
indica, debe ser un entero no negativo. Una imagen puede ser una URL completa o
una ruta local.

Al guardar, el formulario envía JSON a `POST /api/productos`. Mientras espera la
respuesta, bloquea los campos y el botón para evitar envíos repetidos. Si ocurre
un error, conserva los datos y muestra un mensaje. Si recibe `201`, actualiza el
catálogo y redirige con `useNavigate` al detalle del nuevo `_id`.

El detalle incluye un enlace «Editar producto». La página de edición obtiene
el producto mediante GET y precarga el formulario compartido `ProductForm`.
Guardar envía PUT, actualiza el catálogo y los datos del carrito, y redirige al
detalle con `useNavigate`. Cancelar vuelve al detalle sin guardar. Si se deja el
stock vacío durante la edición, se guarda como `null` (stock a consultar).
La carga maneja IDs inválidos, productos inexistentes y errores de conexión.

El detalle incluye «Eliminar producto», que abre una confirmación con el nombre
de la pieza. Cancelar o presionar Escape conserva los datos. Confirmar envía
DELETE y bloquea los botones hasta recibir la respuesta. Un `204` quita el
producto del catálogo y del carrito y redirige a `/productos` con un aviso.
Si la API responde `404`, se limpia también el estado local porque el producto
ya no existe. Otros errores se muestran en el diálogo y permiten reintentar.
El borrado es definitivo en MongoDB.

Para publicar con `BrowserRouter`, el hosting del frontend deberá devolver
`index.html` para las rutas de la aplicación. Esa configuración se agregará en
la etapa de despliegue; Vite ya ofrece ese comportamiento en desarrollo.

Mantener dos terminales: una en `backend` con `npm start` y otra en `client`
con `npm run dev`. El backend requiere configurar previamente su `.env`.

## Cuarta entrega: autenticación con Context API

`AuthProvider` envuelve la aplicación y expone `useAuth` para compartir el
usuario, la comprobación de sesión, login, registro, logout y peticiones con JWT.
Los formularios `/registro` y `/login` son controlados; la contraseña solo se
envía a la API y no se guarda en el navegador.

El JWT se conserva en `localStorage` bajo `hermanos-jota-token` para mantener la
sesión al recargar. Al iniciar, el contexto consulta `GET /api/auth/perfil` con
`Authorization: Bearer <token>`: no considera autenticado a un usuario por
limitarse a decodificar el token. La expiración se lee solo para programar el
logout; la firma y los permisos se verifican en el backend.

`ProtectedRoute` protege `/perfil` y la creación/edición de productos. Espera
la respuesta de perfil antes de mostrar contenido privado y redirige al login
si no hay sesión. Después del login o registro, `useNavigate` devuelve al
usuario a la ruta interna solicitada, o a `/perfil` por defecto. El contexto
permite reintentar una recuperación de sesión si falla la red sin borrar el
token válido.

El menú muestra Ingresar/Registrarme a invitados y Mi perfil/Crear producto/
Cerrar sesión a usuarios autenticados. Editar y eliminar productos también
se muestran solo con sesión. `fetchAutenticado` adjunta el Bearer a las
operaciones de productos, limita su uso a rutas `/api/` del sitio y cierra
sesión ante un `401`. Un `401` atrasado de otra sesión no cierra la nueva.
La sesión también se cierra al vencer el token y sincroniza el logout entre
pestañas.

El carrito aún está en `App`: su Context, Finalizar compra y `/mis-pedidos`
son el próximo paso. La protección del frontend no sustituye el middleware
de autorización del backend.

### Pruebas del frontend

Desde `client`, ejecutar `npm test`. Las pruebas usan Vitest, React Testing
Library y JSDOM, con respuestas de API simuladas. Comprueban registro/login,
recuperación de sesión, rutas protegidas, logout, vencimiento, errores y envío
del Bearer. No crean usuarios ni productos en Atlas. `npm run build` verifica
la compilación para producción.
