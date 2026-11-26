# Mueblería Hermanos Jota

Proyecto final del curso: e-commerce MERN con catálogo, CRUD de productos,
autenticación y pedidos asociados a cada usuario. Cuarta entrega, Sprints 7 y 8.

## Enlaces públicos

- [Aplicación frontend en Vercel](https://hermanos-jota-mu.vercel.app/)
- [API backend en Render](https://hermanos-jota-backend-h4z1.onrender.com/api/productos)
- [Repositorio en GitHub](https://github.com/maxxidadu8/hermanos-jota)

El enlace de la API muestra el catálogo público en JSON. El perfil y los pedidos
requieren un JWT válido; abrirlos sin sesión devuelve `401`.

## Funcionalidades

- Catálogo con búsqueda, detalle de producto e imágenes de respaldo.
- Registro con contraseñas hasheadas mediante bcrypt e inicio de sesión con JWT.
- Sesión persistente al recargar, navegación condicional y cierre de sesión.
- Perfil e historial de pedidos protegidos con React Router y middleware de API.
- Autenticación y carrito compartidos mediante React Context API.
- Carrito con cantidades, control del stock conocido y total estimado.
- Confirmación de pedidos con el usuario del JWT y precios calculados en el servidor.
- Vaciado del carrito únicamente después de confirmar un pedido exitoso.
- Alta, edición y eliminación de productos disponibles para usuarios autenticados.

## Arquitectura

```text
Navegador: React + React Router + AuthContext + CartContext
                         |
                 /api/* (mismo origen)
                         |
        Vite en desarrollo / rewrites de Vercel en producción
                         |
                 API Express en Render
          rutas -> middleware JWT -> controladores
                         |
                  Modelos Mongoose
               Product / User / Order
                         |
                    MongoDB Atlas
```

`AuthContext` conserva el JWT en `localStorage` y verifica la sesión mediante
`GET /api/auth/perfil` antes de mostrar contenido protegido. Las peticiones
privadas incluyen `Authorization: Bearer <token>`. El backend valida la firma,
el vencimiento, el emisor y la audiencia; también verifica que el usuario exista.
Los tokens duran una hora y las respuestas no incluyen contraseñas ni hashes.

`CartContext` mantiene los productos al navegar y al iniciar sesión. Finalizar
compra redirige al invitado a login y luego vuelve a la confirmación conservando
el carrito. El carrito está en memoria: se reinicia al recargar la página.

El servidor obtiene la identidad del token y consulta los precios en MongoDB;
no confía en un usuario o total enviados por el navegador. Cada pedido conserva
los datos de sus productos al crearse y solo aparece en el historial de su dueño.

## Estructura

- `client/`: frontend React y Vite, componentes, contextos, rutas y pruebas.
- `backend/`: API Express, modelos, controladores, middleware y pruebas.
- `client/vercel.json`: proxy hacia Render y resolución de rutas de React.
- Archivos HTML, `css/`, `js/` y `assets/` de la raíz: sitio estático de las
  entregas iniciales. La aplicación actual se ejecuta desde `client/`.

## Ejecución local

Requiere Node.js 22.12.0 o superior, npm y acceso a MongoDB Atlas.

### Backend

Desde la raíz del repositorio:

```bash
cd backend
npm ci
cp .env.example .env
```

Si ya existe un `.env` configurado, conservarlo. Completar sus valores siguiendo
la tabla de variables de entorno. En Atlas, habilitar la IP de la computadora y
usar un usuario de base de datos con acceso a la base correspondiente.

Generar un secreto aleatorio para JWT con:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Guardar el resultado en `JWT_SECRET` dentro de `.env` y arrancar la API:

```bash
npm start
```

El servidor valida la configuración, conecta MongoDB y prepara el índice único
de email antes de escuchar en `http://localhost:3001`.

### Frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd client
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Vite redirige `/api/*` a `http://localhost:3001`.
Si se modifica el puerto local de la API, actualizar también el proxy en
`client/vite.config.js`.

## Variables de entorno

| Variable | Entorno | Uso |
| --- | --- | --- |
| `MONGODB_URI` | Backend local y Render | Cadena completa de Atlas con usuario, contraseña y nombre de la base. |
| `JWT_SECRET` | Backend local y Render | Clave aleatoria privada de al menos 32 bytes para firmar y verificar JWT. |
| `PORT` | Backend | Opcional en local; por defecto `3001`. Render asigna su puerto automáticamente. |

`backend/.env.example` contiene solo ejemplos. El archivo `.env` está excluido de
Git. No publicar credenciales ni configurar `MONGODB_URI` o `JWT_SECRET` como
variables del frontend o con prefijo `VITE_`. Si la contraseña de Atlas contiene
caracteres especiales, deben codificarse para una URL en la cadena de conexión.

El frontend usa rutas relativas `/api/` y no necesita secretos de entorno.
La dirección pública del backend se configura en `client/vercel.json`.

## Rutas y API

| Ruta del frontend | Acceso |
| --- | --- |
| `/`, `/productos`, `/productos/:id`, `/contacto` | Público |
| `/registro`, `/login` | Formularios de acceso |
| `/perfil`, `/mis-pedidos`, `/finalizar-compra` | Autenticado |
| `/admin/crear-producto`, `/admin/editar-producto/:id` | Autenticado |

| Endpoint | Acceso y resultado |
| --- | --- |
| `GET /api/productos` | Público; catálogo. |
| `GET /api/productos/:id` | Público; detalle por `_id`. |
| `POST /api/auth/registro` | Público; devuelve `201` con `{ token, usuario }`. |
| `POST /api/auth/login` | Público; devuelve `{ token, usuario }`. |
| `GET /api/auth/perfil` | Autenticado; datos públicos del usuario. |
| `POST /api/productos` | Autenticado; creación de producto. |
| `PUT /api/productos/:id` | Autenticado; actualización de producto. |
| `DELETE /api/productos/:id` | Autenticado; eliminación con respuesta `204`. |
| `POST /api/pedidos` | Autenticado; registra pedido y responde `201`. |
| `GET /api/pedidos` | Autenticado; devuelve solo los pedidos del usuario. |

La creación del pedido recibe `{ "items": [{ "productoId": "ID", "cantidad": 1 }] }`.
Las credenciales se envían como `email` y `password`; el registro también requiere
`nombre`. Consultar detalles y validaciones en [backend/README.md](backend/README.md)
y [client/README.md](client/README.md).

## Despliegue

### Render

- Servicio web Node conectado a este repositorio.
- Directorio raíz: `backend`.
- Build Command: `npm ci`.
- Start Command: `npm start`.
- Configurar `MONGODB_URI` y `JWT_SECRET` en Environment.
- Autorizar en Atlas los rangos de IP salientes que indique el servicio de Render.
- La rama seleccionada debe contener esta versión; el servicio se configuró con
  `rama-express`. Si se cambia a `main`, integrar primero los cambios allí.

El plan gratuito puede suspender el servicio tras un período de inactividad;
la primera petición puede tardar mientras se reactiva.

### Vercel

- Proyecto conectado a este repositorio; producción desde `main`.
- Root Directory: `client`; framework: Vite.
- Build Command: `npm run build`; Output Directory: `dist`.
- `client/vercel.json` redirige `/api/*` al backend actual de Render y las rutas
  de React a `index.html`, permitiendo abrir y recargar páginas internas.
- Integrar los cambios de `rama-express` a `main` y verificar que el nuevo
  despliegue termine correctamente antes de probar la versión pública.

Después de desplegar, probar registro, login, recarga de sesión, logout,
protección del perfil e historial, y confirmación de un pedido. Si cambia la
URL de Render, actualizar `client/vercel.json` y estos enlaces.

## Pruebas

```bash
cd backend
npm test
```

En otra terminal, desde la raíz:

```bash
cd client
npm test
npm run build
```

Las pruebas automáticas usan datos simulados y no escriben en Atlas. Cubren
bcrypt, JWT, protección de endpoints, aislamiento de pedidos entre usuarios,
validación de precios y cantidades en el modelo, sesión, rutas privadas, carrito
y errores. El frontend también prueba validación y reintentos de alta, edición,
cancelación de consultas y confirmación o cancelación del borrado de productos.
Las pruebas manuales locales con Atlas comprobaron registro, login, persistencia
de sesión, logout, acceso protegido, pedido guardado, recuperación del historial
y conservación del carrito al iniciar sesión. Repetir el circuito en producción
tras el despliegue del frontend.

## Alcance de la entrega

Los pedidos se registran con estado `pendiente` y moneda `ARS`. No se procesan
pagos ni se reserva o descuenta inventario; se verifica la disponibilidad al
crear el pedido. La consigna no solicita pasarela de pagos ni roles: cualquier
usuario autenticado puede gestionar productos. El formulario de contacto valida
datos en el navegador y no envía mensajes a una API.

La carga opcional del catálogo original se ejecuta con `npm run seed` desde
`backend`; sus precios y existencias son ficticios. El script no sobrescribe
productos existentes. Ver la documentación del backend antes de ejecutarlo.

## Integrantes

- Ezequiel Lagos
- Fabricio Almuna
- Maximiliano Dadurian
- Felipe Gazcon
