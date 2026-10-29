/*
 * Esta parte contiene únicamente el cálculo matemático: no depende del HTML.
 * Requisitos: grafo no dirigido, pesos positivos, nodos sin repetir.
 */
(function (root) {
  'use strict';

  function calcularPrim(nodos, conexiones, inicio) {
    if (!Array.isArray(nodos) || nodos.length === 0) {
      throw new Error('Agrega al menos un nodo para comenzar.');
    }
    const ids = nodos.map(n => String(n.id));
    if (new Set(ids).size !== ids.length) throw new Error('Los nodos deben tener identificadores distintos.');
    if (!ids.includes(String(inicio))) throw new Error('Selecciona un nodo inicial válido.');

    const existentes = new Set(ids);
    for (const c of conexiones) {
      if (!existentes.has(String(c.a)) || !existentes.has(String(c.b))) {
        throw new Error('Hay una conexión que hace referencia a un nodo inexistente.');
      }
      if (String(c.a) === String(c.b)) throw new Error('Un nodo no puede conectarse consigo mismo.');
      if (!Number.isFinite(Number(c.peso)) || Number(c.peso) <= 0) {
        throw new Error('Los costos de las conexiones deben ser mayores que cero.');
      }
    }

    const visitados = new Set([String(inicio)]);
    const ordenVisita = [String(inicio)];
    const elegidas = [];
    let total = 0;
    const indiceNodo = id => ids.indexOf(id);
    const redondear = n => Math.round((n + Number.EPSILON) * 1000000) / 1000000;

    // Cada arista que atraviesa la frontera conecta un nodo ya visitado
    // con uno pendiente de conectar. Nunca aceptamos una arista que cree ciclos.
    function frontera() {
      const candidatas = [];
      conexiones.forEach((c, i) => {
        const a = String(c.a), b = String(c.b);
        if (visitados.has(a) === visitados.has(b)) return;
        const desde = visitados.has(a) ? a : b;
        const hacia = visitados.has(a) ? b : a;
        candidatas.push({ id: String(c.id ?? i), a, b, desde, hacia, peso: Number(c.peso) });
      });
      candidatas.sort((x, y) =>
        x.peso - y.peso ||
        // En empates, tomamos primero la arista del nodo recién incorporado.
        ordenVisita.indexOf(y.desde) - ordenVisita.indexOf(x.desde) ||
        indiceNodo(x.hacia) - indiceNodo(y.hacia) ||
        x.id.localeCompare(y.id)
      );
      return candidatas;
    }

    const pasos = [{
      numero: 0, visitados: [...visitados], elegidas: [], total: 0,
      ultima: null, candidatas: frontera(),
      titulo: 'Punto de partida',
      explicacion: `Partimos del nodo ${inicio}. Todavía no elegimos conexiones; buscamos el menor costo que llegue a un nodo nuevo.`
    }];

    while (visitados.size < ids.length) {
      const candidatas = frontera();
      if (!candidatas.length) break;
      const seleccionada = candidatas[0];
      visitados.add(seleccionada.hacia);
      ordenVisita.push(seleccionada.hacia);
      elegidas.push(seleccionada);
      total = redondear(total + seleccionada.peso);
      const numero = elegidas.length;
      pasos.push({
        numero, visitados: [...visitados], elegidas: [...elegidas], total,
        ultima: seleccionada, candidatas: frontera(),
        titulo: `Conexión ${numero}: ${seleccionada.desde} — ${seleccionada.hacia}`,
        explicacion: `Elegimos ${seleccionada.desde} — ${seleccionada.hacia} porque cuesta ${seleccionada.peso} y es la conexión disponible más económica hacia un nodo que falta. No se forma ningún ciclo.`
      });
    }

    const conectado = visitados.size === ids.length;
    const sinConectar = ids.filter(id => !visitados.has(id));
    return {
      conectado, total, elegidas, pasos, visitados: [...visitados], sinConectar,
      nodos: ids.length, conexionesNecesarias: Math.max(0, ids.length - 1)
    };
  }

  const api = { calcularPrim };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PrimEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
