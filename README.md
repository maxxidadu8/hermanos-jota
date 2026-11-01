# Hermanos Jota

## Despliegues

- Frontend: https://hermanos-jota-mu.vercel.app/
- Backend: https://hermanos-jota-ja99.onrender.com
- API de productos: https://hermanos-jota-ja99.onrender.com/api/productos

## Aplicación React y API (tercera entrega)

La aplicación actual se organiza en `client` (React y Vite) y `backend`
(Express, Mongoose y MongoDB Atlas). Requiere Node.js 22.12.0 o superior.

El cliente se incorporó desde la segunda entrega. El catálogo y el carrito
ya utilizan el modelo de MongoDB y las páginas públicas tienen rutas con React
Router. El alta, la edición y la eliminación de productos ya están implementadas
desde React. La eliminación requiere confirmación. Ver el estado en
[client/README.md](client/README.md).

## Ejecución

Usar dos terminales, ambas ubicadas inicialmente en la raíz del repositorio.

### Terminal 1: backend

```bash
cd backend
npm ci
cp .env.example .env
```

Editar `backend/.env` con los datos de MongoDB Atlas y luego iniciar la API:

```bash
npm start
```

La API queda disponible en `http://localhost:3001/api/productos`. Para más
detalles, ver [backend/README.md](backend/README.md).

Para cargar los 11 muebles originales en MongoDB, ejecutar `npm run seed` desde
`backend`. Sus precios y stock son datos ficticios de demostración; la carga no
sobrescribe los productos existentes.

### Terminal 2: frontend

```bash
cd client
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Para compilar el frontend, ejecutar
`npm run build` dentro de `client`.

### Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `MONGODB_URI` | Sí | Cadena de conexión de MongoDB Atlas, incluyendo la base de datos. |
| `PORT` | No | Puerto de la API. Por defecto es `3001`, el que usa el proxy de Vite en desarrollo. |

En local se configuran en `backend/.env`, que no se sube al repositorio. En
Render, `MONGODB_URI` se configura en las variables de entorno del servicio; el
puerto lo define Render.

## Sitio original

Los HTML y archivos de la raíz corresponden al sitio original.

Sitio estático para la mueblería Hermanos Jota. Incluye inicio, catálogo con búsqueda, detalle de producto, carrito simulado y formulario de contacto con validación del lado del cliente.

### Tecnologías

- HTML5 semántico
- CSS3 Mobile First (Flexbox y Grid)
- JavaScript vanilla (DOM, eventos, array de objetos, `setTimeout` y `localStorage`)

### Ejecución

Abrir `index.html` en un navegador o servir la carpeta con cualquier servidor estático.

## Integrantes

- Ezequiel Lagos
- Fabricio Almuna
- Maximiliano Dadurian
- Felipe Gazcon
