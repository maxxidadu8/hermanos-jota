# Backend de Hermanos Jota

API de productos construida con Node.js y Express.

## Ejecución

Desde esta carpeta:

```bash
npm install
cp .env.example .env
```

Editar `backend/.env` y reemplazar el ejemplo de `MONGODB_URI` por la cadena de
conexión de MongoDB Atlas, incluyendo el nombre de la base `hermanos-jota`.
En Atlas, crear un usuario de base de datos y permitir la IP desde la que se
ejecutará la API. Si la contraseña contiene caracteres especiales, deben estar
codificados para una URL en la cadena de conexión.

El archivo `.env` contiene credenciales y está excluido de Git. Solo se versiona
`.env.example`, que contiene valores de ejemplo. Las variables configuradas en
el entorno de ejecución tienen prioridad sobre las del archivo.

Después de configurar la conexión:

```bash
npm start
```

La API espera a que Mongoose se conecte a MongoDB antes de escuchar peticiones.
Si falta la URI o la conexión falla, termina con código de error y muestra un
mensaje sin exponer credenciales. La selección del servidor tiene un tiempo
máximo de 10 segundos.

Este primer paso prepara la conexión: los endpoints todavía consultan el array
local. El modelo `Product` y las consultas a MongoDB se incorporarán por separado.

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
- `server.js`: carga las variables de entorno y conecta la base antes de iniciar el servidor HTTP.
- `config/db.js`: establece la conexión con MongoDB mediante Mongoose.
- `routes/productos.js`: define las rutas mediante `express.Router`.
- `controllers/productosController.js`: lista los productos y busca por ID;
  envía los errores al manejador centralizado mediante `next(error)`.
- `middlewares/logger.js`: registra el método y la URL de todas las peticiones.
- `middlewares/notFound.js`: envía un error 404 cuando ninguna ruta coincide.
- `middlewares/errorHandler.js`: centraliza las respuestas de error en JSON.
- `data/productos.js`: contiene los datos locales del catálogo.
