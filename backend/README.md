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

Los endpoints GET consultan MongoDB mediante el modelo `Product`. El array de
`data/productos.js` queda como referencia del catálogo anterior y ya no se usa
para responder estas peticiones. Una base sin productos devuelve `[]`; todavía
no se migraron los productos del catálogo anterior.

## Modelo Product

El modelo se define en `models/Product.js` mediante un esquema de Mongoose:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| `nombre` | String | Sí |
| `descripcion` | String | No |
| `precio` | Number | Sí |
| `stock` | Number | No |
| `imagenUrl` | String | No |

Mongoose genera automáticamente un `_id` para cada producto. El precio `0` es
válido: obligatorio significa que el campo debe estar presente, sin establecer
un precio mínimo en esta etapa.

El servidor utiliza el puerto `3001` por defecto. Se puede cambiar con la variable
de entorno `PORT`. Para reiniciar automáticamente al editar los archivos, usar
`npm run dev`.

## Rutas

- `PUT /api/productos/:id`: actualiza los campos enviados y conserva los omitidos.
  Devuelve `200` con el producto actualizado, `400` por ID o datos inválidos y
  `404` si el producto no existe. Valida el documento antes de guardarlo.
  Solo admite los cinco campos del modelo; no permite cambiar `_id`. Un cuerpo
  sin campos permitidos se rechaza con `400`.

- `POST /api/productos`: crea un producto en MongoDB y responde `201` con el
  documento guardado, incluido su `_id`. Solo acepta los cinco campos del modelo.
  Si el cuerpo no es un objeto o falla la validación de Mongoose, responde `400`.

- `GET /api/productos`: responde con estado `200` y el array completo de productos
  en formato JSON, consultado con `Product.find()` en MongoDB.
- `GET /api/productos/:id`: responde con estado `200` y el objeto del producto
  cuyo `_id` coincide con el solicitado, consultado con `Product.findById()`.
  Si el ID tiene formato inválido, responde `400`. Si tiene formato válido pero
  no existe, responde `404` y `{ "error": "Producto no encontrado" }`.

Para comprobar la respuesta, abrir `http://localhost:3001/api/productos` en el
navegador o ejecutar:

```bash
curl http://localhost:3001/api/productos
```

Ejemplos de búsqueda por ID:

```bash
# Reemplazar el ID de ejemplo por un _id obtenido del listado.
curl -i http://localhost:3001/api/productos/507f1f77bcf86cd799439011
curl -i http://localhost:3001/api/productos/no-existe
```

Los IDs son ObjectId de MongoDB, representados por 24 caracteres hexadecimales.
Los identificadores anteriores como `butaca-mendoza` ya no son válidos. Si se ejecuta el servidor
con `npm start`, hay que detenerlo con `Ctrl + C` y volver a iniciarlo después de
editar el código.

## Logging

El middleware global registra el método HTTP y la URL original de cada petición
en la terminal del servidor, incluyendo rutas inexistentes y parámetros de consulta:

```text
GET /api/productos
GET /api/productos/507f1f77bcf86cd799439011
GET /api/productos/no-existe
```

Se monta antes de las rutas y llama a `next()` para continuar el procesamiento.

## Cuerpos JSON

El middleware global `express.json()` se monta antes de las rutas. Cuando una
petición envía `Content-Type: application/json`, convierte su cuerpo JSON en un
objeto disponible en `req.body` para crear productos mediante POST.

## Respuestas de error

Después de las rutas se monta el manejador de rutas inexistentes y, al final,
el manejador centralizado de errores. Las rutas pueden enviar un error a este
último con `next(error)`.

- Ruta inexistente: `404` y `{ "error": "Ruta no encontrada" }`.
- Datos de creación o actualización inválidos: `400` con un mensaje de validación.
- ID inválido: `400` y `{ "error": "ID de producto inválido" }`.
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

La última petición comprueba que un cuerpo JSON mal formado se rechaza antes de
ejecutar el controlador de creación.

## Organización

- `app.js`: configura Express y monta las rutas.
- `server.js`: carga las variables de entorno y conecta la base antes de iniciar el servidor HTTP.
- `config/db.js`: establece la conexión con MongoDB mediante Mongoose.
- `models/Product.js`: define el esquema y el modelo de productos.
- `routes/productos.js`: define las rutas mediante `express.Router`.
- `controllers/productosController.js`: lista, busca por ID, crea y actualiza productos;
  envía los errores al manejador centralizado mediante `next(error)`.
- `middlewares/logger.js`: registra el método y la URL de todas las peticiones.
- `middlewares/notFound.js`: envía un error 404 cuando ninguna ruta coincide.
- `middlewares/errorHandler.js`: centraliza las respuestas de error en JSON.
- `data/productos.js`: referencia del catálogo anterior, sin uso en los endpoints GET.

## Pruebas locales

Desde `backend`, ejecutar `npm test`. Las pruebas verifican las consultas y el
manejo de errores con respuestas simuladas del modelo; no requieren Atlas ni
sustituyen una prueba real de conexión y consulta a MongoDB.

## Crear un producto

Con la API iniciada, desde otra terminal:

```bash
curl -i -X POST http://localhost:3001/api/productos \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Mesa de prueba","descripcion":"Producto de prueba","precio":1000,"stock":2,"imagenUrl":""}'
```

Esta petición guarda un producto real en la base configurada. La respuesta debe
ser `201`. Consultar `GET /api/productos` permite comprobar que quedó guardado.
Por ahora, DELETE está pendiente de implementación.

## Actualizar un producto

Reemplazar el ID de ejemplo por el `_id` de un producto existente:

```bash
curl -i -X PUT http://localhost:3001/api/productos/507f1f77bcf86cd799439011 \
  -H 'Content-Type: application/json' \
  -d '{"precio":1500,"stock":3}'
```

La respuesta debe ser `200` con el producto actualizado. Consultar luego el
mismo ID mediante GET permite comprobar que los cambios quedaron guardados.
