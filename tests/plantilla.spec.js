// Pruebas de la plantilla. Firebase se simula: nunca se conecta a un
// proyecto real. La opción "usuario" decide el resultado de cada prueba.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');

function firebaseFalso({ usuario = null, autorizado = false, errorPermiso = false } = {}) {
  const js = (body) => ({ status: 200, contentType: 'text/javascript', body });
  const app = js('export const initializeApp = (config) => ({ config });');
  const auth = js(`
    let usuario = ${JSON.stringify(usuario)};
    let aviso = () => {};
    export const getAuth = () => ({});
    export const onAuthStateChanged = (_, fn) => { aviso = fn; setTimeout(() => fn(usuario), 0); };
    export const signInWithEmailAndPassword = async () => { aviso(usuario); };
    export const signOut = async () => { usuario = null; window.__salio = true; aviso(null); };
  `);
  const firestore = js(`
    export const getFirestore = () => ({});
    export const doc = (...partes) => partes.slice(1).join('/');
    export const collection = (_, nombre) => nombre;
    export const addDoc = async (coleccion, datos) => { (window.__remotos ||= []).push({ coleccion, datos }); };
    export const getDoc = async () => {
      if (${errorPermiso}) throw Object.assign(new Error('sin permiso'), { code: 'permission-denied' });
      return { exists: () => ${autorizado}, data: () => ({ activo: true }) };
    };
  `);
  return async (page) => {
    await page.route('**/firebase-app.js', (r) => r.fulfill(app));
    await page.route('**/firebase-auth.js', (r) => r.fulfill(auth));
    await page.route('**/firebase-firestore.js', (r) => r.fulfill(firestore));
    await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
  };
}

async function usarConfig(page, projectId = 'cliente') {
  await page.route('**/js/config-real.js', (r) => r.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `export const FIREBASE_CONFIG = { apiKey: 'clave', projectId: '${projectId}' };`
  }));
}

const USUARIO = { uid: 'uid-1', email: 'prueba@ejemplo.com', isAnonymous: false };

test('sin configurar, la app se detiene', async ({ page }) => {
  await firebaseFalso()(page);
  await page.goto('/index.html');
  await expect(page.locator('#error-fatal')).toBeVisible();
  await expect(page.locator('#error-fatal-texto')).toContainText('Falta configurar Firebase');
});

test('modo prueba sin archivo local no usa la configuración real', async ({ page }) => {
  await firebaseFalso()(page);
  let usoReal = false;
  await page.route('**/js/config-real.js', (r) => { usoReal = true; return r.continue(); });
  await page.goto('/index.html?prueba=1');
  await expect(page.locator('#error-fatal-texto')).toContainText('No se usó el proyecto real');
  expect(usoReal).toBe(false);
});

test('modo prueba exige un proyecto terminado en -prueba', async ({ page }) => {
  await firebaseFalso()(page);
  await page.route('**/js/config-prueba.local.js', (r) => r.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: "export const FIREBASE_CONFIG = { apiKey: 'clave', projectId: 'cliente-real' };"
  }));
  await page.goto('/index.html?prueba=1');
  await expect(page.locator('#error-fatal-texto')).toContainText('debe terminar en "-prueba"');
});

test('modo prueba muestra su aviso', async ({ page }) => {
  await firebaseFalso()(page);
  await page.route('**/js/config-prueba.local.js', (r) => r.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: "export const FIREBASE_CONFIG = { apiKey: 'clave', projectId: 'cliente-prueba' };"
  }));
  await page.goto('/index.html?prueba=1');
  await expect(page.locator('#aviso-prueba')).toContainText('MODO PRUEBA');
});

test('un usuario autorizado entra a la app', async ({ page }) => {
  await firebaseFalso({ usuario: USUARIO, autorizado: true })(page);
  await usarConfig(page);
  await page.goto('/index.html');
  await expect(page.locator('#app-shell')).toBeVisible();
  await expect(page.locator('#login-screen')).toBeHidden();
  await expect(page.locator('#app-content')).toContainText(USUARIO.email);
});

test('una cuenta no autorizada no entra y se cierra su sesión', async ({ page }) => {
  await firebaseFalso({ usuario: USUARIO, autorizado: false })(page);
  await usarConfig(page);
  await page.goto('/index.html');
  await expect(page.locator('#login-error')).toContainText('no está autorizado');
  await expect(page.locator('#app-shell')).toBeHidden();
  expect(await page.evaluate(() => window.__salio)).toBe(true);
});

test('un usuario anónimo no entra aunque exista permiso', async ({ page }) => {
  await firebaseFalso({ usuario: { ...USUARIO, isAnonymous: true }, autorizado: true })(page);
  await usarConfig(page);
  await page.goto('/index.html');
  await expect(page.locator('#login-error')).toContainText('no está autorizado');
  await expect(page.locator('#app-shell')).toBeHidden();
});

test('si las reglas rechazan el permiso, no muestra la app', async ({ page }) => {
  await firebaseFalso({ usuario: USUARIO, errorPermiso: true })(page);
  await usarConfig(page);
  await page.goto('/index.html');
  await expect(page.locator('#login-error')).toContainText('no está autorizado');
  await expect(page.locator('#app-shell')).toBeHidden();
});

test('cerrar sesión limpia la pantalla', async ({ page }) => {
  await firebaseFalso({ usuario: USUARIO, autorizado: true })(page);
  await usarConfig(page);
  await page.goto('/index.html');
  await expect(page.locator('#app-content')).toContainText(USUARIO.email);
  await page.click('#logout-btn');
  await expect(page.locator('#login-screen')).toBeVisible();
  await expect(page.locator('#app-content')).toBeEmpty();
});

test('un error de JavaScript se ve, se guarda y se reporta', async ({ page }) => {
  await firebaseFalso({ usuario: USUARIO, autorizado: true })(page);
  await usarConfig(page);
  await page.goto('/index.html');
  await expect(page.locator('#app-shell')).toBeVisible();
  await page.evaluate(() => setTimeout(() => { throw new Error('fallo de prueba'); }, 0));
  await expect(page.locator('#btn-errores')).toHaveText('1 error');
  await expect.poll(() => page.evaluate(() => window.__remotos?.[0]?.coleccion)).toBe('errores');
  await page.reload();
  await expect(page.locator('#btn-errores')).toBeVisible();
  await page.click('#btn-errores');
  await expect(page.locator('#errores-lista')).toContainText('fallo de prueba');
  await page.click('#errores-limpiar');
  await expect(page.locator('#btn-errores')).toBeHidden();
});

test('la pantalla de error no tapa el aviso de errores', async ({ page }) => {
  await firebaseFalso()(page);
  await page.goto('/index.html');
  await expect(page.locator('#error-fatal')).toBeVisible();
  await page.click('#btn-errores');
  await expect(page.locator('#errores-lista')).toContainText('Inicio detenido');
});

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('se instala con todos sus archivos', async ({ page }) => {
    await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
    await page.goto('/index.html');
    const estado = await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.ready;
      const cache = await caches.open('code-reset-v2');
      return { activo: Boolean(registro.active), archivos: (await cache.keys()).length };
    });
    expect(estado.activo).toBe(true);
    expect(estado.archivos).toBeGreaterThanOrEqual(13);
  });
});

test('esc y fechaLocal evitan errores comunes', async ({ page }) => {
  await page.goto('/index.html');
  const resultado = await page.evaluate(async () => {
    const { esc, fechaLocal } = await import('/js/utils.js');
    return {
      esc: esc(`<img src=x onerror="a('b')">`),
      fecha: fechaLocal(new Date(2026, 10, 14, 23, 30))
    };
  });
  expect(resultado.esc).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;');
  expect(resultado.fecha).toBe('2026-11-14');
});

test('las reglas son seguras por defecto', () => {
  const reglas = fs.readFileSync(path.join(raiz, 'firestore.rules'), 'utf8');
  expect(reglas).not.toMatch(/\bif\s+true\b/);
  expect(reglas).toContain("sign_in_provider != 'anonymous'");
  expect(reglas).toContain('autorizados');
  expect(reglas).toMatch(/match \/autorizados\/\{uid\}[\s\S]*?allow write: if false;/);
});

test('el service worker cachea todo el núcleo de la app', () => {
  const sw = fs.readFileSync(path.join(raiz, 'service-worker.js'), 'utf8');
  for (const archivo of ['js/errores.js', 'js/config-real.js', 'js/utils.js', 'js/firebase-config.js']) {
    expect(sw).toContain(`./${archivo}`);
    expect(fs.existsSync(path.join(raiz, archivo))).toBe(true);
  }
  expect(sw).not.toContain('config-prueba');
});
