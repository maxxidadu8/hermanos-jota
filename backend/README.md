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

## Cuerpos JSON

El middleware global `express.json()` se monta antes de las rutas. Cuando una
petición envía `Content-Type: application/json`, convierte su cuerpo JSON en un
objeto disponible en `req.body` para las futuras rutas POST.

Este middleware prepara la lectura del cuerpo; las rutas POST se implementarán
cuando corresponda.

## Respuestas de error

Después de las rutas se monta el manejador de rutas inexistentes y, al final,
el manejador centralizado de errores. Las rutas pueden enviar un error a este
último con `next(error)`.

- Ruta inexistente: `404` y `{ "error": "Ruta no encontrada" }`.
- Producto inexistente: `404` y `{ "error": "Producto no encontrado" }`.
- Cuerpo JSON inválido: `400` y `{ "error": "JSON inválido en el cuerpo de la petición" }`.
- Error interno: `500` y `{ "error": "Error interno del servidor" }`. El detalle
  se registra en la terminal, sin enviar el stack al cliente.

Después de reiniciar el servidor, se pueden comprobar estas respuestas desde
otra terminal:

```bash
curl -i http://localhost:3001/ruta-inexistente
curl -i http://localhost:3001/api/productos/no-existe
curl -i -X POST http://localhost:3001/api/productos -H 'Content-Type: application/json' -d '{"nombre":'
```

La última petición comprueba el procesamiento del JSON antes de las rutas,
aunque todavía no haya una ruta POST permanente.

## Organización

- `app.js`: configura Express y monta las rutas.
- `server.js`: inicia el servidor HTTP.
- `routes/productos.js`: define las rutas mediante `express.Router`.
- `controllers/productosController.js`: lista los productos y busca por ID;
  envía los errores al manejador centralizado mediante `next(error)`.
- `middlewares/logger.js`: registra el método y la URL de todas las peticiones.
- `middlewares/notFound.js`: envía un error 404 cuando ninguna ruta coincide.
- `middlewares/errorHandler.js`: centraliza las respuestas de error en JSON.
- `data/productos.js`: contiene los datos locales del catálogo.
