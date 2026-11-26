const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const autenticar = require("../middlewares/autenticar");
const { obtenerPerfil } = require("../controllers/authController");
const obtenerConfigJWT = require("../config/auth");

const anterior = process.env.JWT_SECRET;
process.env.JWT_SECRET = randomBytes(48).toString("hex");
after(() => {
  if (anterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = anterior;
});

const id = "507f1f77bcf86cd799439011";
const usuario = { _id: id, nombre: "Ana", email: "ana@ejemplo.com", password: "hash-que-no-debe-enviarse" };

function token(opciones = {}, secret) {
  const { secret: clave, ...config } = obtenerConfigJWT();
  return jwt.sign({}, secret ?? clave, { ...config, subject: id, ...opciones });
}

async function ejecutar(authorization) {
  const req = {
    get: nombre => nombre === "Authorization" ? authorization : undefined,
    body: { usuario: "otra-persona", usuarioId: "otra-persona" },
  };
  const llamadas = [];
  await autenticar(req, {}, error => llamadas.push(error));
  return { req, llamadas };
}

test("sin Bearer válido devuelve 401 sin consultar usuarios", async t => {
  const consulta = t.mock.method(User, "findById", () => { throw new Error("No debería consultar"); });
  for (const header of [undefined, "", "Basic abc", "Bearer", "Bearer token extra", ["Bearer abc"]]) {
    const resultado = await ejecutar(header);
    assert.equal(resultado.llamadas.length, 1);
    assert.equal(resultado.llamadas[0].status, 401);
    assert.equal(resultado.req.usuario, undefined);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("token válido consulta el usuario por sub y expone solo los datos públicos", async t => {
  let campos;
  const consulta = t.mock.method(User, "findById", () => ({ select: async valor => { campos = valor; return usuario; } }));
  const resultado = await ejecutar(`Bearer ${token()}`);
  assert.deepEqual(consulta.mock.calls[0].arguments, [id]);
  assert.equal(campos, "_id nombre email");
  assert.deepEqual(resultado.req.usuario, { _id: id, nombre: "Ana", email: "ana@ejemplo.com" });
  assert.deepEqual(resultado.llamadas, [undefined]);
});

test("rechaza tokens alterados, vencidos, mal formados o de otro algoritmo/emisor/audiencia", async t => {
  const consulta = t.mock.method(User, "findById", () => { throw new Error("No debería consultar"); });
  const sinExp = obtenerConfigJWT();
  const tokens = [
    "no-es-un-jwt",
    token({}, randomBytes(48).toString("hex")),
    token({ expiresIn: -1 }),
    token({ algorithm: "HS384" }),
    token({ algorithm: "none" }),
    token({ issuer: "otro-emisor" }),
    token({ audience: "otra-app" }),
    token({ subject: "id-invalido" }),
    jwt.sign({}, sinExp.secret, { algorithm: sinExp.algorithm, issuer: sinExp.issuer, audience: sinExp.audience, subject: id }),
  ];
  for (const valor of tokens) {
    const resultado = await ejecutar(`Bearer ${valor}`);
    assert.equal(resultado.llamadas[0].status, 401);
    assert.equal(resultado.req.usuario, undefined);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("un token firmado no habilita una cuenta que ya fue eliminada", async t => {
  t.mock.method(User, "findById", () => ({ select: async () => null }));
  const resultado = await ejecutar(`Bearer ${token()}`);
  assert.equal(resultado.llamadas[0].status, 401);
  assert.equal(resultado.req.usuario, undefined);
});

test("un error de base devuelve 500 sin revelar el token ni el error original", async t => {
  const valor = token();
  t.mock.method(User, "findById", () => ({ select: async () => { throw new Error(valor); } }));
  const resultado = await ejecutar(`Bearer ${valor}`);
  assert.equal(resultado.llamadas[0].status, 500);
  assert.ok(!resultado.llamadas[0].message.includes(valor));
  assert.equal(resultado.req.usuario, undefined);
});

test("configuración JWT ausente devuelve 500 en lugar de aceptar tokens", async t => {
  const valor = token();
  const secret = process.env.JWT_SECRET;
  const consulta = t.mock.method(User, "findById", () => null);
  try {
    delete process.env.JWT_SECRET;
    const resultado = await ejecutar(`Bearer ${valor}`);
    assert.equal(resultado.llamadas[0].status, 500);
    assert.equal(consulta.mock.calls.length, 0);
  } finally { process.env.JWT_SECRET = secret; }
});

test("el perfil devuelve la identidad verificada sin cachearla", () => {
  let body;
  const cabeceras = {};
  const publico = { _id: id, nombre: "Ana", email: "ana@ejemplo.com" };
  const res = {
    set: (nombre, valor) => { cabeceras[nombre] = valor; },
    json: valor => { body = valor; },
  };
  obtenerPerfil({ usuario: publico }, res);
  assert.deepEqual(body, { usuario: publico });
  assert.equal(cabeceras["Cache-Control"], "no-store");
  assert.equal(body.usuario.password, undefined);
});
