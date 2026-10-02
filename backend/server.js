const app = require("./app");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API de Hermanos Jota disponible en http://localhost:${PORT}`);
});
