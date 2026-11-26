# Backend de Hermanos Jota

API de productos, autenticación y pedidos construida con Node.js, Express y Mongoose.

## Ejecución

Desde esta carpeta:

```bash
npm install
cp .env.example .env
```

Editar `backend/.env`, configurar `JWT_SECRET` con una clave aleatoria de al menos
32 bytes (ver Configuración de JWT) y reemplazar el ejemplo de `MONGODB_URI` por la cadena de
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
Si falta la URI, `JWT_SECRET` es inválido o la conexión falla, termina con código de error y muestra un
mensaje sin exponer credenciales. La selección del servidor tiene un tiempo
máximo de 10 segundos.

Los endpoints GET consultan MongoDB mediante el modelo `Product`. El array de
`data/productos.js` es la fuente del script de carga inicial y no se usa para
responder estas peticiones. Una base sin productos devuelve `[]`.

## Modelo Product

El modelo se define en `models/Product.js` mediante un esquema de Mongoose:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| `nombre` | String | Sí |
| `descripcion` | String | No |
| `precio` | Number | Sí |
| `stock` | Number | No |
| `imagenUrl` | String | No |

Mongoose genera automáticamente un `_id` para cada producto. El esquema exige un precio finito mayor o igual a cero y, cuando se indica, un
stock entero seguro no negativo. El precio `0`, el stock `0` y el stock omitido
o `null` son válidos. Estas validaciones se ejecutan al guardar con el modelo,
aunque la escritura provenga de un script en lugar del controlador. Las
actualizaciones directas mediante operaciones de Mongoose requieren
`runValidators: true` para ejecutar los validadores de actualización.

El servidor utiliza el puerto `3001` por defecto. Se puede cambiar con la variable
de entorno `PORT`. Para reiniciar automáticamente al editar los archivos, usar
`npm run dev`.

## Rutas

- `DELETE /api/productos/:id`: elimina el producto por `_id` y devuelve `204`
  sin cuerpo. Responde `400` si el ID tiene formato inválido y `404` si el
  producto no existe o ya fue eliminado.

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
- `controllers/productosController.js`: lista, busca por ID, crea, actualiza y elimina productos;
  envía los errores al manejador centralizado mediante `next(error)`.
- `middlewares/logger.js`: registra el método y la URL de todas las peticiones.
- `middlewares/notFound.js`: envía un error 404 cuando ninguna ruta coincide.
- `middlewares/errorHandler.js`: centraliza las respuestas de error en JSON.
- `data/productos.js`: catálogo original, fuente de la carga inicial.
- `data/productosIniciales.js`: transforma el catálogo al modelo actual y asigna valores de ejemplo.
- `scripts/cargarCatalogo.js`: inserta las piezas iniciales sin sobrescribir las existentes.

## Pruebas locales

Desde `backend`, ejecutar `npm test`. Las pruebas verifican las consultas y el
manejo de errores con respuestas simuladas del modelo; no requieren Atlas ni
sustituyen una prueba real de conexión y consulta a MongoDB.

## Ejemplos de escrituras autenticadas

Los siguientes ejemplos requieren definir localmente `TOKEN` con el JWT obtenido
al registrarse o iniciar sesión. Sin Bearer, la API devuelve `401`. No publicar
el token ni incorporarlo al repositorio.

## Crear un producto

Con la API iniciada, desde otra terminal:

```bash
curl -i -X POST http://localhost:3001/api/productos \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Mesa de prueba","descripcion":"Producto de prueba","precio":1000,"stock":2,"imagenUrl":""}'
```

Esta petición guarda un producto real en la base configurada. La respuesta debe
ser `201`. Consultar `GET /api/productos` permite comprobar que quedó guardado.
Los cinco endpoints del CRUD están implementados.

## Actualizar un producto

Reemplazar el ID de ejemplo por el `_id` de un producto existente:

```bash
curl -i -X PUT http://localhost:3001/api/productos/507f1f77bcf86cd799439011 \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"precio":1500,"stock":3}'
```

La respuesta debe ser `200` con el producto actualizado. Consultar luego el
mismo ID mediante GET permite comprobar que los cambios quedaron guardados.

## Eliminar un producto

Reemplazar el ID de ejemplo por el `_id` del producto que se quiere eliminar.
Esta operación borra el producto de la base configurada:

```bash
curl -i -X DELETE http://localhost:3001/api/productos/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"
```

La respuesta debe ser `204`, sin JSON. Un GET posterior al mismo ID devuelve
`404`, y el producto deja de aparecer en el listado. Repetir DELETE sobre ese ID
también devuelve `404`.

## Carga del catálogo original

Con `MONGODB_URI` configurada en `backend/.env`, ejecutar desde `backend`:

```bash
npm run seed
```

Carga los 11 muebles originales con nombre, descripción e imagen, más precios
y stock **ficticios para la entrega**. No son precios comerciales ni inventario
real. Los valores se definen en `data/productosIniciales.js` y se pueden editar
después desde React. Sillón Copacabana tiene stock cero para demostrar el estado
sin disponibilidad. La consigna no establece importes ni cantidades concretas.

Cada pieza inicial tiene un `_id` estable derivado de su identificador original.
La carga utiliza `$setOnInsert`: repetirla no duplica esas piezas ni cambia sus
campos, aunque se hayan editado o renombrado desde la aplicación. Tampoco borra
ni modifica otros productos, como los creados para probar el CRUD. Si se elimina
una pieza inicial y se ejecuta nuevamente el script, esa pieza se vuelve a crear.
Los productos creados manualmente con otro `_id` se consideran independientes,
aunque tengan el mismo nombre.

El comando muestra cuántos productos creó y cuántos ya existían, y cierra la
conexión al terminar. Si la conexión falla a mitad de la carga, se puede volver
a ejecutar para completar las piezas restantes. No se ejecuta al iniciar el
servidor: la carga se realiza únicamente con este comando.

## Cuarta entrega: modelo de usuario

El modelo `User` de `models/User.js` incorpora `nombre`, `email` y `password`
obligatorios. El nombre se recorta y el email se guarda en minúsculas, sin
espacios al principio o al final, con un índice único para impedir duplicados.
El registro maneja también el error de email duplicado de MongoDB:
`unique` define un índice, no un validador de Mongoose.

La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes UTF-8.
Antes de guardarla con `create()` o `save()`, el modelo genera un hash bcrypt
con factor de trabajo 12. El hook solo actúa cuando cambia la contraseña, por
lo que editar el nombre no vuelve a hashearla. No usar actualizaciones directas
como `updateOne()` para cambiar contraseñas: no ejecutan el hook de `save()`.

La contraseña está excluida de las consultas por defecto y de `toJSON()` y
`toObject()`. Para verificarla, el login la selecciona explícitamente
con `.select("+password")` y usa `usuario.compararPassword(valor)`; nunca se
incluye el hash en la respuesta de la API.

Las pruebas de usuario simulan las escrituras de la colección para comprobar
el hook real de Mongoose sin conectar con Atlas.

## Registro y login con JWT

| Endpoint | Datos JSON | Resultado |
| --- | --- | --- |
| `POST /api/auth/registro` | `nombre`, `email`, `password` | `201` con `{ token, usuario }` |
| `POST /api/auth/login` | `email`, `password` | `200` con `{ token, usuario }` |

`usuario` contiene únicamente `_id`, `nombre` y `email`, nunca el hash. Las
respuestas de sesión llevan `Cache-Control: no-store`. Registro y login
normalizan el email y rechazan tipos incorrectos antes de consultar MongoDB.
Un email duplicado al registrar devuelve `409`. Credenciales incorrectas en el
login devuelven `401` con el mismo mensaje, tanto si el email no existe como si
la contraseña no coincide. Datos mal formados devuelven `400`.

### Configuración de JWT

Agregar `JWT_SECRET` en `backend/.env`: debe ser una clave privada aleatoria de
al menos 32 bytes. Para generar una, ejecutar localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copiar el resultado como valor de `JWT_SECRET`, sin publicarlo ni agregarlo a
`.env.example`. Cada entorno debe gestionar su propia clave. En Render hay que
configurar `JWT_SECRET` en Environment **antes de desplegar esta versión**.
No configurarlo en Vercel ni en una variable `VITE_`: solo lo usa el backend.

La API verifica esta configuración antes de arrancar y espera a que se cree el
índice único de email. Los tokens se firman con HS256, duran una hora y llevan
el `_id` del usuario en `sub`, emisor `hermanos-jota-api` y audiencia
`hermanos-jota-web`. No contienen contraseñas.

El middleware `middlewares/autenticar.js` verifica `Authorization: Bearer <token>`.
El perfil, las escrituras de productos y los pedidos ya requieren autenticación.
El frontend integra la sesión mediante `AuthContext`, rutas protegidas y
peticiones autenticadas con Bearer.

## Endpoints protegidos

Enviar el JWT devuelto por registro o login en la cabecera
`Authorization: Bearer <token>`. El middleware valida firma, algoritmo HS256,
emisor, audiencia y vencimiento. También exige un `sub` de tipo ObjectId, una
expiración definida y que el usuario siga existiendo en MongoDB.

| Endpoint | Acceso |
| --- | --- |
| `GET /api/productos` | Público |
| `GET /api/productos/:id` | Público |
| `POST /api/auth/registro` | Público |
| `POST /api/auth/login` | Público |
| `GET /api/auth/perfil` | Autenticado |
| `POST /api/productos` | Autenticado |
| `PUT /api/productos/:id` | Autenticado |
| `DELETE /api/productos/:id` | Autenticado |
| `POST /api/pedidos` | Autenticado |
| `GET /api/pedidos` | Autenticado |

El perfil responde `200` con `{ usuario: { _id, nombre, email } }` y no se cachea.
No devuelve contraseña ni hash. Los datos del usuario provienen de la base,
identificada mediante el token verificado, nunca del cuerpo de la petición.

Sin Bearer válido, con un token vencido o alterado, o con una cuenta eliminada,
se devuelve `401`. Una configuración inválida o un fallo de MongoDB devuelve
`500`, sin revelar el token ni información interna. No se definieron roles en
esta consigna: en esta etapa cualquier usuario autenticado puede gestionar
productos.

Las pruebas HTTP locales usan una API en un puerto temporal y simulan la capa
de datos; comprueban que las rutas estén realmente protegidas sin crear usuarios
ni productos en Atlas. El frontend ya incorpora la sesión mediante AuthContext y envía el Bearer en
las operaciones de productos y pedidos. `CartContext` gestiona el carrito y la
confirmación; `/mis-pedidos` consulta el historial del usuario autenticado.

## Pedidos del usuario

El modelo `Order` guarda el usuario autenticado, las líneas del pedido, el total,
la moneda `ARS`, el estado `pendiente` y las fechas de creación y actualización.
Cada línea conserva referencia al producto, nombre e imagen del momento, precio
unitario, cantidad y subtotal. El historial se lee sin poblar el catálogo actual,
por lo que cambios o eliminaciones de productos no alteran pedidos anteriores.

### Crear un pedido

`POST /api/pedidos`, con `Authorization: Bearer <token>` y cuerpo JSON:

```json
{
  "items": [
    { "productoId": "af42d37d95c98624f3f62bf3", "cantidad": 2 }
  ]
}
```

El ID debe existir en la base de destino. El servidor ignora cualquier usuario,
nombre, precio, subtotal, total, moneda o estado enviados por el cliente: obtiene
la identidad del JWT y los productos de MongoDB. Admite entre 1 y 100 líneas,
con IDs válidos y cantidades enteras positivas. Suma las cantidades de productos
repetidos antes de validar disponibilidad.

Los precios se redondean a centavos y los cálculos se hacen con enteros para
evitar errores como `0.1 + 0.2`. Si el producto declara stock, se comprueba que
alcance; si el stock está ausente o es `null`, no se impone un límite. Se rechazan
importes fuera de la precisión segura.

La respuesta es `201` con el pedido guardado. Datos inválidos devuelven `400`,
productos inexistentes `404` y stock insuficiente o precio no disponible `409`.
Si una línea es inválida, no se guarda un pedido parcial. Los fallos de base
devuelven `500` sin confirmar el pedido.

Este flujo registra pedidos: no cobra pagos ni reserva o descuenta inventario.
La disponibilidad se verifica al consultar el catálogo, sin una reserva
transaccional entre compras simultáneas. La consigna no exige pasarela de pagos
ni gestión transaccional de inventario.

### Consultar mis pedidos

`GET /api/pedidos`, con el mismo Bearer, devuelve `200` y un array con los pedidos
del usuario del token, desde el más reciente. Una cuenta sin pedidos recibe `[]`.
No se acepta un usuario alternativo por query ni por el cuerpo de la petición.
Las respuestas de pedidos usan `Cache-Control: no-store`. Las pruebas incluyen
dos usuarios distintos para comprobar el aislamiento, sin escribir datos en Atlas.
