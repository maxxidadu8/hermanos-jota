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

- `src/App.jsx`: estado global (vista actual, productos, carrito) y petición a
  `GET /api/productos` con sus estados de carga y error.
- `src/components/`: `Navbar`, `Footer`, `Home`, `Catalog`, `ProductList`,
  `ProductCard`, `ProductDetail`, `ContactForm` y `CartDrawer`.
- `src/styles.css`: estilos del sitio original.
- `public/assets/img/`: imágenes de los productos y logo.

La navegación entre vistas se resuelve con renderizado condicional, sin router.
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

React Router y los formularios CRUD están pendientes. La navegación sigue
resuelta mediante estado de React en este paso.

Mantener dos terminales: una en `backend` con `npm start` y otra en `client`
con `npm run dev`. El backend requiere configurar previamente su `.env`.
