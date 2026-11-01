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
| `/admin/crear-producto` | Formulario controlado de alta de productos |
| `/admin/editar-producto/:id` | Formulario precargado de edición |
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
