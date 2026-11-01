const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const app = require("./app");
const conectarDB = require("./config/db");

const PORT = process.env.PORT || 3001;

async function iniciarServidor() {
  await conectarDB();

  app.listen(PORT, () => {
    console.log(`API de Hermanos Jota disponible en http://localhost:${PORT}`);
  });
}

iniciarServidor().catch(() => {
  // No imprimir la URI ni errores del driver que puedan contener credenciales.
  console.error(
    "No se pudo iniciar la API. Revisá MONGODB_URI en backend/.env, las credenciales y el acceso de red a MongoDB.",
  );
  process.exit(1);
});
