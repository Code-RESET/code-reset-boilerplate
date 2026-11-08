---
name: checklist-entrega
description: Revisa que un proyecto Code-Reset esté listo para entregar al cliente — PWA instalable, CACHE_VERSION, firma de login, firebase-config real, Firestore rules, responsive y compatibilidad con Chrome/Safari iOS/Samsung Internet. Usar cuando Angel diga "listo para entregar", "checklist", "antes de desplegar" o "revisar el proyecto".
---

# Checklist de entrega Code-Reset

Recorrer cada punto, verificarlo en el código (no asumir) y reportar ✅ / ❌ / ⚠️ con
archivo:línea cuando algo falle. No corregir nada sin avisar; al final ofrecer las correcciones.

## 1. Identidad y login
- [ ] `index.html` tiene logo pequeño + "Desarrollado por: Ing. Luis Ángel Díaz Bernal" + "Compañía: CODE-RESET" en la pantalla de login.
- [ ] `#app-name-slot` ya no dice el texto genérico; tiene el nombre real de la app.
- [ ] `manifest.json`: `name` y `short_name` personalizados (no "Code-Reset App" si es para un cliente).

## 2. Firebase
- [ ] `js/firebase-config.js` no contiene placeholders (`TU_API_KEY`, `TU_PROYECTO`, `000000000000`).
- [ ] Todas las URLs de Firebase usan la misma versión (`grep -rn "firebasejs/" js/`).
- [ ] Existe `firestore.rules`, cubre todas las colecciones usadas y pasa el chequeo
      anti-NEXORA (toda función helper se llama en algún `allow`). Si falta → usar skill `reglas-firestore`.

## 3. PWA
- [ ] `manifest.json` válido (`python3 -m json.tool manifest.json`), con íconos 192 y 512, `display: standalone`, `start_url` y `scope` relativos.
- [ ] Íconos existen y miden lo que dicen (`file assets/*.png`).
- [ ] `index.html` tiene `apple-touch-icon` y metas de iOS (`apple-mobile-web-app-capable`).
- [ ] `service-worker.js`: cada archivo de `js/modules/*.js` y `css/*.css` está en `CORE_ASSETS`.
- [ ] `CACHE_VERSION` subió respecto al último despliegue (`git log -p -- service-worker.js`).
- [ ] El SW no cachea Firebase/googleapis.

## 4. Código
- [ ] `node --check` pasa en todos los `.js`.
- [ ] Todos los módulos de `js/modules/` están registrados en `MODULES` de `js/router.js` (y viceversa).
- [ ] Nada de `npm`, bundlers, `require(` ni imports sin URL completa/relativa.
- [ ] Datos de Firestore/usuario pintados con `innerHTML` pasan por escape (riesgo XSS).
- [ ] Sin `console.log` de depuración ni credenciales extra en el código.

## 5. Navegadores y responsive
- [ ] Sin APIs no soportadas en Safari iOS (ej. `structuredClone` en iOS viejos, `:has()` sin fallback, lookbehind en regex en iOS < 16.4).
- [ ] Si hay Playwright: servir con `python3 -m http.server 8080` y tomar capturas en
      viewport de iPhone, Android y escritorio; revisar errores de consola.
- [ ] Recordar a Angel que la prueba real en **Safari iOS** y **Samsung Internet** y la
      instalación como PWA en Android e iOS se hacen en dispositivo físico.

## Reporte final

Tabla corta con cada sección y su estado, seguida de la lista de ❌ ordenada por gravedad
(seguridad primero). Indicar explícitamente qué se verificó automáticamente y qué queda para prueba manual.
