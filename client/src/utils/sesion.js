export const TOKEN_KEY = "hermanos-jota-token";

export function leerToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function guardarToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* La sesión puede funcionar en memoria si el almacenamiento está bloqueado. */ }
}

// Solo sirve para programar el cierre de sesión; la firma la verifica la API.
export function vencimientoToken(token) {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return Number.isSafeInteger(payload.exp) && payload.exp > 0 ? payload.exp * 1000 : null;
  } catch { return null; }
}

export function destinoTrasLogin(from) {
  const ruta = from?.pathname;
  if (typeof ruta !== "string" || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\") ||
      ruta === "/login" || ruta === "/registro") return "/perfil";
  return ruta + (typeof from.search === "string" ? from.search : "") + (typeof from.hash === "string" ? from.hash : "");
}
