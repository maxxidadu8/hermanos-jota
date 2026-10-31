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
| Cualquier otra | Página no encontrada |

El detalle permite acceso directo y recarga, muestra carga y errores y permite
reintentar. El botón para volver al catálogo utiliza `useNavigate`. Los enlaces
permiten abrir páginas en otra pestaña y usar Atrás/Adelante del navegador.

La ruta `/admin/crear-producto` y su formulario se incorporarán en el próximo
paso, junto con la navegación después de guardar. Edición y eliminación desde
React también están pendientes.

Para publicar con `BrowserRouter`, el hosting del frontend deberá devolver
`index.html` para las rutas de la aplicación. Esa configuración se agregará en
la etapa de despliegue; Vite ya ofrece ese comportamiento en desarrollo.

Mantener dos terminales: una en `backend` con `npm start` y otra en `client`
con `npm run dev`. El backend requiere configurar previamente su `.env`.
