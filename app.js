/* ==========================================================================
   1. ESTADO GLOBAL Y PERSISTENCIA EN LOCALSTORAGE
   ========================================================================== */
const STORAGE_KEYS = {
  CHORDS: 'mongui_saved_chords_v2',
  SONGS: 'mongui_saved_songs_v2',
  ACTIVE: 'mongui_active_sheet_v2'
};

const STRUM_PRESETS = {
  tumbados: { label: 'Corridos Tumbados (6/8)', tokens: ['B1', '↓', '↑', '|', 'B2', '↓', '↑'] },
  sierreno: { label: 'Sierreño (3/4)', tokens: ['B1', '↓', '↓', '|', 'B2', '↓', '↓'] },
  ranchera: { label: 'Ranchera (3/4)', tokens: ['B1', '↓', '↓', '|', 'B2', '↓', '↓'] },
  bolero:   { label: 'Bolero (4/4)', tokens: ['B1', '↓', '↓', '↓', '|', 'B2', '↓', '↓', '↓'] },
  pop:      { label: 'Ritmo 4/4', tokens: ['↓', '↓', '↑', '↑', '↓', '↑'] },
  reggae:   { label: 'Apagado 4/4', tokens: ['—', '✕', '—', '✕', '|', '—', '✕', '—', '✕'] }
};

// Acordes iniciales precargados para usar de inmediato
const DEFAULT_CHORDS = [
  { id: 'def_f', name: 'F', instrument: 'guitar', startFret: 1, color: '#facc15', dots: [{s:3,f:2},{s:2,f:3}], barres: [{fret:1,fromString:4,toString:6}], stringStates: ['x','x','o',null,null,null], fluteHoles: [] },
  { id: 'def_fm', name: 'Fm', instrument: 'guitar', startFret: 1, color: '#facc15', dots: [{s:2,f:3}], barres: [{fret:1,fromString:4,toString:6}], stringStates: ['x','x','o',null,null,null], fluteHoles: [] },
  { id: 'def_fs', name: 'F#', instrument: 'guitar', startFret: 2, color: '#facc15', dots: [{s:3,f:2},{s:2,f:3}], barres: [{fret:1,fromString:4,toString:6}], stringStates: ['x','x','o',null,null,null], fluteHoles: [] },
  { id: 'def_fsm', name: 'F#m', instrument: 'guitar', startFret: 2, color: '#facc15', dots: [{s:2,f:3}], barres: [{fret:1,fromString:4,toString:6}], stringStates: ['x','x','o',null,null,null], fluteHoles: [] },
  { id: 'def_fsm7', name: 'F#m7', instrument: 'guitar', startFret: 7, color: '#facc15', dots: [{s:3,f:1},{s:2,f:3},{s:4,f:3}], barres: [], stringStates: ['x','o',null,null,null,'x'], fluteHoles: [] },
  { id: 'def_f7', name: 'F7', instrument: 'guitar', startFret: 6, color: '#facc15', dots: [{s:5,f:1},{s:3,f:2},{s:2,f:3},{s:4,f:3}], barres: [], stringStates: ['x',null,null,null,null,'x'], fluteHoles: [] },
  { id: 'def_c', name: 'C', instrument: 'guitar', startFret: 1, color: '#facc15', dots: [{s:5,f:1},{s:3,f:2},{s:2,f:3}], barres: [], stringStates: ['x',null,null,'o',null,'o'], fluteHoles: [] },
  { id: 'def_g', name: 'G', instrument: 'guitar', startFret: 1, color: '#facc15', dots: [{s:2,f:2},{s:1,f:3},{s:6,f:3}], barres: [], stringStates: [null,null,'o','o','o',null], fluteHoles: [] },
  { id: 'def_am', name: 'Am', instrument: 'guitar', startFret: 1, color: '#facc15', dots: [{s:5,f:1},{s:3,f:2},{s:4,f:2}], barres: [], stringStates: ['x','o',null,null,null,'o'], fluteHoles: [] },
  { id: 'def_uk_c', name: 'C', instrument: 'ukulele', startFret: 1, color: '#facc15', dots: [{s:4,f:3}], barres: [], stringStates: ['o','o','o',null], fluteHoles: [] },
  { id: 'def_fl_do', name: 'Do5', instrument: 'flute', startFret: 1, color: '#facc15', dots: [], barres: [], stringStates: [], fluteHoles: [1,1,1,1,1,1,1,1] }
];

let state = {
  instrument: 'guitar',
  startFret: 1,
  color: '#facc15',
  tool: 'dot', // 'dot' | 'barre' | 'openmute'
  dots: [{ s: 3, f: 1 }, { s: 2, f: 3 }, { s: 4, f: 3 }],
  barres: [],
  stringStates: ['x', 'o', null, null, null, 'x'],
  fluteHoles: [1, 1, 1, 1, 0, 0, 0, 0], // 0: abierto, 1: tapado, 2: medio
  strumTokens: ['B1', '↓', '↑', '|', 'B2', '↓', '↑'],
  sheetChords: [],
  editingSheetIndex: null,
  activeSongId: null,
  savedChords: [],
  savedSongs: [],
  chordFilter: 'all'
};

// Caché de miniaturas PNG para evitar parpadeos al renderizar listas
const thumbCache = new Map();

// Control de gestos táctiles en canvas
let pointerActive = false;
let barreStart = null;
let hoverCell = null;

/* ==========================================================================
   2. INICIALIZACIÓN Y UTILIDADES
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.preset-pill').forEach(btn => {
    btn.className = 'px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-yellow-400 border border-zinc-800 text-[11px] font-semibold rounded-[2px] transition';
  });

  loadFromStorage();
  updateToolButtonsUI();
  updateInstrumentButtonsUI();
  updateColorSwatchesUI();
  renderEditorCanvas();
  renderStrumSequence();
  renderQuickChordsBar();
  renderSheetPreview();
  updateBadges();
  setupCanvasPointerEvents();
  lucide.createIcons();
});

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2400);
}

function loadFromStorage() {
  try {
    const storedChords = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHORDS));
    state.savedChords = Array.isArray(storedChords) && storedChords.length ? storedChords : [...DEFAULT_CHORDS];

    const storedSongs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SONGS));
    state.savedSongs = Array.isArray(storedSongs) ? storedSongs : [];

    const active = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE));
    if (active) {
      document.getElementById('songTitleInput').value = active.title || '';
      document.getElementById('strumLabelInput').value = active.strumLabel || 'Corridos Tumbados (6/8)';
      state.strumTokens = Array.isArray(active.strumTokens) ? active.strumTokens : state.strumTokens;
      state.sheetChords = Array.isArray(active.sheetChords) ? active.sheetChords : [];
      state.activeSongId = active.activeSongId || null;
      if (state.activeSongId) {
        document.getElementById('saveSongBtnText').textContent = 'Actualizar';
      }
    }
  } catch (e) {
    state.savedChords = [...DEFAULT_CHORDS];
  }
}

function persistAll() {
  localStorage.setItem(STORAGE_KEYS.CHORDS, JSON.stringify(state.savedChords));
  localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(state.savedSongs));
  localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify({
    title: document.getElementById('songTitleInput').value,
    strumLabel: document.getElementById('strumLabelInput').value,
    strumTokens: state.strumTokens,
    sheetChords: state.sheetChords,
    activeSongId: state.activeSongId
  }));
  updateBadges();
}

function updateBadges() {
  document.getElementById('savedChordsBadge').textContent = state.savedChords.length;
  document.getElementById('savedSongsBadge').textContent = state.savedSongs.length;
}

/* ==========================================================================
   3. CONTROLES DEL EDITOR DE ACORDES
   ========================================================================== */
function setInstrument(inst) {
  state.instrument = inst;
  const count = inst === 'guitar' ? 6 : inst === 'ukulele' ? 4 : 0;
  state.dots = [];
  state.barres = [];
  state.stringStates = Array(count).fill(null);
  if (inst === 'flute' && state.fluteHoles.length !== 8) {
    state.fluteHoles = [1, 1, 1, 1, 0, 0, 0, 0];
  }
  updateInstrumentButtonsUI();
  renderEditorCanvas();
}

function updateInstrumentButtonsUI() {
  ['guitar', 'ukulele', 'flute'].forEach(id => {
    const btn = document.getElementById(`inst-${id}`);
    if (id === state.instrument) {
      btn.className = 'inst-btn py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-[2px] bg-yellow-400 text-black';
    } else {
      btn.className = 'inst-btn py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] text-zinc-400 hover:text-white';
    }
  });

  const isFlute = state.instrument === 'flute';
  document.getElementById('fretControlGroup').style.opacity = isFlute ? '0.35' : '1';
  document.getElementById('fretControlGroup').style.pointerEvents = isFlute ? 'none' : 'auto';
  document.getElementById('stringToolsBar').style.display = isFlute ? 'none' : 'grid';
  document.getElementById('editorHint').textContent = isFlute
    ? 'Toca cada orificio para alternar: tapado, medio tapado o abierto.'
    : 'Toca un traste para puntos o desliza horizontalmente para cejilla.';
}

function setTool(tool) {
  state.tool = tool;
  barreStart = null;
  updateToolButtonsUI();
}

function updateToolButtonsUI() {
  ['dot', 'barre', 'openmute'].forEach(t => {
    const btn = document.getElementById(`tool-${t}`);
    if (t === state.tool) {
      btn.className = 'tool-btn py-2 px-2 text-xs font-extrabold uppercase tracking-wider border border-yellow-400 bg-yellow-400/15 text-yellow-400 rounded-[2px] flex items-center justify-center gap-1.5';
    } else {
      btn.className = 'tool-btn py-2 px-2 text-xs font-bold uppercase tracking-wider border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white rounded-[2px] flex items-center justify-center gap-1.5';
    }
  });
}

function setDotColor(hex) {
  state.color = hex;
  updateColorSwatchesUI();
  renderEditorCanvas();
}

function updateColorSwatchesUI() {
  document.querySelectorAll('#colorSwatches button').forEach(btn => {
    btn.style.outline = btn.dataset.color === state.color ? '2px solid #facc15' : 'none';
    btn.style.outlineOffset = '2px';
  });
}

function changeStartFret(delta) {
  setStartFret(state.startFret + delta);
}

function setStartFret(val) {
  const parsed = Math.max(1, Math.min(20, parseInt(val, 10) || 1));
  state.startFret = parsed;
  document.getElementById('startFretInput').value = parsed;
  renderEditorCanvas();
}

function clearEditor() {
  const count = state.instrument === 'guitar' ? 6 : state.instrument === 'ukulele' ? 4 : 0;
  state.dots = [];
  state.barres = [];
  state.stringStates = Array(count).fill(null);
  state.fluteHoles = Array(8).fill(0);
  barreStart = null;
  renderEditorCanvas();
}

function getCurrentDiagramData() {
  return {
    name: (document.getElementById('chordNameInput').value || 'Acorde').trim(),
    instrument: state.instrument,
    startFret: state.startFret,
    color: state.color,
    dots: JSON.parse(JSON.stringify(state.dots)),
    barres: JSON.parse(JSON.stringify(state.barres)),
    stringStates: [...state.stringStates],
    fluteHoles: [...state.fluteHoles]
  };
}

function loadDiagramIntoEditor(data) {
  state.instrument = data.instrument || 'guitar';
  state.startFret = data.startFret || 1;
  state.color = data.color || '#facc15';
  state.dots = JSON.parse(JSON.stringify(data.dots || []));
  state.barres = JSON.parse(JSON.stringify(data.barres || []));
  const count = state.instrument === 'guitar' ? 6 : state.instrument === 'ukulele' ? 4 : 0;
  state.stringStates = data.stringStates ? [...data.stringStates] : Array(count).fill(null);
  state.fluteHoles = data.fluteHoles ? [...data.fluteHoles] : Array(8).fill(0);

  document.getElementById('chordNameInput').value = data.name || '';
  document.getElementById('startFretInput').value = state.startFret;
  updateInstrumentButtonsUI();
  updateColorSwatchesUI();
  renderEditorCanvas();
}

/* ==========================================================================
   4. MOTOR DE DIBUJO DE DIAGRAMAS (EDITOR Y EXPORTACIÓN)
   ========================================================================== */
function drawDiagram(ctx, data, w, h, options = {}) {
  const { showWatermark = false, interactive = false } = options;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleSize = Math.round(w * 0.155);
  ctx.font = `900 ${titleSize}px "Green Matcha", "Titan One", "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(data.name || '?', w / 2, h * 0.105);

  const accent = data.color || '#facc15';

  if (data.instrument === 'flute') {
    drawFluteDiagram(ctx, data, w, h, accent);
  } else {
    drawStringDiagram(ctx, data, w, h, accent, interactive);
  }

  if (showWatermark) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = `700 ${Math.max(10, Math.round(w * 0.052))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('@ronits.ss', w / 2, h * 0.955);
  }
}

function drawStringDiagram(ctx, data, w, h, accent, interactive) {
  const strings = data.instrument === 'ukulele' ? 4 : 6;
  const frets = 4;

  const gridLeft = w * 0.27;
  const gridRight = w * 0.89;
  const gridTop = h * 0.25;
  const gridBottom = h * 0.84;
  const gridW = gridRight - gridLeft;
  const gridH = gridBottom - gridTop;

  const stepX = gridW / (strings - 1);
  const stepY = gridH / frets;

  ctx.font = `800 ${Math.round(w * 0.068)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let s = 0; s < strings; s++) {
    const x = gridLeft + s * stepX;
    const st = data.stringStates?.[s];
    if (st === 'o') {
      ctx.fillStyle = '#ffffff';
      ctx.fillText('O', x, gridTop - stepY * 0.34);
    } else if (st === 'x') {
      ctx.fillStyle = '#71717a';
      ctx.fillText('✕', x, gridTop - stepY * 0.34);
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(w * 0.088)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let f = 0; f < frets; f++) {
    const y = gridTop + (f + 0.5) * stepY;
    ctx.fillText(String((data.startFret || 1) + f), gridLeft - w * 0.06, y);
  }

  ctx.strokeStyle = '#d4d4d8';
  for (let f = 0; f <= frets; f++) {
    const y = gridTop + f * stepY;
    ctx.lineWidth = (f === 0 && (data.startFret || 1) === 1) ? Math.max(4, w * 0.022) : Math.max(1.5, w * 0.008);
    ctx.beginPath();
    ctx.moveTo(gridLeft, y);
    ctx.lineTo(gridRight, y);
    ctx.stroke();
  }

  ctx.lineWidth = Math.max(1.5, w * 0.008);
  for (let s = 0; s < strings; s++) {
    const x = gridLeft + s * stepX;
    ctx.beginPath();
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, gridBottom);
    ctx.stroke();
  }

  const dotRadius = Math.min(stepX, stepY) * 0.36;
  (data.barres || []).forEach(b => {
    if (b.fret < 1 || b.fret > frets) return;
    const s1 = Math.min(b.fromString, b.toString) - 1;
    const s2 = Math.max(b.fromString, b.toString) - 1;
    const x1 = gridLeft + s1 * stepX - dotRadius * 0.85;
    const x2 = gridLeft + s2 * stepX + dotRadius * 0.85;
    const y = gridTop + (b.fret - 0.5) * stepY - dotRadius * 0.72;
    const bh = dotRadius * 1.44;

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(x1, y, x2 - x1, bh, 3);
    ctx.fill();
  });

  (data.dots || []).forEach(d => {
    if (d.f < 1 || d.f > frets || d.s < 1 || d.s > strings) return;
    const x = gridLeft + (d.s - 1) * stepX;
    const y = gridTop + (d.f - 0.5) * stepY;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  if (interactive && barreStart) {
    const x = gridLeft + (barreStart.s - 1) * stepX;
    const y = gridTop + (barreStart.f - 0.5) * stepY;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, dotRadius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFluteDiagram(ctx, data, w, h, accent) {
  const holes = data.fluteHoles || Array(8).fill(0);
  const centerX = w * 0.54;
  const startY = h * 0.24;
  const spacing = (h * 0.62) / 7;
  const r = Math.min(w * 0.055, spacing * 0.36);

  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - r * 2.1, startY - r * 1.8, r * 4.2, spacing * 7 + r * 3.6);

  holes.forEach((val, idx) => {
    const cx = idx === 0 ? centerX - r * 3.2 : centerX;
    const cy = startY + idx * spacing;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);

    if (val === 1) {
      ctx.fillStyle = accent;
      ctx.fill();
    } else if (val === 2) {
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI * 1.5);
      ctx.fill();
    } else {
      ctx.fillStyle = '#000000';
      ctx.fill();
    }
    ctx.stroke();
  });
}

function renderEditorCanvas() {
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');
  drawDiagram(ctx, getCurrentDiagramData(), canvas.width, canvas.height, {
    showWatermark: true,
    interactive: true
  });
}

/* ==========================================================================
   5. EVENTOS TÁCTILES UNIFICADOS (POINTER EVENTS PARA MÓVIL Y PC)
   ========================================================================== */
function setupCanvasPointerEvents() {
  const canvas = document.getElementById('editorCanvas');

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointerActive = true;
    handleCanvasTapOrStart(e);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointerActive || state.instrument === 'flute') return;
    const cell = getGridCellFromEvent(e);
    if (cell && barreStart && cell.f === barreStart.f && cell.s !== barreStart.s) {
      hoverCell = cell;
      renderEditorCanvas();
    }
  });

  const finishPointer = (e) => {
    if (!pointerActive) return;
    pointerActive = false;

    if (state.instrument !== 'flute' && barreStart) {
      const endCell = getGridCellFromEvent(e) || hoverCell;
      if (endCell && endCell.f === barreStart.f && endCell.s !== barreStart.s) {
        toggleBarre(barreStart.f, barreStart.s, endCell.s);
        barreStart = null;
      } else if (state.tool === 'barre') {
        if (!hoverCell) {
          hoverCell = barreStart;
        } else if (hoverCell.f === barreStart.f && hoverCell.s !== barreStart.s) {
          toggleBarre(barreStart.f, barreStart.s, hoverCell.s);
          barreStart = null;
          hoverCell = null;
        }
      } else {
        barreStart = null;
      }
    }
    renderEditorCanvas();
  };

  canvas.addEventListener('pointerup', finishPointer);
  canvas.addEventListener('pointercancel', finishPointer);
}

function getCanvasCoords(e) {
  const canvas = document.getElementById('editorCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
    w: canvas.width,
    h: canvas.height
  };
}

function getGridCellFromEvent(e) {
  const { x, y, w, h } = getCanvasCoords(e);
  const strings = state.instrument === 'ukulele' ? 4 : 6;
  const frets = 4;

  const gridLeft = w * 0.27;
  const gridRight = w * 0.89;
  const gridTop = h * 0.25;
  const gridBottom = h * 0.84;

  const stepX = (gridRight - gridLeft) / (strings - 1);
  const stepY = (gridBottom - gridTop) / frets;

  if (y >= gridTop - stepY * 0.75 && y < gridTop) {
    const s = Math.round((x - gridLeft) / stepX) + 1;
    if (s >= 1 && s <= strings) return { topMarker: true, s };
  }

  if (x < gridLeft - stepX * 0.45 || x > gridRight + stepX * 0.45) return null;
  if (y < gridTop || y > gridBottom) return null;

  const s = Math.max(1, Math.min(strings, Math.round((x - gridLeft) / stepX) + 1));
  const f = Math.max(1, Math.min(frets, Math.floor((y - gridTop) / stepY) + 1));
  return { s, f };
}

function handleCanvasTapOrStart(e) {
  if (navigator.vibrate) navigator.vibrate(12);

  if (state.instrument === 'flute') {
    const { x, y, w, h } = getCanvasCoords(e);
    const centerX = w * 0.54;
    const startY = h * 0.24;
    const spacing = (h * 0.62) / 7;
    const r = Math.min(w * 0.055, spacing * 0.36);

    for (let idx = 0; idx < 8; idx++) {
      const cx = idx === 0 ? centerX - r * 3.2 : centerX;
      const cy = startY + idx * spacing;
      if (Math.hypot(x - cx, y - cy) <= r * 2.2) {
        state.fluteHoles[idx] = (state.fluteHoles[idx] + 1) % 3;
        renderEditorCanvas();
        return;
      }
    }
    return;
  }

  const cell = getGridCellFromEvent(e);
  if (!cell) return;

  if (cell.topMarker || state.tool === 'openmute') {
    const idx = cell.s - 1;
    const cur = state.stringStates[idx];
    state.stringStates[idx] = cur === null ? 'o' : cur === 'o' ? 'x' : null;
    renderEditorCanvas();
    return;
  }

  if (state.tool === 'barre') {
    if (barreStart && barreStart.f === cell.f && barreStart.s !== cell.s) {
      toggleBarre(barreStart.f, barreStart.s, cell.s);
      barreStart = null;
    } else {
      barreStart = cell;
    }
    renderEditorCanvas();
    return;
  }

  barreStart = cell;
  const existingIdx = state.dots.findIndex(d => d.s === cell.s && d.f === cell.f);
  if (existingIdx >= 0) {
    state.dots.splice(existingIdx, 1);
  } else {
    state.dots.push({ s: cell.s, f: cell.f });
    state.stringStates[cell.s - 1] = null;
  }
  renderEditorCanvas();
}

function toggleBarre(fret, sA, sB) {
  const fromString = Math.min(sA, sB);
  const toString = Math.max(sA, sB);
  const idx = state.barres.findIndex(b => b.fret === fret && b.fromString === fromString && b.toString === toString);
  if (idx >= 0) {
    state.barres.splice(idx, 1);
  } else {
    state.barres.push({ fret, fromString, toString });
    for (let s = fromString; s <= toString; s++) {
      state.stringStates[s - 1] = null;
    }
  }
}

/* ==========================================================================
   6. MINIATURAS CACHEADAS SIN PARPADEO Y BIBLIOTECA DE ACORDES
   ========================================================================== */
function getDiagramThumbURL(data) {
  const key = JSON.stringify({
    n: data.name, i: data.instrument, sf: data.startFret,
    c: data.color, d: data.dots, b: data.barres, st: data.stringStates, fh: data.fluteHoles
  });
  if (thumbCache.has(key)) return thumbCache.get(key);

  const off = document.createElement('canvas');
  off.width = 180;
  off.height = 220;
  drawDiagram(off.getContext('2d'), data, off.width, off.height, { showWatermark: true });
  const url = off.toDataURL('image/png');
  thumbCache.set(key, url);
  return url;
}

function saveCurrentChordToLibrary(notify = false) {
  const data = getCurrentDiagramData();
  const existingIdx = state.savedChords.findIndex(
    c => c.name.toLowerCase() === data.name.toLowerCase() && c.instrument === data.instrument
  );

  if (existingIdx >= 0) {
    state.savedChords[existingIdx] = { ...data, id: state.savedChords[existingIdx].id };
  } else {
    state.savedChords.unshift({ ...data, id: 'ch_' + Date.now() });
  }

  persistAll();
  renderQuickChordsBar();
  if (notify) showToast(`Acorde "${data.name}" guardado`);
}

function renderQuickChordsBar() {
  const bar = document.getElementById('quickChordsBar');
  const items = state.savedChords.slice(0, 8);
  if (!items.length) {
    bar.innerHTML = '<span class="text-xs text-zinc-600">Aún no hay acordes guardados.</span>';
    return;
  }

  bar.innerHTML = items.map(ch => `
    <button
      onclick="insertSavedChordToSheet('${ch.id}')"
      class="shrink-0 bg-black border border-zinc-800 hover:border-yellow-400 p-1.5 rounded-[2px] flex flex-col items-center w-20"
      title="Agregar ${ch.name} a la lámina"
    >
      <img src="${getDiagramThumbURL(ch)}" alt="${ch.name}" class="w-full h-auto block" />
    </button>
  `).join('');
}

function insertSavedChordToSheet(id) {
  const found = state.savedChords.find(c => c.id === id);
  if (!found) return;
  state.sheetChords.push(JSON.parse(JSON.stringify(found)));
  persistAll();
  renderSheetPreview();
  showToast(`"${found.name}" agregado a la lámina`);
}

function openChordsModal() {
  document.getElementById('chordsModal').classList.remove('hidden');
  setChordFilter(state.chordFilter);
}

function closeChordsModal() {
  document.getElementById('chordsModal').classList.add('hidden');
}

function setChordFilter(filter) {
  state.chordFilter = filter;
  ['all', 'guitar', 'ukulele', 'flute'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    btn.className = f === filter
      ? 'filter-chip px-2.5 py-1 border border-yellow-400 bg-yellow-400 text-black rounded-[2px]'
      : 'filter-chip px-2.5 py-1 border border-zinc-800 bg-zinc-950 text-zinc-400 rounded-[2px]';
  });
  renderChordsModalGrid();
}

function renderChordsModalGrid() {
  const query = (document.getElementById('chordSearchInput').value || '').toLowerCase();
  const grid = document.getElementById('chordsModalGrid');

  const filtered = state.savedChords.filter(ch => {
    const matchInst = state.chordFilter === 'all' || ch.instrument === state.chordFilter;
    const matchText = ch.name.toLowerCase().includes(query);
    return matchInst && matchText;
  });

  if (!filtered.length) {
    grid.innerHTML = '<p class="col-span-full text-center text-xs text-zinc-500 py-8">No se encontraron acordes con ese filtro.</p>';
    return;
  }

  grid.innerHTML = filtered.map(ch => `
    <div class="bg-black border border-zinc-800 p-2 rounded-[2px] flex flex-col justify-between">
      <img src="${getDiagramThumbURL(ch)}" alt="${ch.name}" class="w-full h-auto block mb-2" />
      <div class="grid grid-cols-3 gap-1">
        <button onclick="insertSavedChordToSheet('${ch.id}'); closeChordsModal();" class="col-span-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-extrabold uppercase rounded-[2px]">
          + Lámina
        </button>
        <button onclick="editLibraryChord('${ch.id}')" class="py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold rounded-[2px]" title="Editar">
          ✎
        </button>
      </div>
      <button onclick="deleteLibraryChord('${ch.id}')" class="mt-1 w-full py-0.5 text-[10px] text-zinc-500 hover:text-red-400">
        Eliminar
      </button>
    </div>
  `).join('');
}

function editLibraryChord(id) {
  const found = state.savedChords.find(c => c.id === id);
  if (!found) return;
  loadDiagramIntoEditor(found);
  closeChordsModal();
  showToast(`Editando "${found.name}"`);
}

function deleteLibraryChord(id) {
  state.savedChords = state.savedChords.filter(c => c.id !== id);
  persistAll();
  renderQuickChordsBar();
  renderChordsModalGrid();
}

/* ==========================================================================
   7. CONSTRUCTOR DE RASGUEO
   ========================================================================== */
function addStrumToken(token) {
  state.strumTokens.push(token);
  persistAll();
  renderStrumSequence();
  renderSheetPreview();
}

function removeStrumToken(index) {
  state.strumTokens.splice(index, 1);
  persistAll();
  renderStrumSequence();
  renderSheetPreview();
}

function clearStrum() {
  state.strumTokens = [];
  persistAll();
  renderStrumSequence();
  renderSheetPreview();
}

function applyStrumPreset(key) {
  const preset = STRUM_PRESETS[key];
  if (!preset) return;
  document.getElementById('strumLabelInput').value = preset.label;
  state.strumTokens = [...preset.tokens];
  persistAll();
  renderStrumSequence();
  renderSheetPreview();
}

function renderStrumSequence() {
  const box = document.getElementById('strumSequenceContainer');
  if (!state.strumTokens.length) {
    box.innerHTML = '<span class="text-xs text-zinc-600">Sin patrón de rasgueo. Agrega golpes o elige un ritmo base.</span>';
    return;
  }

  box.innerHTML = state.strumTokens.map((tok, i) => {
    let style = 'bg-zinc-900 border-zinc-700 text-white';
    if (tok === 'B1') style = 'bg-emerald-950 border-emerald-700 text-emerald-300';
    else if (tok === 'B2') style = 'bg-amber-950 border-amber-700 text-amber-300';
    else if (tok === '✕') style = 'bg-red-950/70 border-red-800 text-red-300';
    else if (tok === '↓>') style = 'bg-yellow-400/20 border-yellow-400 text-yellow-300';
    else if (tok === '|') style = 'bg-transparent border-transparent text-zinc-500 px-1';

    return `
      <button
        onclick="removeStrumToken(${i})"
        title="Clic para quitar"
        class="px-2.5 py-1 border font-mono-code text-xs font-bold rounded-[2px] hover:opacity-75 ${style}"
      >${tok}</button>
    `;
  }).join('');
}

/* ==========================================================================
   8. GESTIÓN DE LA LÁMINA Y CANCIONES GUARDADAS
   ========================================================================== */
function addOrUpdateSheetChord() {
  const data = getCurrentDiagramData();
  saveCurrentChordToLibrary(false);

  if (state.editingSheetIndex !== null) {
    state.sheetChords[state.editingSheetIndex] = data;
    cancelSheetChordEdit();
    showToast(`Acorde "${data.name}" actualizado`);
  } else {
    state.sheetChords.push(data);
    showToast(`"${data.name}" agregado a la lámina`);
  }

  persistAll();
  renderSheetPreview();
}

function editSheetChord(index) {
  const item = state.sheetChords[index];
  if (!item) return;
  state.editingSheetIndex = index;
  loadDiagramIntoEditor(item);
  document.getElementById('addToSheetText').textContent = 'Actualizar Acorde';
  document.getElementById('cancelEditChordBtn').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelSheetChordEdit() {
  state.editingSheetIndex = null;
  document.getElementById('addToSheetText').textContent = 'Agregar a Lámina';
  document.getElementById('cancelEditChordBtn').classList.add('hidden');
}

function moveSheetChord(index, dir) {
  const target = index + dir;
  if (target < 0 || target >= state.sheetChords.length) return;
  const temp = state.sheetChords[index];
  state.sheetChords[index] = state.sheetChords[target];
  state.sheetChords[target] = temp;
  persistAll();
  renderSheetPreview();
}

function removeSheetChord(index) {
  state.sheetChords.splice(index, 1);
  if (state.editingSheetIndex === index) cancelSheetChordEdit();
  persistAll();
  renderSheetPreview();
}

function clearSheet() {
  state.sheetChords = [];
  state.activeSongId = null;
  document.getElementById('songTitleInput').value = '';
  document.getElementById('saveSongBtnText').textContent = 'Guardar Canción';
  cancelSheetChordEdit();
  persistAll();
  renderSheetPreview();
}

function renderSheetPreview() {
  const title = (document.getElementById('songTitleInput').value || '').trim();
  const strumLabel = (document.getElementById('strumLabelInput').value || '').trim();
  const cols = parseInt(document.getElementById('columnsSelect').value, 10) || 3;

  const titleEl = document.getElementById('previewSongTitle');
  titleEl.textContent = title || 'SIN TÍTULO';
  titleEl.style.opacity = title ? '1' : '0.35';

  const strumBox = document.getElementById('previewStrumBox');
  if (state.strumTokens.length) {
    strumBox.classList.remove('hidden');
    strumBox.innerHTML = `
      ${strumLabel ? `<span class="text-[11px] font-bold uppercase text-zinc-400 mr-1">${strumLabel}:</span>` : ''}
      ${state.strumTokens.map(t => {
        const c = t === 'B1' ? 'text-emerald-400' : t === 'B2' ? 'text-amber-400' : t === '✕' ? 'text-red-400' : t === '↓>' ? 'text-yellow-400' : 'text-white';
        return `<span class="font-mono-code text-xs font-extrabold ${c}">${t}</span>`;
      }).join('')}
    `;
  } else {
    strumBox.classList.add('hidden');
  }

  const container = document.getElementById('sheetGridContainer');
  if (!state.sheetChords.length) {
    container.innerHTML = `
      <div class="py-12 text-center border border-dashed border-zinc-800 rounded-[2px]">
        <p class="text-xs text-zinc-500">Tu lámina está vacía. Crea un acorde o selecciona uno guardado para comenzar.</p>
      </div>
    `;
    return;
  }

  const rows = [];
  for (let i = 0; i < state.sheetChords.length; i += cols) {
    rows.push(state.sheetChords.slice(i, i + cols));
  }

  let globalIdx = 0;
  container.innerHTML = rows.map(row => {
    const cardsHtml = row.map(ch => {
      const idx = globalIdx++;
      return `
        <div class="group relative bg-black border border-zinc-800 hover:border-yellow-400 p-1.5 rounded-[2px] w-32 sm:w-36">
          <img src="${getDiagramThumbURL(ch)}" alt="${ch.name}" class="w-full h-auto block" />
          <div class="mt-1.5 pt-1 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400">
            <button onclick="moveSheetChord(${idx}, -1)" class="hover:text-white px-1" title="Mover izquierda">◀</button>
            <button onclick="editSheetChord(${idx})" class="hover:text-yellow-400 font-bold px-1" title="Editar">Editar</button>
            <button onclick="removeSheetChord(${idx})" class="hover:text-red-400 px-1" title="Quitar">✕</button>
            <button onclick="moveSheetChord(${idx}, 1)" class="hover:text-white px-1" title="Mover derecha">▶</button>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="flex flex-wrap justify-center gap-3">${cardsHtml}</div>`;
  }).join('');
}

function saveCurrentSong() {
  const title = (document.getElementById('songTitleInput').value || '').trim() || 'Canción sin título';
  const songData = {
    id: state.activeSongId || 'song_' + Date.now(),
    title,
    strumLabel: document.getElementById('strumLabelInput').value,
    strumTokens: [...state.strumTokens],
    sheetChords: JSON.parse(JSON.stringify(state.sheetChords)),
    updatedAt: new Date().toLocaleDateString('es-MX')
  };

  const idx = state.savedSongs.findIndex(s => s.id === songData.id);
  if (idx >= 0) {
    state.savedSongs[idx] = songData;
  } else {
    state.savedSongs.unshift(songData);
  }

  state.activeSongId = songData.id;
  document.getElementById('saveSongBtnText').textContent = 'Actualizar';
  persistAll();
  showToast(`Canción "${title}" guardada`);
}

function openSongsModal() {
  document.getElementById('songsModal').classList.remove('hidden');
  renderSongsModalList();
}

function closeSongsModal() {
  document.getElementById('songsModal').classList.add('hidden');
}

function renderSongsModalList() {
  const q = (document.getElementById('songSearchInput').value || '').toLowerCase();
  const list = document.getElementById('songsModalList');
  const filtered = state.savedSongs.filter(s => s.title.toLowerCase().includes(q));

  if (!filtered.length) {
    list.innerHTML = '<p class="text-center text-xs text-zinc-500 py-8">No tienes canciones guardadas todavía.</p>';
    return;
  }

  list.innerHTML = filtered.map(song => `
    <div class="bg-zinc-950 border border-zinc-800 p-3 rounded-[2px] flex flex-wrap items-center justify-between gap-3">
      <div>
        <h4 class="font-matcha text-base text-white uppercase">${song.title}</h4>
        <p class="text-[11px] text-zinc-400">
          ${song.sheetChords.length} acordes • ${song.strumLabel || 'Sin ritmo'} • ${song.updatedAt || ''}
        </p>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="loadSongIntoSheet('${song.id}')" class="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold uppercase rounded-[2px]">
          Abrir
        </button>
        <button onclick="deleteSavedSong('${song.id}')" class="px-2.5 py-1.5 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800 text-xs font-bold rounded-[2px]">
          Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

function loadSongIntoSheet(id) {
  const song = state.savedSongs.find(s => s.id === id);
  if (!song) return;
  state.activeSongId = song.id;
  document.getElementById('songTitleInput').value = song.title;
  document.getElementById('strumLabelInput').value = song.strumLabel || '';
  state.strumTokens = [...(song.strumTokens || [])];
  state.sheetChords = JSON.parse(JSON.stringify(song.sheetChords || []));
  document.getElementById('saveSongBtnText').textContent = 'Actualizar';

  persistAll();
  renderStrumSequence();
  renderSheetPreview();
  closeSongsModal();
  showToast(`Canción "${song.title}" cargada`);
}

function deleteSavedSong(id) {
  state.savedSongs = state.savedSongs.filter(s => s.id !== id);
  if (state.activeSongId === id) {
    state.activeSongId = null;
    document.getElementById('saveSongBtnText').textContent = 'Guardar Canción';
  }
  persistAll();
  renderSongsModalList();
}

/* ==========================================================================
   9. EXPORTACIÓN DE LÁMINA PNG CENTRADA CON MARCA @ronits.ss
   ========================================================================== */
function downloadSheetPNG() {
  if (!state.sheetChords.length) {
    showToast('Agrega al menos un acorde a la lámina');
    return;
  }

  const title = (document.getElementById('songTitleInput').value || '').trim();
  const strumLabel = (document.getElementById('strumLabelInput').value || '').trim();
  const cols = parseInt(document.getElementById('columnsSelect').value, 10) || 3;

  const cardW = 240;
  const cardH = 300;
  const gapX = 28;
  const gapY = 28;
  const padX = 56;
  const padTop = title ? 115 : 52;
  const strumH = state.strumTokens.length ? 68 : 0;
  const padBottom = 82;

  const rows = [];
  for (let i = 0; i < state.sheetChords.length; i += cols) {
    rows.push(state.sheetChords.slice(i, i + cols));
  }

  const maxColsInSheet = Math.max(...rows.map(r => r.length));
  const canvasW = Math.max(640, padX * 2 + maxColsInSheet * cardW + (maxColsInSheet - 1) * gapX);
  const canvasH = padTop + strumH + rows.length * cardH + (rows.length - 1) * gapY + padBottom;

  const out = document.createElement('canvas');
  out.width = canvasW;
  out.height = canvasH;
  const ctx = out.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, canvasW - 28, canvasH - 28);

  let cursorY = 58;

  if (title) {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 44px "Green Matcha", "Titan One", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title.toUpperCase(), canvasW / 2, cursorY);
    cursorY += 54;
  }

  if (state.strumTokens.length) {
    const fullStrumText = `${strumLabel ? strumLabel.toUpperCase() + ':  ' : ''}${state.strumTokens.join('  ')}`;
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText(fullStrumText, canvasW / 2, cursorY + 8);
    cursorY += strumH;
  }

  rows.forEach((row, rIdx) => {
    const rowWidth = row.length * cardW + (row.length - 1) * gapX;
    const startX = (canvasW - rowWidth) / 2;
    const y = cursorY + rIdx * (cardH + gapY);

    row.forEach((ch, cIdx) => {
      const x = startX + cIdx * (cardW + gapX);
      ctx.save();
      ctx.translate(x, y);
      drawDiagram(ctx, ch, cardW, cardH, { showWatermark: true });
      ctx.restore();
    });
  });

  ctx.fillStyle = '#facc15';
  ctx.font = '900 22px "Green Matcha", "Titan One", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESTUDIO MONGUI  •  @ronits.ss', canvasW / 2, canvasH - 36);

  const link = document.createElement('a');
  const safeName = (title || 'acordes').replace(/[^a-z0-9áéíóúñ_-]/gi, '_');
  link.download = `MonGui_${safeName}_ronits.ss.png`;
  link.href = out.toDataURL('image/png');
  link.click();
}

/* ==========================================================================
   10. RESPALDO E IMPORTACIÓN EN JSON
   ========================================================================== */
function exportBackupJSON() {
  const payload = {
    app: 'MonGui',
    author: '@ronits.ss',
    exportedAt: new Date().toISOString(),
    savedChords: state.savedChords,
    savedSongs: state.savedSongs
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MonGui_Respaldo_ronits.ss.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Respaldo JSON descargado');
}

function importBackupJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.savedChords)) state.savedChords = data.savedChords;
      if (Array.isArray(data.savedSongs)) state.savedSongs = data.savedSongs;
      persistAll();
      renderQuickChordsBar();
      showToast('Respaldo importado correctamente');
    } catch {
      showToast('El archivo JSON no es válido');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}