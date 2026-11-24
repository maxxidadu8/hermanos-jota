function obtenerConfigJWT() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("Configurá JWT_SECRET con una clave aleatoria de al menos 32 bytes");
  }
  return {
    secret,
    algorithm: "HS256",
    expiresIn: 3600,
    issuer: "hermanos-jota-api",
    audience: "hermanos-jota-web",
  };
}

module.exports = obtenerConfigJWT;
