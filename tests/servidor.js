// Servidor estático solo para pruebas. Bloquea *.local.js para que las
// pruebas nunca dependan de configuraciones reales de una computadora.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const tipos = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png'
};

http.createServer((peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://local').pathname);
  const archivo = path.join(raiz, ruta === '/' ? 'index.html' : ruta);
  if (!archivo.startsWith(raiz + path.sep) || archivo.endsWith('.local.js')) {
    respuesta.writeHead(404).end();
    return;
  }
  fs.readFile(archivo, (error, contenido) => {
    if (error) { respuesta.writeHead(404).end(); return; }
    respuesta.writeHead(200, { 'Content-Type': tipos[path.extname(archivo)] || 'application/octet-stream' });
    respuesta.end(contenido);
  });
}).listen(4173, '127.0.0.1');
