/**
 * script.js — Vellore Shortest Path Finder — UI Controller
 *
 * Responsibilities:
 *   1. Build & render the SVG graph overlay on the map image
 *   2. Populate source/destination dropdowns
 *   3. Call the backend API (or fall back to in-browser Dijkstra)
 *   4. Animate the Dijkstra traversal step-by-step
 *   5. Handle zoom/pan, click-to-select, and responsive layout
 */

/* ═══════════════════════════════════════════════════════════
   0. CONSTANTS & STATE
═══════════════════════════════════════════════════════════ */

// Map image natural size (the SVG coordinate space)
const MAP_W = 1200;
const MAP_H = 900;

// Node pixel positions — calibrated to the Vellore district map image
// (x,y) within the 1200×900 coordinate space
const NODE_POS = {
  "Tirupattur":      { x: 200, y: 648 },
  "Sundarampatti":   { x: 148, y: 718 },
  "Vishamangalam":   { x: 240, y: 735 },
  "Jolarpet":        { x: 192, y: 572 },
  "Nadamur":         { x: 326, y: 534 },
  "Vaniyambadi":     { x: 232, y: 490 },
  "Ambur":           { x: 308, y: 408 },
  "Melarasampattu":  { x: 448, y: 490 },
  "Odungattur":      { x: 424, y: 418 },
  "Peranampattu":    { x: 340, y: 274 },
  "Gudiyatham":      { x: 460, y: 270 },
  "Pallikondai":     { x: 548, y: 312 },
  "Vellore":         { x: 652, y: 320 },
  "Katpadi":         { x: 676, y: 232 },
  "VIT":             { x: 722, y: 260 },
  "CMC":             { x: 724, y: 332 },
  "Bagayam":         { x: 652, y: 382 },
  "Kaniyambadi":     { x: 724, y: 404 },
  "Arcot":           { x: 854, y: 330 },
  "Ranipet":         { x: 916, y: 298 },
  "Walajapet":       { x: 966, y: 298 },
  "Kaveripakkam":    { x: 1054, y: 300 },
  "Ammoor":          { x: 928, y: 246 },
  "Arakonam":        { x: 1082, y: 168 },
  "Kilpadi":         { x: 894, y: 402 },
  "Kalavai":         { x: 974, y: 432 },
  "Mambakkam":       { x: 1026, y: 502 },
};

// State
let graphData      = null;
let adjacencyList  = null;
let currentPath    = [];
let currentSteps   = [];
let animFrame      = null;
let svgScale       = 1;
let svgTranslate   = { x: 0, y: 0 };
let isDragging     = false;
let dragStart      = { x: 0, y: 0 };
let translateStart = { x: 0, y: 0 };

/* ═══════════════════════════════════════════════════════════
   1. INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initGraph();
  populateDropdowns();
  setupEventListeners();
  setupZoomPan();
  fitGraphToView();
});

function initGraph() {
  // GRAPH_DATA and buildAdjacencyList come from the inline graph.js script tag
  graphData     = GRAPH_DATA;
  adjacencyList = buildAdjacencyList(GRAPH_DATA);
  renderGraph();
}

/* ═══════════════════════════════════════════════════════════
   2. DROPDOWN POPULATION
═══════════════════════════════════════════════════════════ */
function populateDropdowns() {
  const names = Object.keys(graphData.nodes).sort();
  ['source', 'destination'].forEach(id => {
    const sel = document.getElementById(id);
    names.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   3. SVG GRAPH RENDERING
═══════════════════════════════════════════════════════════ */
function renderGraph() {
  const svg        = document.getElementById('graphSvg');
  const edgeGroup  = document.getElementById('edgeGroup');
  const edgeLGrp   = document.getElementById('edgeLabelGroup');
  const nodeGroup  = document.getElementById('nodeGroup');
  const nodeLGrp   = document.getElementById('nodeLabelGroup');

  // Set viewBox to our coordinate space
  svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`);

  // ── Draw Edges ──
  graphData.edges.forEach((edge, i) => {
    const a = NODE_POS[edge.from];
    const b = NODE_POS[edge.to];
    if (!a || !b) return;

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    // Line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('class', 'edge');
    line.dataset.from = edge.from;
    line.dataset.to   = edge.to;
    line.dataset.weight = edge.weight;
    line.id = `edge-${i}`;
    edgeGroup.appendChild(line);

    // Weight label
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', mx);
    lbl.setAttribute('y', my - 3);
    lbl.setAttribute('class', 'edge-label');
    lbl.dataset.edgeIdx = i;
    lbl.textContent = edge.weight + ' km';
    edgeLGrp.appendChild(lbl);
  });

  // ── Draw Nodes ──
  Object.entries(NODE_POS).forEach(([name, pos]) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node-group');
    g.setAttribute('transform', `translate(${pos.x},${pos.y})`);
    g.dataset.name = name;

    // Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', 8);
    circle.setAttribute('class', 'node-circle');
    circle.id = `node-${name.replace(/\s+/g, '_')}`;
    g.appendChild(circle);

    // Distance badge (shown during animation)
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badge.setAttribute('y', -14);
    badge.setAttribute('class', 'dist-badge');
    badge.id = `dist-${name.replace(/\s+/g, '_')}`;
    g.appendChild(badge);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const below = pos.y < 100 || isLabelBelow(name);
    label.setAttribute('y', below ? 22 : -12);
    label.setAttribute('class', 'node-label');
    label.id = `label-${name.replace(/\s+/g, '_')}`;
    label.textContent = name;
    g.appendChild(label);

    // Click to select
    g.addEventListener('click', () => onNodeClick(name));
    g.style.cursor = 'pointer';

    nodeGroup.appendChild(g);
  });
}

// Some nodes look better with label below the dot
function isLabelBelow(name) {
  return ['Sundarampatti','Vishamangalam','Kaniyambadi','Mambakkam','Bagayam','Melarasampattu','Kalavai'].includes(name);
}

/* ═══════════════════════════════════════════════════════════
   4. NODE CLICK TO SELECT
═══════════════════════════════════════════════════════════ */
function onNodeClick(name) {
  const src  = document.getElementById('source');
  const dest = document.getElementById('destination');

  if (!src.value || (src.value && dest.value)) {
    // Reset and set source
    src.value  = name;
    dest.value = '';
    resetVisuals();
  } else if (src.value && !dest.value && name !== src.value) {
    dest.value = name;
  }
  updateFindButton();
  highlightSelectedNodes();
}

function highlightSelectedNodes() {
  const src  = document.getElementById('source').value;
  const dest = document.getElementById('destination').value;
  // Reset all node classes first
  document.querySelectorAll('.node-circle').forEach(c => {
    c.classList.remove('source','dest','on-path','visited');
  });
  document.querySelectorAll('.node-label').forEach(l => {
    l.classList.remove('source','dest','on-path');
  });
  if (src) {
    const id = `node-${src.replace(/\s+/g,'_')}`;
    document.getElementById(id)?.classList.add('source');
    document.getElementById(`label-${src.replace(/\s+/g,'_')}`)?.classList.add('source');
  }
  if (dest) {
    const id = `node-${dest.replace(/\s+/g,'_')}`;
    document.getElementById(id)?.classList.add('dest');
    document.getElementById(`label-${dest.replace(/\s+/g,'_')}`)?.classList.add('dest');
  }
}

/* ═══════════════════════════════════════════════════════════
   5. EVENT LISTENERS
═══════════════════════════════════════════════════════════ */
function setupEventListeners() {
  const srcSel  = document.getElementById('source');
  const dstSel  = document.getElementById('destination');
  const findBtn = document.getElementById('findBtn');
  const resetBtn= document.getElementById('resetBtn');

  srcSel.addEventListener('change', () => { highlightSelectedNodes(); updateFindButton(); });
  dstSel.addEventListener('change', () => { highlightSelectedNodes(); updateFindButton(); });

  findBtn.addEventListener('click', onFindPath);
  resetBtn.addEventListener('click', onReset);

  document.getElementById('toggleSteps').addEventListener('click', () => {
    const content = document.getElementById('stepsContent');
    const btn     = document.getElementById('toggleSteps');
    content.classList.toggle('hidden');
    btn.textContent = content.classList.contains('hidden') ? 'Show' : 'Hide';
  });
}

function updateFindButton() {
  const src  = document.getElementById('source').value;
  const dest = document.getElementById('destination').value;
  document.getElementById('findBtn').disabled = !(src && dest && src !== dest);
}

/* ═══════════════════════════════════════════════════════════
   6. FIND PATH — MAIN HANDLER
═══════════════════════════════════════════════════════════ */
async function onFindPath() {
  const source      = document.getElementById('source').value;
  const destination = document.getElementById('destination').value;
  const errEl       = document.getElementById('inputError');
  errEl.classList.add('hidden');

  // Validate
  if (!source || !destination) {
    showError('Please select both source and destination.'); return;
  }
  if (source === destination) {
    showError('Source and destination must be different.'); return;
  }

  // Clear previous
  resetVisuals();
  showLoading(true);

  try {
    let result;

    // Try backend API first; fall back to in-browser computation
    try {
      const res = await fetch('/api/shortest-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination }),
      });
      if (!res.ok) throw new Error('API error');
      result = await res.json();
      // Deserialise steps.visited arrays → Sets
      result.steps = result.steps.map(s => ({
        ...s,
        visited: new Set(s.visited),
      }));
    } catch (_) {
      // Offline / standalone mode — run Dijkstra client-side
      result = dijkstra(adjacencyList, source, destination);
    }

    showLoading(false);

    if (!result.path || result.path.length === 0) {
      showError(`No path found between ${source} and ${destination}.`);
      return;
    }

    currentPath  = result.path;
    currentSteps = result.steps;

    // Display result panel
    showResult(result.path, result.distance);

    // Animate traversal
    animateTraversal(result.steps, result.path, source, destination);

  } catch (err) {
    showLoading(false);
    showError('An unexpected error occurred. Please try again.');
    console.error(err);
  }
}

/* ═══════════════════════════════════════════════════════════
   7. RESULT PANEL
═══════════════════════════════════════════════════════════ */
function showResult(path, distance) {
  const content = document.getElementById('resultContent');
  content.innerHTML = '';

  // Big distance number
  const distEl = document.createElement('div');
  distEl.className = 'result-distance';
  distEl.textContent = distance + ' km';
  content.appendChild(distEl);

  const distLbl = document.createElement('div');
  distLbl.className = 'result-distance-label';
  distLbl.textContent = 'Total Distance';
  content.appendChild(distLbl);

  // Path chips
  const pathDiv = document.createElement('div');
  pathDiv.className = 'path-nodes';
  path.forEach((node, i) => {
    if (i > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'path-arrow';
      arrow.textContent = '›';
      pathDiv.appendChild(arrow);
    }
    const chip = document.createElement('span');
    chip.className = 'path-node-chip';
    if (i === 0) chip.classList.add('source');
    if (i === path.length - 1) chip.classList.add('dest');
    chip.textContent = node;
    pathDiv.appendChild(chip);
  });
  content.appendChild(pathDiv);

  // Hop count
  const count = document.createElement('div');
  count.className = 'path-count';
  count.textContent = `${path.length} nodes · ${path.length - 1} hops`;
  content.appendChild(count);
}

/* ═══════════════════════════════════════════════════════════
   8. ANIMATION — STEP-BY-STEP TRAVERSAL
═══════════════════════════════════════════════════════════ */
function animateTraversal(steps, path, source, destination) {
  const stepsEl  = document.getElementById('stepsContent');
  const pathSet  = new Set(path);
  const pathEdges = buildPathEdgeSet(path);

  let stepIdx = 0;

  function applyStep() {
    if (stepIdx >= steps.length) {
      // Final state: highlight the shortest path
      finalizePath(path, pathEdges, source, destination);
      return;
    }

    const step = steps[stepIdx];

    // Colour visited nodes
    step.visited.forEach(name => {
      const el = document.getElementById(`node-${name.replace(/\s+/g,'_')}`);
      if (el && !el.classList.contains('source') && !el.classList.contains('dest')) {
        el.classList.add('visited');
      }
    });

    // Highlight current node briefly
    const curEl = document.getElementById(`node-${step.current.replace(/\s+/g,'_')}`);
    if (curEl) {
      curEl.style.fill = '#a78bfa';
      setTimeout(() => {
        if (!pathSet.has(step.current)) {
          curEl.style.fill = '';
        }
      }, 180);
    }

    // Show updated distance on badge
    Object.entries(step.distances).forEach(([name, dist]) => {
      const badge = document.getElementById(`dist-${name.replace(/\s+/g,'_')}`);
      if (badge) {
        badge.textContent = dist === Infinity ? '∞' : dist;
        badge.classList.add('show');
      }
    });

    // Append step to the steps list
    appendStepItem(stepIdx, step);

    stepIdx++;
    animFrame = setTimeout(applyStep, 80);
  }

  applyStep();
}

function appendStepItem(idx, step) {
  const stepsEl = document.getElementById('stepsContent');

  // Remove "active" from previous
  stepsEl.querySelector('.active-step')?.classList.remove('active-step');

  const item = document.createElement('div');
  item.className = 'step-item active-step';

  const dist = step.distances[step.current];
  item.innerHTML =
    `<span class="step-num">#${idx + 1} </span>` +
    `Visit <span class="step-node">${step.current}</span>` +
    ` — dist <span class="step-dist">${dist === Infinity ? '∞' : dist + ' km'}</span>` +
    (step.previous[step.current]
      ? ` via <span class="step-node">${step.previous[step.current]}</span>`
      : '');

  stepsEl.appendChild(item);
  stepsEl.scrollTop = stepsEl.scrollHeight;
}

function finalizePath(path, pathEdges, source, destination) {
  // Colour path edges
  document.querySelectorAll('.edge').forEach(edge => {
    const key1 = `${edge.dataset.from}|${edge.dataset.to}`;
    const key2 = `${edge.dataset.to}|${edge.dataset.from}`;
    if (pathEdges.has(key1) || pathEdges.has(key2)) {
      edge.classList.add('path-edge', 'animate');
    }
  });

  // Colour edge labels
  document.querySelectorAll('.edge-label').forEach(lbl => {
    const idx  = parseInt(lbl.dataset.edgeIdx);
    const edge = graphData.edges[idx];
    if (!edge) return;
    const k1 = `${edge.from}|${edge.to}`;
    const k2 = `${edge.to}|${edge.from}`;
    if (pathEdges.has(k1) || pathEdges.has(k2)) {
      lbl.classList.add('path-label');
    }
  });

  // Colour path nodes
  path.forEach((name, i) => {
    const id  = `node-${name.replace(/\s+/g,'_')}`;
    const lid = `label-${name.replace(/\s+/g,'_')}`;
    const el  = document.getElementById(id);
    const lel = document.getElementById(lid);
    if (!el) return;

    el.classList.remove('visited');
    el.style.fill = '';

    if (i === 0) {
      el.classList.add('source'); lel?.classList.add('source');
    } else if (i === path.length - 1) {
      el.classList.add('dest'); lel?.classList.add('dest');
    } else {
      el.classList.add('on-path'); lel?.classList.add('on-path');
    }
  });
}

function buildPathEdgeSet(path) {
  const s = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    s.add(`${path[i]}|${path[i+1]}`);
    s.add(`${path[i+1]}|${path[i]}`);
  }
  return s;
}

/* ═══════════════════════════════════════════════════════════
   9. RESET
═══════════════════════════════════════════════════════════ */
function onReset() {
  document.getElementById('source').value      = '';
  document.getElementById('destination').value = '';
  document.getElementById('inputError').classList.add('hidden');
  document.getElementById('resultContent').innerHTML =
    '<div class="result-placeholder">Run the algorithm to see results here.</div>';
  document.getElementById('stepsContent').innerHTML = '';
  currentPath = []; currentSteps = [];
  resetVisuals();
  updateFindButton();
}

function resetVisuals() {
  if (animFrame) { clearTimeout(animFrame); animFrame = null; }

  // Edges
  document.querySelectorAll('.edge').forEach(e => {
    e.classList.remove('visited','path-edge','animate');
  });
  document.querySelectorAll('.edge-label').forEach(l => l.classList.remove('path-label'));

  // Nodes
  document.querySelectorAll('.node-circle').forEach(c => {
    c.classList.remove('source','dest','on-path','visited');
    c.style.fill = '';
  });
  document.querySelectorAll('.node-label').forEach(l => {
    l.classList.remove('source','dest','on-path');
  });

  // Distance badges
  document.querySelectorAll('.dist-badge').forEach(b => {
    b.classList.remove('show');
    b.textContent = '';
  });
}

/* ═══════════════════════════════════════════════════════════
   10. ZOOM & PAN
═══════════════════════════════════════════════════════════ */
function setupZoomPan() {
  const container = document.getElementById('mapContainer');
  const svg       = document.getElementById('graphSvg');

  // Mouse wheel zoom
  container.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    svgScale = Math.min(Math.max(svgScale * delta, 0.4), 4);
    applyTransform(svg);
  }, { passive: false });

  // Drag / pan
  container.addEventListener('mousedown', e => {
    isDragging    = true;
    dragStart     = { x: e.clientX, y: e.clientY };
    translateStart = { ...svgTranslate };
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    svgTranslate.x = translateStart.x + (e.clientX - dragStart.x);
    svgTranslate.y = translateStart.y + (e.clientY - dragStart.y);
    applyTransform(svg);
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch
  let lastTouch = null;
  container.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging     = true;
      dragStart      = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart = { ...svgTranslate };
    }
    lastTouch = e;
  }, { passive: true });
  container.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    svgTranslate.x = translateStart.x + (e.touches[0].clientX - dragStart.x);
    svgTranslate.y = translateStart.y + (e.touches[0].clientY - dragStart.y);
    applyTransform(svg);
  }, { passive: true });
  container.addEventListener('touchend', () => { isDragging = false; });

  // Toolbar buttons
  document.getElementById('zoomIn').addEventListener('click',    () => { svgScale = Math.min(svgScale * 1.25, 4);  applyTransform(svg); });
  document.getElementById('zoomOut').addEventListener('click',   () => { svgScale = Math.max(svgScale * 0.8, 0.4); applyTransform(svg); });
  document.getElementById('zoomReset').addEventListener('click', () => { fitGraphToView(); });
}

function applyTransform(svg) {
  svg.style.transform = `translate(${svgTranslate.x}px,${svgTranslate.y}px) scale(${svgScale})`;
  svg.style.transformOrigin = '0 0';
}

function fitGraphToView() {
  svgScale     = 1;
  svgTranslate = { x: 0, y: 0 };
  const svg = document.getElementById('graphSvg');
  applyTransform(svg);
}

/* ═══════════════════════════════════════════════════════════
   11. HELPERS
═══════════════════════════════════════════════════════════ */
function showError(msg) {
  const el = document.getElementById('inputError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.toggle('hidden', !show);
}
