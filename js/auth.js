// ============================================================
// auth.js
// Maneja login, autorización, logout y el cambio de pantalla.
// Tener una cuenta no basta: el UID debe estar autorizado.
// No mezclar lógica de negocio aquí.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cerrarRouter, initRouter } from "./router.js";
import { configurarReporteRemoto, reportarError } from "./errores.js";

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

let revisionActual = 0;

function mostrarLogin() {
  cerrarRouter();
  configurarReporteRemoto(null);
  appShell.hidden = true;
  loginScreen.hidden = false;
}

function mostrarApp(user) {
  configurarReporteRemoto((error) =>
    addDoc(collection(db, "errores"), {
      uid: user.uid,
      fecha: error.fecha,
      origen: error.origen,
      mensaje: error.mensaje,
      stack: error.stack,
      ruta: location.pathname
    })
  );
  clearError();
  loginScreen.hidden = true;
  appShell.hidden = false;
  initRouter(user);
}

async function revisarAutorizacion(user) {
  if (user.isAnonymous) return false;
  const permiso = await getDoc(doc(db, "autorizados", user.uid));
  return permiso.exists() && permiso.data().activo === true;
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.hidden = false;
}

function clearError() {
  loginError.hidden = true;
  loginError.textContent = "";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged se encarga de mostrar el app-shell
  } catch (err) {
    showError(traducirErrorFirebase(err.code));
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar";
  }
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  try {
    await signOut(auth);
  } catch (err) {
    reportarError("Cerrar sesión", err);
  } finally {
    logoutBtn.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  const revision = ++revisionActual;
  mostrarLogin();
  if (!user) return;

  try {
    const permitido = await revisarAutorizacion(user);
    if (revision !== revisionActual) return;
    if (permitido) {
      mostrarApp(user);
      return;
    }
    reportarError("Acceso denegado", `UID no autorizado: ${user.uid}`);
    await signOut(auth);
    showError("Este usuario no está autorizado.");
  } catch (err) {
    if (revision !== revisionActual) return;
    if (err?.code === "permission-denied") {
      reportarError("Acceso denegado", err);
      await signOut(auth).catch((e) => reportarError("Cerrar sesión", e));
      showError("Este usuario no está autorizado.");
      return;
    }
    reportarError("Revisar autorización", err);
    showError("No se pudo confirmar el acceso. Revisa tu conexión e intenta de nuevo.");
  }
});

function traducirErrorFirebase(code) {
  const mapa = {
    "auth/invalid-email": "Correo inválido.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "Ese usuario no existe.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos."
  };
  return mapa[code] || "No se pudo iniciar sesión. Intenta de nuevo.";
}
