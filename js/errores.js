// ============================================================
// errores.js
// Sistema visible de errores silenciosos. No importa Firebase para
// poder avisar incluso si Firebase no carga. Se carga primero.
// ============================================================

const CLAVE = "cr_errores";
const MAXIMO = 50;
const MAX_REMOTOS_POR_SESION = 10;
const ESPERA_REMOTO_MS = 60000;

let errores = leerGuardados();
let reporteRemoto = null;
let remotosEnviados = 0;
const ultimoEnvio = new Map();

function leerGuardados() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(errores));
  } catch {
    // Sin almacenamiento disponible: el error sigue visible en esta sesión.
  }
}

function pintarBoton() {
  const boton = document.getElementById("btn-errores");
  if (!boton) return;
  boton.hidden = errores.length === 0;
  boton.textContent = `${errores.length} ${errores.length === 1 ? "error" : "errores"}`;
}

function pintarLista() {
  const lista = document.getElementById("errores-lista");
  if (!lista) return;
  lista.replaceChildren(
    ...errores.map((e) => {
      const item = document.createElement("li");
      const fecha = document.createElement("small");
      const texto = document.createElement("p");
      fecha.textContent = new Date(e.fecha).toLocaleString("es-MX");
      texto.textContent = e.mensaje;
      item.append(fecha, texto);
      return item;
    })
  );
}

function enviarRemoto(error) {
  if (!reporteRemoto || remotosEnviados >= MAX_REMOTOS_POR_SESION) return;
  const ahora = Date.now();
  if (ahora - (ultimoEnvio.get(error.mensaje) || 0) < ESPERA_REMOTO_MS) return;
  ultimoEnvio.set(error.mensaje, ahora);
  remotosEnviados += 1;
  Promise.resolve()
    .then(() => reporteRemoto(error))
    .catch((err) => console.warn("No se pudo enviar el error:", err));
}

export function reportarError(origen, causa) {
  const mensaje = String(causa?.message || causa || "Error desconocido").slice(0, 500);
  const error = {
    fecha: new Date().toISOString(),
    origen: String(origen).slice(0, 80),
    mensaje: `${origen}: ${mensaje}`.slice(0, 600),
    stack: String(causa?.stack || "").slice(0, 2000)
  };
  errores = [error, ...errores].slice(0, MAXIMO);
  guardar();
  pintarBoton();
  pintarLista();
  enviarRemoto(error);
  console.error(error.mensaje, causa);
}

export function configurarReporteRemoto(funcion) {
  reporteRemoto = funcion;
}

export function detenerApp(mensaje, causa) {
  reportarError("Inicio detenido", causa || mensaje);
  const pantalla = document.getElementById("error-fatal");
  document.getElementById("error-fatal-texto").textContent = mensaje;
  pantalla.hidden = false;
  throw new Error(mensaje);
}

function configurarPanel() {
  const panel = document.getElementById("errores-panel");
  document.getElementById("btn-errores").addEventListener("click", () => {
    pintarLista();
    panel.hidden = false;
  });
  document.getElementById("errores-cerrar").addEventListener("click", () => {
    panel.hidden = true;
  });
  document.getElementById("errores-limpiar").addEventListener("click", () => {
    errores = [];
    guardar();
    pintarBoton();
    pintarLista();
    panel.hidden = true;
  });
}

window.addEventListener("error", (evento) => {
  const recurso = evento.target?.src || evento.target?.href;
  reportarError(recurso ? "Recurso no cargó" : "Error de JavaScript", recurso || evento.error || evento.message);
}, true);

window.addEventListener("unhandledrejection", (evento) => {
  reportarError("Promesa sin manejar", evento.reason);
});

configurarPanel();
pintarBoton();
