// ============================================================
// utils.js
// Ayudas pequeñas para evitar errores repetidos entre proyectos.
// ============================================================

// Usar siempre al insertar datos de usuarios con innerHTML.
export function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

// Fecha local YYYY-MM-DD. No usar toISOString(): en México, por la
// noche, devolvería el día siguiente.
export function fechaLocal(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
