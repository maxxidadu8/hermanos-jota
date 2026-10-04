# Hermanos Jota — Segunda entrega

Aplicación de una mueblería con frontend en React y backend en Node.js y Express.
El cliente obtiene el catálogo mediante una API REST y permite buscar productos,
consultar sus detalles, armar un carrito y completar un formulario de contacto.

## Integrantes

- Fabricio Almuna
- Maximiliano Dadurian
- Felipe Gazcon

## Repositorio

[Repositorio en GitHub](https://github.com/maxxidadu8/hermanos-jota)

El historial de commits registra las contribuciones con sus autores. Para
consultarlo desde la terminal:

```bash
git log --format="%h %an — %s"
```

## Tecnologías y requisitos

- Frontend: React y Vite.
- Backend: Node.js y Express.
- Node.js 22.12.0 o superior y npm, para ejecutar ambos proyectos.
- Git, para clonar el repositorio.

## Instalación y ejecución

Clonar el repositorio y entrar en la carpeta principal:

```bash
git clone https://github.com/maxxidadu8/hermanos-jota.git
cd hermanos-jota
```

Si ya tenés el proyecto descargado, empezá desde esa carpeta. Usar **dos
terminales**, ambas ubicadas inicialmente en la raíz `hermanos-jota`.

### Terminal 1: backend

```bash
cd backend
npm install
npm start
```

La API queda disponible en `http://localhost:3001/api/productos`.
Para reiniciar automáticamente después de editar el backend, se puede utilizar
`npm run dev` en lugar de `npm start`.

### Terminal 2: frontend

```bash
cd client
npm install
npm run dev
```

Abrir `http://localhost:5173` para usar la aplicación. Si ese puerto está ocupado,
Vite puede elegir otro: usar la dirección que indique la terminal.

Mantener ambos servidores funcionando. Para detener cada uno, presionar
`Ctrl + C` en su terminal.

### Compilación del frontend

Desde `client`, ejecutar `npm run build`. Los archivos generados quedan en
`client/dist`. La conexión con Express descrita aquí utiliza el proxy del servidor
de desarrollo de Vite; publicar el frontend requiere configurar también cómo
llegarán las peticiones `/api` al backend.

## Arquitectura

```text
hermanos-jota/
├── backend/
│   ├── app.js                    # Configuración de Express y middlewares
│   ├── server.js                 # Inicio del servidor HTTP
│   ├── data/productos.js         # Array local de productos
│   ├── routes/productos.js       # Rutas con express.Router
│   └── middlewares/
│       ├── logger.js             # Método y URL de cada petición
│       ├── notFound.js           # Rutas inexistentes
│       └── errorHandler.js       # Respuestas de error centralizadas
└── client/
    ├── src/
    │   ├── App.jsx               # Fetch, vistas y estado del carrito
    │   ├── components/           # Componentes de la interfaz
    │   └── styles.css
    ├── public/assets/img/        # Imágenes y logo
    └── vite.config.js            # Proxy /api hacia Express
```

React realiza `fetch("/api/productos")`. Durante el desarrollo, Vite redirige esa
petición al backend en el puerto `3001`. Express lee el array de
`backend/data/productos.js` y responde en JSON; React guarda los datos en estado y
los distribuye a los componentes mediante props.

## API

| Método y ruta | Respuesta |
| --- | --- |
| `GET /api/productos` | `200`: array completo de los 11 productos. |
| `GET /api/productos/:id` | `200`: producto por ID; `404` si no existe. |
| Ruta inexistente | `404`: `{ "error": "Ruta no encontrada" }`. |

Los IDs son textos, por ejemplo `butaca-mendoza`. Para comprobar las respuestas:

```bash
curl -i http://localhost:3001/api/productos
curl -i http://localhost:3001/api/productos/butaca-mendoza
curl -i http://localhost:3001/api/productos/no-existe
```

El backend registra método y URL de todas las peticiones. `express.json()` prepara
la lectura de cuerpos JSON para futuras rutas POST. Los errores se responden como
JSON: un cuerpo JSON inválido produce `400` y un error interno produce `500`, sin
exponer su stack al cliente.

## Decisiones y alcance

- **React con Vite:** se utiliza Vite para iniciar el servidor de desarrollo y
  compilar el frontend. La arquitectura propuesta mencionaba Create React App;
  esta implementación usa Vite. React declaró Create React App deprecado y
  recomienda alternativas como Vite ([anuncio oficial](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)).
- **Datos locales en el backend:** el catálogo se mantiene en un array de objetos,
  sin base de datos. React obtiene esos datos de la API, sin un catálogo duplicado
  en sus componentes.
- **Imágenes locales:** la API devuelve la ruta de cada imagen; los archivos se
  sirven desde `client/public/assets/img`. La imagen del hero se configura
  directamente en el componente `Home`.
- **Componentes y navegación:** `Navbar`, `Footer`, `ProductCard`, `ProductList`,
  `ProductDetail` y `ContactForm` separan las responsabilidades de la interfaz.
  Las vistas se muestran mediante renderizado condicional; no se utiliza React Router.
- **Carga y errores:** la petición del catálogo muestra estados de carga y error,
  con la posibilidad de reintentar.
- **Carrito:** se mantiene con `useState` en `App.jsx`; el contador llega a `Navbar`
  mediante props. Es un carrito simulado, sin pagos ni persistencia al recargar.
- **Contacto:** los campos se controlan con `useState` y se validan en el cliente.
  El envío es simulado: no se envía un email ni se guarda en el backend.
- **Orden de middlewares:** logging, lectura JSON, rutas, manejador de 404 y
  manejador centralizado de errores.
- **Primera entrega:** los HTML, CSS, JavaScript y assets originales que permanecen
  en la raíz corresponden al sitio anterior. La segunda entrega se ejecuta desde
  `client` y `backend`, no abriendo el `index.html` original.

Ver también [documentación del backend](backend/README.md) y
[documentación del cliente](client/README.md).
