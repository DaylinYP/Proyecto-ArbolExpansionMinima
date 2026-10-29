/* La UI escucha el progreso de Prim, sin alterar el cálculo. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  window.addEventListener('trama:render', ev => {
    const state = ev.detail;
    const current = $('current-step-value');
    if (current) current.textContent = `${state.pasoActual} / ${state.totalPasos}`;
    const timeline = $('timeline-steps');
    if (timeline) {
      const expected = state.totalPasos + 1;
      if (timeline.children.length !== expected) {
        timeline.replaceChildren();
        for (let i = 0; i < expected; i++) {
          const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'timeline-step'; btn.dataset.step = String(i);
          const circle = document.createElement('span'); circle.className = 'timeline-circle'; circle.textContent = i === 0 ? '●' : String(i).padStart(2, '0');
          const label = document.createElement('span'); label.className = 'timeline-label'; label.textContent = i === 0 ? 'Inicio' : i === expected - 1 ? 'Resultado' : `Paso ${i}`;
          btn.append(circle, label); timeline.append(btn);
        }
      }
      [...timeline.children].forEach((btn, i) => {
        btn.classList.toggle('done', i < state.pasoActual);
        btn.classList.toggle('current', i === state.pasoActual);
        btn.setAttribute('aria-current', i === state.pasoActual ? 'step' : 'false');
        btn.disabled = !state.hayResultado;
        btn.setAttribute('aria-label', `Ver paso ${i} de ${state.totalPasos}`);
      });
    }
  });
  const timeline = $('timeline-steps');
  if (timeline) {
    timeline.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-step]');
      if (!btn || btn.disabled) return;
      window.tramaIrAlPaso?.(Number(btn.dataset.step));
    });
  }
  const open = $('open-editor'), close = $('close-editor'), backdrop = $('editor-backdrop'), drawer = $('editor-drawer');
  if (open && close && drawer) {
    const setOpen = value => {
      drawer.classList.toggle('open', value); backdrop?.classList.toggle('open', value);
      open.setAttribute('aria-expanded', String(value)); drawer.setAttribute('aria-hidden', String(!value));
      if (value) close.focus(); else open.focus();
    };
    open.addEventListener('click', () => setOpen(true)); close.addEventListener('click', () => setOpen(false));
    backdrop?.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) setOpen(false) });
    ['rail-editor', 'rail-nodes', 'rail-connections'].forEach(id => {
      const b = $(id); if (!b) return;
      b.addEventListener('click', () => {
        setOpen(true);
        if (id === 'rail-nodes') $('node-list')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (id === 'rail-connections') $('edge-list')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
  }
  const reset = $('rail-reset'); if (reset) { reset.addEventListener('click', () => { $('restart').click(); }); }

  const tabs = [...document.querySelectorAll('.analysis-tab')];
  const panes = [...document.querySelectorAll('.analysis-pane')];
  function activarTab(nombre) {
    tabs.forEach(btn => {
      const activa = btn.dataset.tab === nombre;
      btn.classList.toggle('active', activa);
      btn.setAttribute('aria-selected', String(activa));
    });
    panes.forEach(pane => {
      const activa = pane.id === `pane-${nombre}`;
      pane.classList.toggle('active', activa);
      pane.hidden = !activa;
    });
  }
  tabs.forEach(btn => btn.addEventListener('click', () => activarTab(btn.dataset.tab)));
})();
