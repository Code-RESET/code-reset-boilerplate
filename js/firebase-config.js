// ============================================================
// firebase-config.js
// Elige la configuración y falla de forma segura: si algo no está
// bien, la app se detiene y nunca cae en otro proyecto por accidente.
//   - Normal: js/config-real.js
//   - Prueba: ?prueba=1 o un sitio con "-prueba" en el dominio
//             usa js/config-prueba.local.js (ignorado por git).
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { detenerApp } from "./errores.js";

export const MODO_PRUEBA =
  new URLSearchParams(location.search).get("prueba") === "1" ||
  location.hostname.includes("-prueba");

async function cargarConfig() {
  const archivo = MODO_PRUEBA ? "./config-prueba.local.js" : "./config-real.js";
  let config;
  try {
    ({ FIREBASE_CONFIG: config } = await import(archivo));
  } catch (err) {
    detenerApp(
      MODO_PRUEBA
        ? "Falta js/config-prueba.local.js. No se usó el proyecto real."
        : "No se pudo cargar la configuración de la app.",
      err
    );
  }

  if (!config?.apiKey || !config?.projectId || config.apiKey.startsWith("TU_")) {
    detenerApp("Falta configurar Firebase en este proyecto.");
  }
  if (MODO_PRUEBA && !config.projectId.endsWith("-prueba")) {
    detenerApp('En modo prueba, el projectId debe terminar en "-prueba".');
  }
  return config;
}

const config = await cargarConfig();
const app = initializeApp(config);

// Reduce el riesgo de que iOS o Android limpien datos locales.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {});
}

if (MODO_PRUEBA) {
  const aviso = document.getElementById("aviso-prueba");
  aviso.textContent = `MODO PRUEBA — proyecto ${config.projectId}`;
  aviso.hidden = false;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
