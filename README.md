# Hermanos Jota

## Aplicación React y API (tercera entrega en curso)

La aplicación actual se organiza en `client` (React y Vite) y `backend`
(Express, Mongoose y MongoDB Atlas). Requiere Node.js 22.12.0 o superior.

- Configurar e iniciar la API siguiendo [backend/README.md](backend/README.md).
- En otra terminal, ejecutar `cd client`, `npm ci` y `npm run dev`.
- Abrir `http://localhost:5173`. Para compilar el frontend, ejecutar
  `npm run build` dentro de `client`.

El cliente se incorporó desde la segunda entrega. La adaptación al modelo de
MongoDB, el ruteo y los formularios CRUD están pendientes. Ver el estado en
[client/README.md](client/README.md).

Los HTML y archivos de la raíz descritos debajo corresponden al sitio original.

Sitio estático para la mueblería Hermanos Jota. Incluye inicio, catálogo con búsqueda, detalle de producto, carrito simulado y formulario de contacto con validación del lado del cliente.

## Tecnologías

- HTML5 semántico
- CSS3 Mobile First (Flexbox y Grid)
- JavaScript vanilla (DOM, eventos, array de objetos, `setTimeout` y `localStorage`)

## Ejecución

Abrir `index.html` en un navegador o servir la carpeta con cualquier servidor estático.

## Integrantes

- Ezequiel Lagos
- Fabricio Almuna
- Maximiliano Dadurian
- Felipe Gazcon