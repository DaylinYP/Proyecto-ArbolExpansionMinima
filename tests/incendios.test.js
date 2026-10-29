/* Caso adicional: verifica los datos de la red real configurada en app.js. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calcularPrim } = require('../algoritmo.js');
const src = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const match = src.match(/const ejemplos = (\{[\s\S]*?\});\s*const descripcionesCaso/);
assert.ok(match, 'No se encontró la lista de ejemplos en app.js');
const casos = vm.runInNewContext('(' + match[1] + ')');
const caso = casos.incendios;
assert.ok(caso, 'El caso incendios debe estar registrado');
assert.equal(caso.nodos.length, 8);
assert.equal(caso.aristas.length, 16);
assert.equal(caso.unidad, 'mil Q');
const aristas = caso.aristas.map(([a,b,peso],i) => ({id:'e'+(i+1),a,b,peso}));
const r = calcularPrim(caso.nodos, aristas, caso.inicio);
assert.equal(r.conectado, true);
assert.equal(r.total, 23);
assert.equal(r.elegidas.length, 7);
assert.deepEqual(r.elegidas.map(e => `${e.desde}-${e.hacia}`),
  ['C-N','N-M','M-E','E-T','T-R','R-S','S-O']);
console.log('✓ Alerta de incendios: 8 nodos, 16 conexiones, 7 seleccionadas y 23 mil Q.');
