// Parameter panel builder.
import { PARAMS } from './params.js';

export function buildPanel(state, onParam) {
  const root = document.getElementById('params');
  root.innerHTML = '';
  const inputs = {};

  for (const p of PARAMS) {
    if (p.section) {
      const s = document.createElement('div');
      s.className = 'psec';
      s.textContent = p.section;
      root.appendChild(s);
      continue;
    }
    const row = document.createElement('div');
    row.className = 'prow';

    const label = document.createElement('label');
    label.textContent = p.label;
    label.title = p.id;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = p.min; input.max = p.max; input.step = p.step;
    input.value = state[p.id];

    const val = document.createElement('span');
    val.className = 'pval';
    val.textContent = fmt(state[p.id]);

    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      state[p.id] = v;
      val.textContent = fmt(v);
      onParam(p.id, v);
    });

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(val);
    root.appendChild(row);
    inputs[p.id] = { input, val, def: p.def };
  }

  return {
    refresh() {
      for (const p of PARAMS) {
        if (!p.id) continue;
        const it = inputs[p.id];
        it.input.value = state[p.id];
        it.val.textContent = fmt(state[p.id]);
      }
    }
  };
}

function fmt(v) {
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}