const STORAGE_KEY = 'degree-tracker-v1';
let nid = 1;
const newComp = () => ({ id: nid++, name: "", weight: "", grade: "" });
const newModule = n => ({ id: nid++, name: n, components: [newComp()] });

const defaultData = () => ({
  weights: { y2: 25, y3: 75 },
  y2: { modules: [newModule("Module 1")] },
  y3: { modules: [newModule("Module 1"), newModule("Module 2"), newModule("Module 3"), newModule("Module 4")] }
});

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultData();
    const parsed = JSON.parse(saved);
    if (!parsed.weights) parsed.weights = { y2: 25, y3: 75 };
    // restore nid to avoid collisions
    const allIds = [...parsed.y2.modules, ...parsed.y3.modules]
      .flatMap(m => [m.id, ...m.components.map(c => c.id)]);
      
    nid = Math.max(...allIds) + 1;
    return parsed;
  } catch(e) {
    return defaultData();
  }
}

let saveTimer = null;
function saveData() {
  const statusEl = document.getElementById('save-status');
  statusEl.textContent = 'saving…';
  statusEl.className = 'save-status saving';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      statusEl.textContent = 'auto-saved';
      statusEl.className = 'save-status saved';
    } catch(e) {
      statusEl.textContent = 'save failed';
      statusEl.className = 'save-status';
    }
  }, 600);
}

function clearData() {
  if (!confirm('Clear all your saved grades? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  nid = 1;
  Object.assign(data, defaultData());
  render();
  showToast('All data cleared');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

let data = loadData();
if (!data.weights) data.weights = { y2: 25, y3: 75 };

function switchTab(t) {
  document.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('active', ['y2','y3','targets'][i] === t));
  document.querySelectorAll('.year-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
}

const calcModuleGrade = m => {
  const v = m.components.filter(c => c.grade !== "" && c.weight !== "" && +c.weight > 0 && !isNaN(+c.grade));
  if (!v.length) return null;
  const tw = v.reduce((s, c) => s + +c.weight, 0);
  return v.reduce((s, c) => s + +c.grade * +c.weight, 0) / tw;
};

const calcYearAvg = yr => {
  const grades = data[yr].modules.map(calcModuleGrade).filter(g => g !== null);
  return grades.length ? grades.reduce((s, g) => s + g, 0) / grades.length : null;
};

const yearWeight = yr => Math.max(0, Math.min(100, +(data.weights?.[yr] ?? (yr === 'y2' ? 25 : 75)) || 0));

const barColor = g => g >= 70 ? "#27500a" : g >= 60 ? "#0c447c" : g >= 50 ? "#854f0b" : "#a32d2d";
const classify = g => g >= 70 ? { label: "First class", cls: "cls-first" }
  : g >= 60 ? { label: "2:1", cls: "cls-21" }
  : g >= 50 ? { label: "2:2", cls: "cls-22" }
  : { label: "Third / below", cls: "cls-third" };

function recalculate() {
  const y2 = calcYearAvg('y2'), y3 = calcYearAvg('y3');
  const w2 = yearWeight('y2'), w3 = yearWeight('y3');
  document.getElementById('y2avg').textContent = y2 !== null ? y2.toFixed(1) + "%" : "—";
  document.getElementById('y3avg').textContent = y3 !== null ? y3.toFixed(1) + "%" : "—";
  document.getElementById('y2weight').value = w2;
  document.getElementById('y3weight').value = w3;
  document.getElementById('formula-note').textContent = "Final = (Year 2 avg × " + w2 + "%) + (Year 3 avg × " + w3 + "%)" + (w2 + w3 !== 100 ? " · warning: weights should usually total 100%" : " · change the year weights if your university uses a different formula");
  if (y2 !== null && y3 !== null) {
    const f = y2 * (w2 / 100) + y3 * (w3 / 100);
    document.getElementById('final').textContent = f.toFixed(1) + "%";
    const { label, cls } = classify(f);
    Object.assign(document.getElementById('cls-badge'), { textContent: label, className: "cls-badge " + cls });
  } else {
    document.getElementById('final').textContent = "—";
    Object.assign(document.getElementById('cls-badge'), { textContent: "add grades", className: "cls-badge cls-tbd" });
  }
  renderTargets();
}

function renderTargets() {
  const y2 = calcYearAvg('y2'), cont = document.getElementById('targets-content');
  const w2 = yearWeight('y2'), w3 = yearWeight('y3');
  if (y2 === null) { cont.innerHTML = '<p style="font-size:13px;color:var(--text2)">Add Year 2 grades first.</p>'; return; }
  if (w3 <= 0) { cont.innerHTML = '<p style="font-size:13px;color:var(--text2)">Set Year 3 weight above 0% to calculate targets.</p>'; return; }
  cont.innerHTML = [{ label: "First class (70%+)", t: 70 }, { label: "2:1 (60%+)", t: 60 }, { label: "2:2 (50%+)", t: 50 }]
    .map(th => {
      const n = (th.t - y2 * (w2 / 100)) / (w3 / 100);
      const [txt, cls] = n <= 0 ? ["already secured", "need-ok"] : n > 100 ? ["not achievable", "need-no"] : ["need " + n.toFixed(1) + "% avg in Year 3", "need-num"];
      return '<div class="need-row"><span style="font-weight:600">' + th.label + '</span><span class="' + cls + '">' + txt + '</span></div>';
    }).join('');
}

const esc = s => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');

function renderYear(yr) {
  const panel = document.getElementById('tab-' + yr);
  panel.innerHTML = data[yr].modules.map(m => {
    const g = calcModuleGrade(m);
    const totalW = m.components.reduce((s, c) => s + (+c.weight || 0), 0);
    const warn = totalW > 0 && Math.abs(totalW - 100) > 0.5 ? "weights total " + totalW.toFixed(0) + "% — should add up to 100%" : "";
    return '<div class="card">' +
      '<div class="card-header">' +
        '<input class="module-name-input" value="' + esc(m.name) + '" placeholder="Module name" data-yr="' + yr + '" data-mid="' + m.id + '" data-field="mname" />' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<span class="module-grade" id="badge-' + yr + '-' + m.id + '">' + (g !== null ? g.toFixed(1) + "%" : "—") + '</span>' +
          '<button class="del-mod-btn" data-yr="' + yr + '" data-mid="' + m.id + '" data-action="delmod">remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="bar-wrap"><div class="bar-fill" id="bar-' + yr + '-' + m.id + '" style="width:' + (g !== null ? Math.min(g,100) : 0) + '%;background:' + (g !== null ? barColor(g) : 'transparent') + '"></div></div>' +
      '<div class="col-headers"><div class="col-hdr">assessment</div><div class="col-hdr">weight %</div><div class="col-hdr">grade %</div><div></div></div>' +
      m.components.map(c =>
        '<div class="comp-row">' +
          '<input class="comp-input name-input" placeholder="e.g. Exam 1" value="' + esc(c.name) + '" data-yr="' + yr + '" data-mid="' + m.id + '" data-cid="' + c.id + '" data-field="name" />' +
          '<input class="comp-input" type="number" min="0" max="100" placeholder="40" value="' + esc(c.weight) + '" data-yr="' + yr + '" data-mid="' + m.id + '" data-cid="' + c.id + '" data-field="weight" />' +
          '<input class="comp-input" type="number" min="0" max="100" placeholder="72" value="' + esc(c.grade) + '" data-yr="' + yr + '" data-mid="' + m.id + '" data-cid="' + c.id + '" data-field="grade" />' +
          '<button class="rm-btn" data-yr="' + yr + '" data-mid="' + m.id + '" data-cid="' + c.id + '" data-action="delcomp">×</button>' +
        '</div>'
      ).join('') +
      '<div class="weight-warn" id="warn-' + yr + '-' + m.id + '">' + warn + '</div>' +
      '<button class="add-comp-btn" data-yr="' + yr + '" data-mid="' + m.id + '" data-action="addcomp">+ add assessment</button>' +
    '</div>';
  }).join('') + '<button class="add-mod-btn" data-yr="' + yr + '" data-action="addmod">+ add module</button>';
}

function refreshModuleBadge(yr, mid) {
  const m = data[yr].modules.find(x => x.id === mid);
  if (!m) return;
  const g = calcModuleGrade(m);
  const badge = document.getElementById("badge-" + yr + "-" + mid);
  const bar = document.getElementById("bar-" + yr + "-" + mid);
  const warn = document.getElementById("warn-" + yr + "-" + mid);
  if (badge) badge.textContent = g !== null ? g.toFixed(1) + "%" : "—";
  if (bar) { bar.style.width = (g !== null ? Math.min(g,100) : 0) + "%"; bar.style.background = g !== null ? barColor(g) : "transparent"; }
  if (warn) {
    const tw = m.components.reduce((s, c) => s + (+c.weight || 0), 0);
    warn.textContent = tw > 0 && Math.abs(tw - 100) > 0.5 ? "weights total " + tw.toFixed(0) + "% — should add up to 100%" : "";
  }
}

function render() { renderYear('y2'); renderYear('y3'); recalculate(); }

document.body.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.weightYear) {
    data.weights[el.dataset.weightYear] = +el.value || 0;
    recalculate();
    saveData();
    return;
  }
  const yr = el.dataset.yr, mid = +el.dataset.mid, cid = +el.dataset.cid, field = el.dataset.field;
  if (!yr || !field) return;
  const m = data[yr].modules.find(x => x.id === mid);
  if (!m) return;
  if (field === 'mname') { m.name = el.value; }
  else { const c = m.components.find(x => x.id === cid); if (c) c[field] = el.value; }
  refreshModuleBadge(yr, mid);
  recalculate();
  saveData();
});

document.body.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const yr = el.dataset.yr, mid = +el.dataset.mid, cid = +el.dataset.cid, action = el.dataset.action;
  if (action === 'addmod') { data[yr].modules.push(newModule("Module " + (data[yr].modules.length + 1))); render(); saveData(); }
  else if (action === 'addcomp') { const m = data[yr].modules.find(x => x.id === mid); if (m) { m.components.push(newComp()); render(); saveData(); } }
  else if (action === 'delmod') { if (data[yr].modules.length > 1) { data[yr].modules = data[yr].modules.filter(x => x.id !== mid); render(); saveData(); } }
  else if (action === 'delcomp') { const m = data[yr].modules.find(x => x.id === mid); if (m && m.components.length > 1) { m.components = m.components.filter(x => x.id !== cid); render(); saveData(); } }
});

render();
