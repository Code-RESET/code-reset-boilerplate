---
name: nuevo-modulo
description: Crea un módulo/sección nueva en una app Code-Reset (ej. clientes, cobros, reportes) siguiendo la plantilla js/modules/dashboard.js, lo registra en MODULES de js/router.js, lo agrega a CORE_ASSETS del service worker y sube CACHE_VERSION. Usar cuando Angel pida "agregar un módulo", "una sección nueva", "una pantalla de X" o similar.
argument-hint: "<nombre-del-modulo> [descripción de lo que hace]"
---

# Nuevo módulo Code-Reset

Argumentos recibidos: `$ARGUMENTS`

El primer argumento es el nombre del módulo en minúsculas y sin acentos (ej. `clientes`,
`cobros`). Si no viene, pregúntalo antes de crear archivos.

## Pasos

1. **Leer la plantilla**: `js/modules/dashboard.js` y `js/router.js` (para ver el estado
   actual de `MODULES` e imports).

2. **Crear `js/modules/<nombre>.js`** copiando la estructura de la plantilla:
   - Encabezado de comentario con el nombre del archivo y qué hace el módulo.
   - Exportar `render<Nombre>(container, user)` (PascalCase, ej. `renderClientes`).
   - El módulo es dueño de su HTML y su lógica de Firestore; **no** importa ni toca otros módulos.
   - Imports de Firebase **solo** desde `https://www.gstatic.com/firebasejs/10.12.2/...`
     (misma versión que `firebase-config.js`). Nada de npm ni bundler.
   - `db` se importa de `../firebase-config.js`.
   - Usar las variables CSS existentes (`--accent`, `--text-dim`, `--font-display`, etc.).
     Si hace falta CSS nuevo, agregarlo a `css/styles.css` con un prefijo de clase del módulo
     (ej. `.clientes-tabla`).
   - **Seguridad**: cualquier dato que venga de Firestore o del usuario y se pinte con
     `innerHTML` debe pasar por una función de escape (o usar `textContent`). No interpolar
     strings crudos de la base de datos dentro de template literals HTML.
   - Manejar estados de carga, vacío y error (mensaje visible, no solo `console.error`).

3. **Registrar en `js/router.js`**:
   - Agregar `import { render<Nombre> } from "./modules/<nombre>.js";` junto a los demás imports.
   - Agregar `{ path: "<nombre>", label: "<Etiqueta visible>", render: render<Nombre> }` en `MODULES`.

4. **Service worker** (`service-worker.js`):
   - Agregar `"./js/modules/<nombre>.js"` a `CORE_ASSETS`.
   - Subir `CACHE_VERSION` (ej. `code-reset-v1` → `code-reset-v2`). Si no se sube, los
     teléfonos con la PWA instalada se quedan con la versión vieja.

5. **Firestore rules**: si el módulo lee/escribe una colección nueva, avisar a Angel que
   hay que cubrirla en `firestore.rules` (ver skill `reglas-firestore`).

6. **Verificar**: `node --check js/modules/<nombre>.js && node --check js/router.js`
   para descartar errores de sintaxis. Si hay Playwright disponible, levantar
   `python3 -m http.server` y comprobar que el módulo carga sin errores en consola.

## Al terminar

Resumir a Angel en 3–5 líneas: archivos creados/tocados, colecciones de Firestore que usa,
y si quedan reglas pendientes. Explicar brevemente el "por qué" de cualquier decisión no obvia.
