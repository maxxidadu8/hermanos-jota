# Backend de Hermanos Jota

API de productos construida con Node.js y Express.

## Ejecución

Desde esta carpeta:

```bash
npm install
npm start
```

El servidor utiliza el puerto `3001` por defecto. Se puede cambiar con la variable
de entorno `PORT`. Para reiniciar automáticamente al editar los archivos, usar
`npm run dev`.

## Rutas

- `GET /api/productos`: responde con estado `200` y el array completo de productos
  en formato JSON, tomado de `data/productos.js`.
- `GET /api/productos/:id`: responde con estado `200` y el objeto del producto
  cuyo ID coincide con el solicitado. Si no existe, responde con estado `404`
  y el JSON `{ "error": "Producto no encontrado" }`.

Para comprobar la respuesta, abrir `http://localhost:3001/api/productos` en el
navegador o ejecutar:

```bash
curl http://localhost:3001/api/productos
```

Ejemplos de búsqueda por ID:

```bash
curl -i http://localhost:3001/api/productos/butaca-mendoza
curl -i http://localhost:3001/api/productos/no-existe
```

Los IDs son textos como `butaca-mendoza`, no números. Si se ejecuta el servidor
con `npm start`, hay que detenerlo con `Ctrl + C` y volver a iniciarlo después de
editar el código.

## Logging

El middleware global registra el método HTTP y la URL original de cada petición
en la terminal del servidor, incluyendo rutas inexistentes y parámetros de consulta:

```text
GET /api/productos
GET /api/productos/butaca-mendoza
GET /api/productos/no-existe
```

Se monta antes de las rutas y llama a `next()` para continuar el procesamiento.

## Organización

- `app.js`: configura Express y monta las rutas.
- `server.js`: inicia el servidor HTTP.
- `routes/productos.js`: define las rutas mediante `express.Router`.
- `middlewares/logger.js`: registra el método y la URL de todas las peticiones.
- `data/productos.js`: contiene los datos locales del catálogo.
