/*Interfaz del simulador. El algoritmo matemático está en algoritmo.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const textoSeguro = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formato = n => new Intl.NumberFormat('es-GT', { maximumFractionDigits: 3 }).format(n);
  const clonar = o => JSON.parse(JSON.stringify(o));

  const ejemplos = {
    clase: {
      unidad: 'km', inicio: '1',
      nodos: [
        { id: '1', nombre: '1', x: 85, y: 260 }, { id: '2', nombre: '2', x: 245, y: 95 },
        { id: '3', nombre: '3', x: 245, y: 425 }, { id: '4', nombre: '4', x: 435, y: 260 },
        { id: '5', nombre: '5', x: 610, y: 95 }, { id: '6', nombre: '6', x: 610, y: 425 },
        { id: '7', nombre: '7', x: 780, y: 260 }
      ],
      aristas: [['1', '2', 7], ['1', '3', 10], ['2', '5', 5], ['2', '4', 2], ['3', '4', 3], ['3', '6', 5], ['4', '6', 7], ['4', '7', 12], ['5', '7', 1], ['6', '7', 2]]
    },
    campus: {
      unidad: 'm', inicio: 'A',
      nodos: [
        { id: 'A', nombre: 'Rectoría', x: 105, y: 235 }, { id: 'B', nombre: 'Biblioteca', x: 300, y: 90 },
        { id: 'C', nombre: 'Laboratorio', x: 300, y: 400 }, { id: 'D', nombre: 'Auditorio', x: 490, y: 215 },
        { id: 'E', nombre: 'Cafetería', x: 670, y: 100 }, { id: 'F', nombre: 'Parqueo', x: 720, y: 390 }
      ],
      aristas: [['A', 'B', 90], ['A', 'C', 75], ['B', 'C', 62], ['B', 'D', 80], ['C', 'D', 55], ['B', 'E', 120], ['D', 'E', 65], ['D', 'F', 92], ['E', 'F', 48], ['C', 'F', 130]]
    },
    desconectado: {
      unidad: 'km', inicio: 'A',
      nodos: [{ id: 'A', nombre: 'A', x: 170, y: 220 }, { id: 'B', nombre: 'B', x: 375, y: 125 }, { id: 'C', nombre: 'C', x: 640, y: 240 }, { id: 'D', nombre: 'D', x: 475, y: 400 }],
      aristas: [['A', 'B', 4], ['C', 'D', 3]]
    },
    incendios: {
      unidad: 'mil Q', inicio: 'C',
      nodos: [
        { id: 'C', nombre: 'Central', x: 420, y: 72 },
        { id: 'N', nombre: 'Bosque norte', x: 215, y: 160 },
        { id: 'E', nombre: 'Bosque este', x: 632, y: 170 },
        { id: 'O', nombre: 'Bosque oeste', x: 100, y: 333 },
        { id: 'S', nombre: 'Bosque sur', x: 265, y: 424 },
        { id: 'M', nombre: 'Mirador', x: 435, y: 285 },
        { id: 'R', nombre: 'Reserva', x: 625, y: 415 },
        { id: 'T', nombre: 'Torre alerta', x: 783, y: 302 }
      ],
      aristas: [
        ['C', 'N', 4], ['C', 'O', 7], ['C', 'E', 12],
        ['N', 'O', 6], ['N', 'M', 3], ['N', 'E', 8],
        ['O', 'S', 2], ['O', 'R', 9], ['M', 'E', 5],
        ['M', 'R', 11], ['E', 'T', 2], ['E', 'R', 7],
        ['S', 'R', 4], ['S', 'T', 10], ['R', 'T', 3], ['M', 'T', 9]
      ]
    },
    vacio: { unidad: 'u.', inicio: null, nodos: [], aristas: [] }
  };
  const descripcionesCaso = {
    clase: 'Conectar siete fraccionamientos para abastecimiento de agua utilizando la menor longitud total de tubería posible.',
    campus: 'Conectar edificios del campus con la menor longitud total de cableado.',
    desconectado: 'Comprobar qué ocurre cuando los nodos de una red no están todos conectados.',
    incendios: 'Alerta temprana de incendios forestales: conectar una central, sensores y una torre de vigilancia con el menor costo de instalación de enlaces. Costos ficticios expresados en miles de quetzales (no distancias).',
    vacio: 'Diseña una nueva red: agrega nodos, conexiones y sus respectivos costos.'
  };
  let nodos = [], aristas = [], inicio = null, unidad = 'km', resultado = null, pasoActual = 0;
  let contadorArista = 0, ultimoEjemplo = 'clase', arrastre = null;
  const svg = $('graph-svg');
  const mensaje = $('message');
  let avisoTimer;

  function aviso(t, ok = false) {
    mensaje.textContent = t; mensaje.className = 'message' + (ok ? ' good' : ''); mensaje.hidden = false;
    clearTimeout(avisoTimer); avisoTimer = setTimeout(() => mensaje.hidden = true, 4400);
  }
  function idSiguiente(texto) {
    let base = texto.trim().replace(/\s+/g, ' ').slice(0, 16);
    if (!base) return null;
    if (nodos.some(n => n.id.toLowerCase() === base.toLowerCase())) return null;
    return base;
  }
  function etiqueta(id) {
    const n = nodos.find(x => x.id === id);
    return n && n.nombre !== n.id ? `${n.id} (${n.nombre})` : id;
  }
  function opciones(select, valor) {
    select.replaceChildren();
    for (const n of nodos) {
      const opt = document.createElement('option'); opt.value = n.id;
      opt.textContent = n.nombre === n.id ? n.id : `${n.id} · ${n.nombre}`;
      select.append(opt);
    }
    if (valor && nodos.some(n => n.id === valor)) select.value = valor;
  }
  function cargarEjemplo(clave) {
    const ex = ejemplos[clave] || ejemplos.clase;
    ultimoEjemplo = clave;
    nodos = clonar(ex.nodos);
    aristas = ex.aristas.map(([a, b, peso]) => ({ id: 'e' + (++contadorArista), a, b, peso }));
    inicio = ex.inicio; unidad = ex.unidad;
    $('example-select').value = clave;
    $('case-description').textContent = descripcionesCaso[clave] || descripcionesCaso.clase;
    actualizar(true);
  }
  function actualizar(mostrarSolucion = true) {
    if (nodos.length === 0) { resultado = null; pasoActual = 0; inicio = null; }
    else {
      if (!nodos.some(n => n.id === inicio)) inicio = nodos[0].id;
      try { resultado = PrimEngine.calcularPrim(nodos, aristas, inicio); pasoActual = mostrarSolucion ? resultado.pasos.length - 1 : 0; }
      catch (err) { resultado = null; pasoActual = 0; aviso(err.message); }
    }
    dibujarControles(); dibujarTodo();
  }
  function dibujarControles() {
    $('node-count').textContent = nodos.length;
    $('edge-count').textContent = aristas.length;
    $('available-edges').textContent = aristas.length;
    $('node-list').innerHTML = nodos.length ? nodos.map(n => `<span class="node-pill"><span class="node-id">${textoSeguro(n.id)}</span>${n.nombre !== n.id ? `<span>${textoSeguro(n.nombre)}</span>` : ''}<button type="button" data-remove-node="${textoSeguro(n.id)}" aria-label="Quitar nodo ${textoSeguro(n.id)}" title="Quitar nodo">×</button></span>`).join('') : '<span class="empty-state">No hay nodos todavía.</span>';
    $('edge-list').innerHTML = aristas.length ? aristas.map(c => `<div class="edge-row"><span class="edge-names">${textoSeguro(c.a)} <span class="dash">—</span> ${textoSeguro(c.b)}</span><input data-edit-edge="${textoSeguro(c.id)}" type="number" min="0.01" step="any" value="${c.peso}" aria-label="Costo de ${textoSeguro(c.a)} a ${textoSeguro(c.b)}"><button type="button" data-remove-edge="${textoSeguro(c.id)}" title="Quitar conexión" aria-label="Quitar conexión ${textoSeguro(c.a)} a ${textoSeguro(c.b)}">×</button></div>`).join('') : '<div class="empty-state">Agrega una conexión para empezar.</div>';
    opciones($('edge-from'), nodos[0]?.id); opciones($('edge-to'), nodos[1]?.id || nodos[0]?.id);
    opciones($('start-node'), inicio);
    $('edge-from').disabled = nodos.length < 2; $('edge-to').disabled = nodos.length < 2;
    $('edge-weight').disabled = nodos.length < 2;
    $('edge-form').querySelector('button').disabled = nodos.length < 2;
    $('start-node').disabled = nodos.length < 1;
  }
  function dibujarTodo() { dibujarGrafo(); dibujarResultado(); }
  function dibujarGrafo() {
    let arte = `<defs><pattern id="dot-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#284867"/></pattern><filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000c20" flood-opacity=".1"/></filter></defs><rect width="860" height="525" fill="url(#dot-grid)" opacity=".55"/>`;
    if (!nodos.length) {
      svg.innerHTML = arte + `<text x="430" y="245" text-anchor="middle" fill="#e2f2ff" font-size="22" font-family="Arial,sans-serif">Tu red empieza aquí</text><text x="430" y="278" text-anchor="middle" fill="#8ca8c8" font-size="14">Agrega nodos y conexiones desde el panel izquierdo.</text>`;
      return;
    }
    const paso = resultado ? resultado.pasos[pasoActual] : null;
    const elegidas = new Set((paso?.elegidas || []).map(c => String(c.id)));
    const claveVista = n => paso?.visitados.includes(n);
    const ultimaId = paso?.ultima?.hacia || (pasoActual === 0 ? inicio : null);
    const siguiente = paso?.candidatas?.[0]?.id;
    aristas.forEach(c => {
      const a = nodos.find(n => n.id === c.a), b = nodos.find(n => n.id === c.b);
      if (!a || !b) return;
      const sel = elegidas.has(String(c.id));
      const prevista = !sel && siguiente === String(c.id) && pasoActual < (resultado?.pasos.length - 1 || 0);
      arte += `<line class="graph-edge ${sel ? 'chosen' : prevista ? 'preview' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    });
    aristas.forEach(c => {
      const a = nodos.find(n => n.id === c.a), b = nodos.find(n => n.id === c.b);
      if (!a || !b) return;
      const sel = elegidas.has(String(c.id));
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
      // Se separa ligeramente la etiqueta de la línea para mejorar su lectura.
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const mx = x + (-dy / len) * 13, my = y + (dx / len) * 13;
      const txt = formato(c.peso), w = Math.max(34, txt.length * 9 + 15);
      arte += `<g pointer-events="none"><rect class="edge-label-bg" x="${mx - w / 2}" y="${my - 13}" width="${w}" height="26" rx="8"/><text class="edge-label-value ${sel ? 'selected' : ''}" x="${mx}" y="${my + 1}">${textoSeguro(txt)}</text></g>`;
    });
    nodos.forEach(n => {
      const visitado = claveVista(n.id); const ult = n.id === ultimaId;
      arte += `<g class="graph-node ${visitado ? 'visited' : ''} ${ult ? 'latest' : ''}" data-drag-node="${textoSeguro(n.id)}" transform="translate(${n.x} ${n.y})" role="group" aria-label="Nodo ${textoSeguro(etiqueta(n.id))}"><circle class="node-outer" r="27"/><text class="node-title" y="1">${textoSeguro(n.id.length > 3 ? n.id.slice(0, 3) + '…' : n.id)}</text>${n.nombre !== n.id ? `<text class="node-caption" y="47">${textoSeguro(n.nombre.length > 16 ? n.nombre.slice(0, 15) + '…' : n.nombre)}</text>` : ''}</g>`;
    });
    svg.innerHTML = arte;
  }
  function dibujarResultado() {
    const paso = resultado?.pasos[pasoActual];
    const totalPasos = resultado?.pasos.length ? resultado.pasos.length - 1 : 0;
    const terminado = !!resultado && pasoActual === totalPasos;
    const completo = terminado && resultado.conectado;
    const fallido = terminado && !resultado.conectado;
    const etiquetaEstado = $('solution-label');
    etiquetaEstado.className = 'solution-state' + (fallido ? ' warning' : !terminado ? ' pending' : '');
    etiquetaEstado.textContent = !resultado ? 'SIN DATOS' : fallido ? 'RED DESCONECTADA' : completo ? 'SOLUCIÓN ÓPTIMA' : 'EN PROCESO';
    const estado = $('network-status'); estado.className = 'legend-status' + (resultado && !resultado.conectado ? ' warning' : '');
    estado.textContent = !resultado ? 'SIN NODOS' : resultado.conectado ? 'RED CONECTADA' : 'SIN CONEXIÓN TOTAL';
    $('cost-caption').textContent = !resultado ? 'Agrega nodos para comenzar' : fallido ? 'No existe árbol de expansión' : completo ? 'Costo mínimo de la red' : 'Costo acumulado hasta este paso';
    $('total-cost').textContent = !resultado || fallido ? '—' : formato(paso.total);
    $('cost-unit').textContent = unidad;
    $('stat-nodes').textContent = nodos.length;
    $('stat-edges').textContent = `${paso?.elegidas.length || 0} / ${Math.max(0, nodos.length - 1)}`;
    $('summary-step-value').textContent = `${pasoActual} / ${totalPasos}`;
    $('summary-step-caption').textContent = !resultado ? 'Sin proceso' : fallido ? 'No es posible conectar toda la red' : completo ? 'Todos los nodos conectados' : paso.titulo;
    $('step-count').textContent = `${pasoActual} de ${totalPasos}`;
    $('progress-fill').style.width = `${totalPasos ? 100 * pasoActual / totalPasos : 0}%`;
    $('step-kicker').textContent = !resultado ? 'SIN PROCESO' : `PASO ${pasoActual}`;
    $('step-title').textContent = !resultado ? 'Crea una red' : fallido ? 'No es posible conectar todos los nodos' : completo ? 'Todos los nodos conectados' : paso.titulo;
    $('step-description').textContent = !resultado ? 'Puedes comenzar con el ejemplo de clase o crear tu propia red.' : fallido ? `El algoritmo no puede alcanzar los nodos ${resultado.sinConectar.join(', ')} desde ${inicio}. Agrega una conexión para obtener un árbol de expansión mínima.` : completo ? `¡Listo! Se conectaron los ${nodos.length} nodos con ${resultado.elegidas.length} conexiones, sin ciclos. ${paso.explicacion}` : paso.explicacion;
    $('selected-edges').innerHTML = paso?.elegidas.length ? paso.elegidas.map((c, i) => `<div class="route-row"><span><span class="route-num">${String(i + 1).padStart(2, '0')}</span>${textoSeguro(c.desde)} — ${textoSeguro(c.hacia)}</span><strong>${formato(c.peso)} ${textoSeguro(unidad)}</strong></div>`).join('') : '<div class="empty-state">Las conexiones aparecerán al avanzar.</div>';
    $('result-note').textContent = fallido ? 'La red debe estar conectada para que exista un árbol de expansión mínima. El costo parcial no es una solución completa.' : `Una red conectada con ${nodos.length} nodos necesita ${Math.max(0, nodos.length - 1)} conexiones para formar un árbol sin ciclos.`;
    $('restart').disabled = !resultado || pasoActual === 0;
    $('next').disabled = !resultado || pasoActual >= totalPasos;
    $('solve').disabled = !resultado || pasoActual === totalPasos;
    $('export').disabled = !resultado;
    dibujarAnalisis(paso, totalPasos);
    dibujarResumenFinal(terminado, paso);
    window.dispatchEvent(new CustomEvent('trama:render', { detail: { pasoActual, totalPasos, hayResultado: !!resultado } }));
  }
  function dibujarAnalisis(paso, totalPasos) {
    const existe = !!resultado && !!paso;
    const prev = existe && pasoActual > 0 ? resultado.pasos[pasoActual - 1] : paso;
    const candidatas = prev?.candidatas || [];
    const elegida = pasoActual > 0 ? paso?.ultima : null;
    $('alternatives-step').textContent = `PASO ${pasoActual}`;
    $('alternatives-caption').textContent = !existe ? 'Agrega nodos y conexiones para comenzar.' : pasoActual === 0 ? 'Opciones disponibles antes de la primera elección.' : `Conexiones evaluadas para tomar la decisión ${pasoActual}.`;
    $('alternatives-body').innerHTML = candidatas.length ? candidatas.slice(0, 7).map(c => {
      const elegido = elegida && String(c.id) === String(elegida.id);
      const estado = elegido ? '✓ Elegida' : pasoActual === 0 && c.id === candidatas[0]?.id ? '○ Menor costo' : '○ Alternativa';
      return `<tr class="${elegido ? 'is-chosen' : ''}"><td><strong>${textoSeguro(c.desde)} — ${textoSeguro(c.hacia)}</strong></td><td>${formato(c.peso)} ${textoSeguro(unidad)}</td><td><span class="${elegido ? 'status-selected' : 'status-candidate'}">${estado}</span></td></tr>`;
    }).join('') + (candidatas.length > 7 ? `<tr><td colspan="3" class="table-empty">Y ${candidatas.length - 7} alternativa(s) más.</td></tr>` : '') : `<tr><td colspan="3" class="table-empty">${existe ? 'No hay conexiones candidatas en este estado.' : 'La red todavía no contiene nodos.'}</td></tr>`;

    const titulo = $('decision-headline'), detalle = $('decision-text');
    if (!existe) { titulo.textContent = 'Sin red'; detalle.textContent = 'Abre «Editar red» para crear nodos y conectar la red.'; }
    else if (pasoActual === 0) {
      titulo.textContent = `Comenzamos desde ${inicio}`;
      detalle.textContent = candidatas.length ? `Prim compara ${candidatas.length} conexión(es) desde el árbol inicial. La más económica es ${candidatas[0].desde} — ${candidatas[0].hacia}, con peso ${formato(candidatas[0].peso)} ${unidad}.` : 'No hay conexiones que permitan incorporar otro nodo desde el nodo inicial.';
    } else if (elegida) {
      titulo.textContent = `Se elige ${elegida.desde} — ${elegida.hacia}`;
      detalle.textContent = `La conexión de ${formato(elegida.peso)} ${unidad} es la de menor peso entre las alternativas válidas. Incorpora el nodo ${elegida.hacia} sin crear un ciclo. Total acumulado: ${formato(paso.total)} ${unidad}.`;
    } else {
      titulo.textContent = 'Red sin conexión completa';
      detalle.textContent = `Quedaron ${resultado.sinConectar.length} nodo(s) fuera del árbol. No existe un enlace para incorporarlos.`;
    }
    if (existe && pasoActual === totalPasos && !resultado.conectado) {
      detalle.textContent += ` La red no tiene un árbol de expansión mínima que cubra todos los nodos.`;
    }
    let filas = '';
    for (let i = 1; i <= totalPasos; i++) {
      const p = resultado.pasos[i]; const activa = i === pasoActual;
      const completa = i <= pasoActual;
      const e = p.ultima;
      filas += `<tr class="${activa ? 'is-current' : completa ? 'is-complete' : 'is-future'}" ${completa ? `data-audit-step="${i}" title="Volver al paso ${i}"` : ''}><td class="step-cell">${i}</td><td>${completa && e ? `<span class="edge-value">✓ ${textoSeguro(e.desde)} — ${textoSeguro(e.hacia)}</span>` : '—'}</td><td>${completa && e ? `${formato(e.peso)} ${textoSeguro(unidad)}` : '—'}</td><td>${completa ? `${formato(p.total)} ${textoSeguro(unidad)}` : '—'}</td><td class="nodal">${completa ? textoSeguro(p.visitados.join(', ')) : '—'}</td></tr>`;
    }
    $('audit-rows').innerHTML = filas || '<tr><td colspan="5" class="table-empty">Todavía no hay pasos para mostrar.</td></tr>';
  }

  // El resumen solo se muestra cuando termina la ejecución. No recarga la pizarra durante los pasos.
  function dibujarResumenFinal(terminado, paso) {
    const panel = $('final-summary');
    panel.hidden = !(terminado && resultado);
    if (panel.hidden) return;
    const conectado = resultado.conectado;
    const estado = $('summary-status');
    estado.classList.toggle('warning', !conectado);
    estado.textContent = conectado ? 'ÁRBOL ÓPTIMO ENCONTRADO' : 'RED DESCONECTADA';
    $('summary-nodes').textContent = `${resultado.visitados.length} / ${nodos.length}`;
    $('summary-edges').textContent = `${resultado.elegidas.length} / ${Math.max(0, nodos.length - 1)}`;
    $('summary-cost').textContent = conectado ? `${formato(resultado.total)} ${unidad}` : 'Sin solución completa';
    $('summary-explanation').textContent = conectado
      ? `Prim conectó los ${nodos.length} nodos con ${resultado.elegidas.length} enlaces y un costo mínimo de ${formato(resultado.total)} ${unidad}. La red no forma ciclos y cumple la regla de n − 1 conexiones.`
      : `Prim alcanzó ${resultado.visitados.length} de ${nodos.length} nodos. No existe un árbol que conecte toda la red con las conexiones actuales; el costo de ${formato(paso.total)} ${unidad} es solo parcial.`;
  }

  // Calculamos ambos recorridos con el mismo grafo, sin alterar la visualización del simulador.
  const ventanaComparacion = $('compare-dialog');
  function opcionesComparacion() {
    opciones($('compare-start-a'), inicio);
    const alternativo = nodos.find(n => n.id !== inicio)?.id || inicio;
    opciones($('compare-start-b'), alternativo);
  }
  function listaComparacion(datos) {
    if (!datos.elegidas.length) return '<p class="compare-empty">No se seleccionaron conexiones.</p>';
    return `<ol class="compare-list">${datos.elegidas.map((c, i) => `<li><span><span class="compare-index">${i + 1}.</span>${textoSeguro(c.desde)} — ${textoSeguro(c.hacia)}</span><span>${formato(c.peso)} ${textoSeguro(unidad)}</span></li>`).join('')}</ol>`;
  }
  function renderComparacion() {
    const a = $('compare-start-a').value;
    const b = $('compare-start-b').value;
    const salida = $('compare-output');
    if (!a || !b) {
      salida.innerHTML = '<div class="compare-callout warning">Agrega nodos para poder comparar recorridos.</div>';
      return;
    }
    let primero, segundo;
    try {
      primero = PrimEngine.calcularPrim(nodos, aristas, a);
      segundo = PrimEngine.calcularPrim(nodos, aristas, b);
    } catch(err) {
      salida.innerHTML = `<div class="compare-callout warning">${textoSeguro(err.message)}</div>`;
      return;
    }
    const ambosConectados = primero.conectado && segundo.conectado;
    const claveArista = c => [String(c.a), String(c.b)].sort().join('|');
    const iguales = ambosConectados && primero.elegidas.length === segundo.elegidas.length && primero.elegidas.every(c => segundo.elegidas.some(e => claveArista(e) === claveArista(c)));
    const secuenciaIgual = JSON.stringify(primero.elegidas.map(claveArista)) === JSON.stringify(segundo.elegidas.map(claveArista));
    let explicacion;
    if (!ambosConectados) explicacion = 'La red no está completamente conectada, así que no existe un árbol de expansión mínima. Se muestran únicamente los recorridos parciales que pudo obtener Prim desde cada inicio.';
    else if (a === b) explicacion = 'Elegiste el mismo nodo inicial en ambos lados. Selecciona dos nodos distintos para comprobar si cambia el orden de las conexiones.';
    else if (iguales && !secuenciaIgual) explicacion = 'El orden de elección cambia, pero las conexiones finales y el costo mínimo son iguales. Prim llega al mismo árbol comenzando desde distintos nodos.';
    else if (iguales) explicacion = 'Ambos puntos de partida produjeron las mismas conexiones en el mismo orden y con el mismo costo mínimo.';
    else explicacion = 'Los recorridos producen árboles distintos, pero ambos tienen el mismo costo mínimo. Esto puede ocurrir cuando hay empates entre conexiones.';
    const tarjeta = (id, datos) => `<section class="compare-route"><div class="compare-route-head"><h3>Desde ${textoSeguro(etiqueta(id))}</h3><span class="compare-total">${formato(datos.total)} ${textoSeguro(unidad)}</span></div><p class="compare-route-subtitle">${datos.conectado ? `${datos.elegidas.length} enlaces · Red conectada` : `${datos.elegidas.length} enlaces · Costo parcial`}</p>${listaComparacion(datos)}</section>`;
    salida.innerHTML = `<div class="compare-callout ${ambosConectados ? '' : 'warning'}"><strong>${ambosConectados ? `Costo óptimo: ${formato(primero.total)} ${textoSeguro(unidad)}.` : 'Comparación de redes incompletas.'}</strong> ${textoSeguro(explicacion)}</div><div class="compare-columns">${tarjeta(a, primero)}${tarjeta(b, segundo)}</div>`;
  }
  $('open-compare').addEventListener('click', () => {
    opcionesComparacion();
    ventanaComparacion.showModal();
    renderComparacion();
  });
  $('close-compare').addEventListener('click', () => ventanaComparacion.close());
  $('compare-form').addEventListener('submit', ev => { ev.preventDefault(); renderComparacion(); });
  ventanaComparacion.addEventListener('click', e => { if (e.target === ventanaComparacion) ventanaComparacion.close(); });

  $('audit-rows').addEventListener('click', e => {
    const fila = e.target.closest('[data-audit-step]');
    if (fila) escogerPaso(Number(fila.dataset.auditStep));
  });
  window.tramaIrAlPaso = numero => escogerPaso(numero);
  function escogerPaso(numero) {
    if (!resultado) return;
    pasoActual = Math.max(0, Math.min(numero, resultado.pasos.length - 1));
    dibujarTodo();
  }
  $('focus-mode').addEventListener('click', () => {
    const layout = $('laboratorio').querySelector('.dashboard-layout');
    const activo = layout.classList.toggle('focus-mode');
    const boton = $('focus-mode');
    boton.setAttribute('aria-pressed', String(activo));
    boton.textContent = activo ? '⤡ Vista normal' : '⤢ Vista amplia';
  });
  $('restart').addEventListener('click', () => escogerPaso(0));
  $('next').addEventListener('click', () => escogerPaso(pasoActual + 1));
  $('solve').addEventListener('click', () => resultado && escogerPaso(resultado.pasos.length - 1));
  $('example-select').addEventListener('change', e => cargarEjemplo(e.target.value));
  $('reset-example').addEventListener('click', () => { cargarEjemplo(ultimoEjemplo); aviso('El ejemplo se restableció.', true); });

  $('start-node').addEventListener('change', e => {
    inicio = e.target.value;
    actualizar(false);
  });
  $('node-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('new-node'); const id = idSiguiente(inp.value);
    if (!id) { aviso('Escribe un nombre distinto a los nodos existentes.'); return; }
    if (nodos.length >= 16) { aviso('Puedes trabajar con un máximo de 16 nodos.'); return; }
    const a = nodos.length * 2.3999632297, r = 130 + (nodos.length % 3) * 45;
    nodos.push({ id, nombre: id, x: Math.round(430 + Math.cos(a) * r), y: Math.round(255 + Math.sin(a) * r) });
    inp.value = ''; actualizar(true); aviso(`Se agregó el nodo ${id}.`, true);
  });
  $('node-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-node]'); if (!btn) return;
    const id = btn.dataset.removeNode;
    nodos = nodos.filter(n => n.id !== id); aristas = aristas.filter(c => c.a !== id && c.b !== id);
    actualizar(true); aviso(`Nodo ${id} y sus conexiones eliminados.`, true);
  });
  $('edge-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-edge]'); if (!btn) return;
    aristas = aristas.filter(c => c.id !== btn.dataset.removeEdge);
    actualizar(true); aviso('Conexión eliminada.', true);
  });
  $('edge-list').addEventListener('change', e => {
    const inp = e.target.closest('[data-edit-edge]'); if (!inp) return;
    const nueva = Number(inp.value);
    if (!Number.isFinite(nueva) || nueva <= 0) { aviso('El costo debe ser mayor que cero.'); dibujarControles(); return; }
    const arista = aristas.find(c => c.id === inp.dataset.editEdge);
    if (arista) { arista.peso = nueva; actualizar(true); aviso('Costo actualizado y solución recalculada.', true); }
  });
  $('edge-form').addEventListener('submit', e => {
    e.preventDefault();
    const a = $('edge-from').value, b = $('edge-to').value, peso = Number($('edge-weight').value);
    if (!a || !b || a === b) { aviso('Selecciona dos nodos diferentes.'); return; }
    if (!Number.isFinite(peso) || peso <= 0) { aviso('El costo debe ser mayor que cero.'); return; }
    if (aristas.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a))) { aviso('Esta conexión ya existe. Edita su costo en la lista.'); return; }
    if (aristas.length >= 80) { aviso('Límite de 80 conexiones.'); return; }
    aristas.push({ id: 'e' + (++contadorArista), a, b, peso });
    actualizar(true); aviso(`Conexión ${a} — ${b} agregada.`, true);
  });
  $('export').addEventListener('click', () => {
    if (!resultado) return;
    const lineas = [
      'Árbol de expansión mínima (Prim)',
      'Investigación de Operaciones — 2026', '',
      `Nodo inicial: ${inicio}`, `Nodos: ${nodos.length}`, `Conexiones disponibles: ${aristas.length}`,
      `Estado: ${resultado.conectado ? 'Red conectada / solución óptima' : 'Red desconectada / sin solución completa'}`,
      `Costo ${resultado.conectado ? 'mínimo' : 'parcial'}: ${formato(resultado.total)} ${unidad}`, '',
      'Conexiones seleccionadas:',
      ...resultado.elegidas.map((c, i) => `${i + 1}. ${c.desde} — ${c.hacia}: ${formato(c.peso)} ${unidad}`),
      '', `Nodos sin conectar: ${resultado.sinConectar.length ? resultado.sinConectar.join(', ') : 'ninguno'}`,
      'Nota: los empates se resuelven priorizando el nodo incorporado más recientemente.'
    ];
    const blob = new Blob(['\ufeff' + lineas.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url;
    a.download = 'resultado_prim.txt'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function coordenadas(e) {
    const punto = svg.createSVGPoint(); punto.x = e.clientX; punto.y = e.clientY;
    return punto.matrixTransform(svg.getScreenCTM().inverse());
  }
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-drag-node]'); if (!g) return;
    const n = nodos.find(n => n.id === g.dataset.dragNode); if (!n) return;
    const p = coordenadas(e);
    arrastre = { id: n.id, pointerId: e.pointerId, dx: n.x - p.x, dy: n.y - p.y };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    if (!arrastre || arrastre.pointerId !== e.pointerId) return;
    const n = nodos.find(x => x.id === arrastre.id); if (!n) return;
    const p = coordenadas(e);
    n.x = Math.max(42, Math.min(816, Math.round(p.x + arrastre.dx)));
    n.y = Math.max(44, Math.min(471, Math.round(p.y + arrastre.dy)));
    dibujarGrafo();
  });
  const pararArrastre = () => { arrastre = null; };
  svg.addEventListener('pointerup', pararArrastre);
  svg.addEventListener('pointercancel', pararArrastre);
  svg.addEventListener('lostpointercapture', pararArrastre);
  cargarEjemplo('clase');
})();
