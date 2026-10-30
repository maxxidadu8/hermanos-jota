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

Este cliente se recuperó de la segunda entrega en `main`. La API actual utiliza
MongoDB, mientras que esta interfaz todavía espera `id`, `imagen` y `detalles`
del catálogo anterior. La adaptación a `_id`, `imagenUrl`, `precio` y `stock`,
React Router y los formularios de productos se realizarán en los siguientes
pasos. La compilación comprueba la integración de los archivos; no implica que
el CRUD desde la interfaz ya esté terminado.

Mantener dos terminales: una en `backend` con `npm start` y otra en `client`
con `npm run dev`. El backend requiere configurar previamente su `.env`.
