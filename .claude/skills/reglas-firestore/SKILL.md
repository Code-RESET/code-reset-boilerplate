---
name: reglas-firestore
description: Escribe, revisa y prueba las Firestore security rules (firestore.rules) de un proyecto Code-Reset según los roles del cliente. Usar cuando Angel pida reglas de Firestore, permisos por rol, revisar seguridad de la base de datos, o antes de entregar un proyecto.
argument-hint: "[roles del cliente, ej. admin, cobrador, lectura]"
---

# Firestore security rules — Code-Reset

Roles indicados: `$ARGUMENTS` (si vienen vacíos, deducirlos del código o preguntarlos).

## Lección de NEXORA (obligatoria)

En NEXORA existía una función de permisos `puede()` pero **nunca se llamaba** en los
`match`, y todos los usuarios terminaban con acceso admin. Por eso:

- Toda función helper definida en `firestore.rules` debe usarse en al menos un `allow`.
  Verificarlo con grep: cada `function x(` debe aparecer también como `x(` dentro de un `allow`.
- Prohibido `allow read, write: if true;` y `allow read, write: if request.auth != null;`
  como regla general. "Autenticado" no es lo mismo que "autorizado".
- Prohibido un `match /{document=**}` permisivo: anula todo lo demás (las reglas en
  Firestore son OR — si una permite, se permite).

## Proceso

1. **Inventario**: buscar en `js/` todas las colecciones usadas
   (`collection(`, `doc(`, `addDoc(`, `setDoc(`, `updateDoc(`, `deleteDoc(`). Hacer una tabla
   colección → qué módulos leen / escriben.
2. **Modelo de roles**: preferir el rol en `usuarios/{uid}.rol` (leído con `get()`) o en
   custom claims (`request.auth.token.rol`). El usuario **no** puede editar su propio campo `rol`.
3. **Escribir `firestore.rules`** en la raíz con esta estructura base:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function autenticado() { return request.auth != null; }
    function rol() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol;
    }
    function esAdmin() { return autenticado() && rol() == 'admin'; }

    match /usuarios/{uid} {
      allow read: if autenticado() && (request.auth.uid == uid || esAdmin());
      allow create, delete: if esAdmin();
      // El usuario puede editar su perfil pero nunca su rol
      allow update: if esAdmin() ||
        (request.auth.uid == uid &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['rol']));
    }

    // Una sección match por colección real del proyecto...
  }
}
```

4. **Validar datos** en `create`/`update` cuando aplique: campos requeridos, tipos
   (`is string`, `is number`), y que campos como `creadoPor` coincidan con `request.auth.uid`.
5. **Probar**:
   - Si hay red y Java: `npx firebase-tools emulators:exec --only firestore "node test-rules.mjs"`
     con `@firebase/rules-unit-testing` (solo como herramienta de prueba; la app sigue sin npm).
   - Mínimo, casos por rol: sin sesión → todo denegado; usuario normal → solo lo suyo;
     usuario intentando cambiarse el rol → denegado; admin → permitido.
   - Si no se pueden ejecutar pruebas aquí, entregar el archivo de pruebas y decir
     claramente a Angel que **no se ejecutaron**.
6. **Chequeo anti-NEXORA final**: listar cada función definida y dónde se usa. Si alguna
   no se usa, es un bug — corregir antes de entregar.

## Al terminar

Entregar a Angel: tabla colección × rol × (read/create/update/delete), qué se probó y
qué no, y cómo desplegar (`firebase deploy --only firestore:rules` o pegarlas en la consola).
