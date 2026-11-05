# Code-Reset — Contexto del proyecto

Desarrollador: Ing. Luis Ángel Díaz Bernal. Empresa: CODE-RESET.

## Stack fijo (no cambiar sin que Angel lo pida)
- HTML + CSS + JS puro, ES6 modules. Sin build step, sin npm install para correr.
- Debe correr sin instalar nada en Chrome, Safari (iOS), Samsung Internet, Firefox.
- PWA: manifest.json + service-worker.js + ícono personalizado.
- Backend: Firebase (Auth + Firestore).
- Arquitectura modular: un archivo por función en /js y /js/modules.
- Navegación por routing (hash), sin recargar la página.
- Responsive: PC, tablet, iPhone, Android.

## Pantalla de login obligatoria
Logo pequeño + "Desarrollado por: Ing. Luis Ángel Díaz Bernal" + "Compañía: CODE-RESET".

## Bases de seguridad obligatorias
- Login con correo y contraseña. No usar sesiones anónimas ni una ruta compartida.
- Tener cuenta no basta: el UID debe existir en `autorizados/{uid}` con `activo: true`.
- Guardar los datos bajo `datos/` y mantener `firestore.rules` bloqueado por defecto.
- Nunca usar `allow read, write: if true`.
- Usar un proyecto Firebase de prueba con `?prueba=1`; su projectId debe terminar en `-prueba`.
- Si falta configuración o permiso, la app debe detenerse. Nunca usar otro proyecto por accidente.
- Usar solo datos ficticios en repos, pruebas y demos.
- Reportar errores con `reportarError()`. Prohibido dejar un `catch` vacío en lógica importante.
- Usar `esc()` con datos dentro de `innerHTML` y `fechaLocal()` para fechas; no `toISOString()`.

## Si la app maneja dinero o funciona sin internet
- Una acción de cobro debe indicar PAGO o REVERSO; nunca alternar un valor.
- Saldo e historial deben guardarse de forma atómica, con un id fijo para evitar duplicados.
- `await` de escrituras de Firestore no termina sin conexión: no bloquear la pantalla esperando.
- No reescribir listas completas entre dispositivos; guardar cambios individuales.
- Restaurar un respaldo debe escribir en la nube, pedir confirmación y probarse en el proyecto de prueba.

## Cómo agregar un módulo nuevo
1. Copiar js/modules/dashboard.js y renombrar.
2. Escribir su render(container, user).
3. Registrarlo en el arreglo MODULES de js/router.js.

## Antes de dar por terminado un proyecto
- Correr `npm test` y agregar pruebas para cada flujo nuevo.
- Usar el subagente `revisor-bugs` y corregir fallos críticos y altos.
- Probar en Chrome, Safari iOS, Samsung Internet.
- Ajustar y probar Firestore security rules (cuidado: en NEXORA hubo un bug donde puede()
  existía pero nunca se llamaba, y todos terminaban con acceso admin).
- Probar login, usuario no autorizado y permisos en el proyecto de prueba.
- Confirmar que la app es instalable como PWA en Android e iOS.
- Actualizar CACHE_VERSION en service-worker.js si se tocó el shell base.

## Estilo de trabajo con Angel
Angel es el arquitecto/product owner: revisa, prueba y despliega, pero no escribe todo
el código a mano. Explica brevemente el "por qué" de las decisiones técnicas.
