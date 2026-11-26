// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { AuthProvider, useAuth } from "../context/AuthContext.jsx";
import { CartProvider, useCart } from "../context/CartContext.jsx";
import { TOKEN_KEY } from "../utils/sesion.js";
const usuario={_id:"507f1f77bcf86cd799439011",nombre:"Ana",email:"ana@example.com"};
const producto={_id:"507f191e810c19729de860ea",nombre:"Mesa",precio:10.15,stock:2};
const pedido={_id:"507f191e810c19729de860eb",usuario:usuario._id,items:[{producto:producto._id,nombre:"Mesa",cantidad:1,precio:10.15,subtotal:10.15}],total:10.15,estado:"pendiente",createdAt:"2026-11-25T12:00:00Z"};
const token=`header.${btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}))}.firma`;
const respuesta=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
let cart,auth;
function Probe(){cart=useCart();auth=useAuth();return null;}
function abrir(ruta="/finalizar-compra",sesion=true,handler=()=>undefined){
 localStorage.clear();if(sesion)localStorage.setItem(TOKEN_KEY,token);window.scrollTo=vi.fn();
 const fetch=vi.fn(async(r,o)=>{
  const resultado=handler(r,o);if(resultado!==undefined)return resultado;
  if(r==="/api/auth/perfil"||r==="/api/auth/login")return respuesta({usuario,token});
  if(r==="/api/productos")return respuesta([producto]);
  if(r===`/api/productos/${producto._id}`)return respuesta(producto);
  if(r==="/api/pedidos")return respuesta([pedido]);
  return respuesta({},404);
 });vi.stubGlobal("fetch",fetch);
 render(<MemoryRouter initialEntries={[ruta]}><AuthProvider><CartProvider><Probe/><App/></CartProvider></AuthProvider></MemoryRouter>);return fetch;
}
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("agrupa, limita stock y calcula centavos",()=>{
 abrir("/productos",false);
 act(()=>{cart.agregarAlCarrito(producto);cart.agregarAlCarrito(producto);cart.agregarAlCarrito(producto);});
 expect(cart.carrito).toHaveLength(1);expect(cart.cantidadCarrito).toBe(2);expect(cart.total).toBe(20.3);
 act(()=>cart.cambiarCantidad(producto._id,-1));expect(cart.total).toBe(10.15);
 act(()=>cart.quitarDelCarrito(producto._id));expect(cart.carrito).toEqual([]);
});
it("conserva el carrito del invitado después del login",async()=>{
 const fetch=abrir("/finalizar-compra",false);
 await screen.findByRole("heading",{name:"Iniciar sesión"});
 act(()=>cart.agregarAlCarrito(producto));
 expect(fetch.mock.calls.some(([,o])=>o?.method==="POST")).toBe(false);
 fireEvent.change(screen.getByLabelText("Email"),{target:{value:usuario.email}});
 fireEvent.change(screen.getByLabelText("Contraseña"),{target:{value:"ClaveDePrueba123"}});
 fireEvent.click(screen.getByRole("button",{name:"Ingresar"}));
 await screen.findByRole("heading",{name:"Finalizar compra"});expect(cart.cantidadCarrito).toBe(1);
});
it("envía Bearer e IDs, confirma, vacía y abre historial",async()=>{
 const fetch=abrir(undefined,true,(r,o)=>r==="/api/pedidos"&&o?.method==="POST"?respuesta(pedido,201):undefined);
 await screen.findByRole("heading",{name:"Finalizar compra"});act(()=>cart.agregarAlCarrito(producto));
 fireEvent.click(screen.getByRole("button",{name:"Confirmar pedido"}));
 await screen.findByRole("heading",{name:"Mis pedidos"});expect(cart.cantidadCarrito).toBe(0);
 expect(screen.getByText("Tu pedido se registró correctamente.")).toBeTruthy();
 const post=fetch.mock.calls.find(([r,o])=>r==="/api/pedidos"&&o?.method==="POST");
 expect(post[1].headers.get("Authorization")).toBe(`Bearer ${token}`);
 expect(JSON.parse(post[1].body)).toEqual({items:[{productoId:producto._id,cantidad:1}]});
 await waitFor(() => {
  const get=fetch.mock.calls.find(([r,o])=>r==="/api/pedidos"&&!o?.method);
  expect(get).toBeDefined();
  expect(get[1].headers.get("Authorization")).toBe(`Bearer ${token}`);
 });
});
it.each(["stock","red","confirmacion"])("conserva carrito ante error de %s",async tipo=>{
 abrir(undefined,true,(r,o)=>{
 if(r==="/api/pedidos"&&o?.method==="POST")return tipo==="red"?Promise.reject(new TypeError("sin red")):tipo==="stock"?respuesta({error:"Stock insuficiente"},409):respuesta({},201);
 });await screen.findByRole("heading",{name:"Finalizar compra"});act(()=>cart.agregarAlCarrito(producto));
 fireEvent.click(screen.getByRole("button",{name:"Confirmar pedido"}));await screen.findByRole("alert");expect(cart.cantidadCarrito).toBe(1);
});
it("bloquea duplicados y cambios durante el envío",async()=>{
 let resolver;const fetch=abrir(undefined,true,(r,o)=>r==="/api/pedidos"&&o?.method==="POST"?new Promise(resolve=>{resolver=resolve;}):undefined);
 await screen.findByRole("heading",{name:"Finalizar compra"});act(()=>cart.agregarAlCarrito(producto));
 let pendiente;await act(async()=>{pendiente=cart.finalizarCompra();});await expect(cart.finalizarCompra()).rejects.toThrow("Ya estamos");
 act(()=>{cart.vaciarCarrito();cart.agregarAlCarrito(producto);cart.cambiarCantidad(producto._id,1);});expect(cart.cantidadCarrito).toBe(1);
 expect(fetch.mock.calls.filter(([r,o])=>r==="/api/pedidos"&&o?.method==="POST")).toHaveLength(1);
 await act(async()=>{resolver(respuesta(pedido,201));await pendiente;});expect(cart.cantidadCarrito).toBe(0);
});
it("una respuesta después de logout no vacía el carrito",async()=>{
 let resolver;abrir(undefined,true,(r,o)=>r==="/api/pedidos"&&o?.method==="POST"?new Promise(resolve=>{resolver=resolve;}):undefined);
 await screen.findByRole("heading",{name:"Finalizar compra"});act(()=>cart.agregarAlCarrito(producto));
 let pendiente,resultado;await act(async()=>{pendiente=cart.finalizarCompra();});
 await act(async()=>{auth.cerrarSesion();resolver(respuesta(pedido,201));resultado=await pendiente;});
 expect(resultado).toBeNull();expect(cart.cantidadCarrito).toBe(1);await screen.findByRole("heading",{name:"Iniciar sesión"});
});
it("el historial está protegido y no consulta pedidos de invitados",async()=>{
 const fetch=abrir("/mis-pedidos",false);await screen.findByRole("heading",{name:"Iniciar sesión"});expect(fetch.mock.calls.some(([r])=>r==="/api/pedidos")).toBe(false);
});
it("reintenta historial y muestra estado vacío",async()=>{
 let fallo=true;abrir("/mis-pedidos",true,r=>r==="/api/pedidos"?respuesta(fallo?{}:[],fallo?500:200):undefined);
 await screen.findByRole("alert");fallo=false;fireEvent.click(screen.getByRole("button",{name:"Reintentar"}));await screen.findByText("Todavía no realizaste pedidos.");
});
