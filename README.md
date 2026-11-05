# Code-Reset Boilerplate

Esqueleto base para arrancar cualquier proyecto nuevo de Code-Reset: PWA en HTML/JS puro (ES6 modules), sin build, con Firebase Auth + Firestore, login con firma de desarrollador, router por hash y estructura modular.

## Cómo usar este repo

1. Sube esta carpeta a GitHub como repo nuevo (ej. `code-reset-boilerplate`).
2. En **Settings → Template repository**, activa la casilla. Esto habilita el botón "Use this template".
3. Para cada proyecto nuevo: "Use this template" → nombra el repo del cliente → clona.
4. Edita `js/config-real.js` con el `firebaseConfig` real del proyecto (Firebase Console → Configuración del proyecto → Tus apps → SDK config).
5. Cambia `<p id="app-name-slot">` en `index.html` por el nombre real de la app.
6. Reemplaza `assets/logo.svg`, `icon-192.png` e `icon-512.png` si el cliente pide su propia marca (por default se usa la identidad Code-Reset).
7. Activa GitHub Pages (Settings → Pages → rama `main`, carpeta `/root`).
8. Sube el cambio de `CACHE_VERSION` en `service-worker.js` cada vez que actualices archivos base, para que los teléfonos ya instalados jalen la versión nueva.

## Cómo agregar un módulo nuevo

1. Copia `js/modules/dashboard.js` y renómbralo (ej. `clientes.js`).
2. Escribe su lógica y su propio `render(container, user)`.
3. Regístralo en `js/router.js` dentro del arreglo `MODULES`.
4. Listo — aparece solo en el menú y en el routing, sin tocar nada más.

## Autorizar usuarios

1. Activa **Authentication → Correo electrónico/contraseña** y crea cada usuario.
2. Desactiva el registro de usuarios nuevos en **Authentication → Configuración → Acciones del usuario**.
3. Crea en Firestore el documento `autorizados/{UID}` con `activo` en `true` y publica `firestore.rules`.
4. Guarda los datos de la app bajo `datos/`. Si hay roles, agrégalos a las reglas antes de entregar.

Recuerda el bug real de NEXORA: `puede()` existía pero nunca se llamaba, y todos terminaban con acceso de admin.

## Proyecto de prueba

1. Crea un proyecto Firebase separado cuyo ID termine en `-prueba`.
2. Copia `js/config-prueba.example.js` como `js/config-prueba.local.js` y pega su configuración.
3. Abre la app con `?prueba=1`. Debe aparecer el aviso amarillo **MODO PRUEBA**.
4. Usa solo datos ficticios. Los archivos `*.local.js` no se suben a git.

En un sitio de Firebase Hosting cuyo dominio incluya `-prueba`, el modo prueba se activa solo. Si falta su configuración, la app se detiene.

## Pruebas

La app no necesita npm para correr; esto es solo para desarrollo:

```bash
npm install
npx playwright install chromium
npm test
```

Las pruebas simulan Firebase. Las reglas reales deben comprobarse en el simulador de Firebase Console o en el proyecto de prueba antes de entregar.

## Antes de entregar

- [ ] `npm test` pasa.
- [ ] `revisor-bugs` no reporta fallos críticos ni altos.
- [ ] Login, usuario no autorizado y reglas probados en el proyecto de prueba.
- [ ] No hay datos reales en el repo.
- [ ] Probado en Chrome, Safari iOS y Samsung Internet.
- [ ] El botón rojo de errores no muestra fallos pendientes.
