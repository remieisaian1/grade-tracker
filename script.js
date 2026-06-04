const STORAGE_KEY = "degree-tracker-v1";

let nid = 1;

const newComp = () => ({
  id: nid++,
  name: "",
  weight: "",
  grade: ""
});

const newModule = name => ({
  id: nid++,
  name,
  components: [newComp()]
});

const defaultData = () => ({
  weights: {
    y2: 25,
    y3: 75
  },
  y2: {
    modules: [newModule("Module 1")]
  },
  y3: {
    modules: [
      newModule("Module 1"),
      newModule("Module 2"),
      newModule("Module 3"),
      newModule("Module 4")
    ]
  }
});

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultData();
    }

    const parsed = JSON.parse(saved);

    if (!parsed.weights) {
      parsed.weights = {
        y2: 25,
        y3: 75
      };
    }

    const allIds = [...parsed.y2.modules, ...parsed.y3.modules]
      .flatMap(module => [
        module.id,
        ...module.components.map(component => component.id)
      ]);

    nid = Math.max(...allIds) + 1;

    return parsed;
  } catch (error) {
    return defaultData();
  }
}

let data = loadData();
let saveTimer = null;

function saveData() {
  const statusEl = document.getElementById("save-status");

  statusEl.textContent = "saving…";
  statusEl.className = "save-status saving";

  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      statusEl.textContent = "auto-saved";
      statusEl.className = "save-status saved";
    } catch (error) {
      statusEl.textContent = "save failed";
      statusEl.className = "save-status";
    }
  }, 600);
}

function clearData() {
  if (!confirm("Clear all your saved grades? This cannot be undone.")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  nid = 1;
  data = defaultData();

  render();
  showToast("All data cleared");
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.querySelectorAll(".year-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  document.getElementById("tab-" + tabName).classList.add("active");
}

function calcModuleGrade(module) {
  const validComponents = module.components.filter(component =>
    component.grade !== "" &&
    component.weight !== "" &&
    Number(component.weight) > 0 &&
    !isNaN(Number(component.grade))
  );

  if (!validComponents.length) {
    return null;
  }

  const totalWeight = validComponents.reduce((sum, component) => {
    return sum + Number(component.weight);
  }, 0);

  return validComponents.reduce((sum, component) => {
    return sum + Number(component.grade) * Number(component.weight);
  }, 0) / totalWeight;
}

function calcYearAvg(year) {
  const grades = data[year].modules
    .map(calcModuleGrade)
    .filter(grade => grade !== null);

  if (!grades.length) {
    return null;
  }

  return grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
}

function clampWeight(value) {
  const number = Number(value);

  if (isNaN(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, number));
}

function roundWeight(value) {
  return Math.round(value * 10) / 10;
}

function yearWeight(year) {
  return clampWeight(data.weights[year]);
}

function setYearWeight(changedYear, value) {
  const currentValue = roundWeight(clampWeight(value));
  const otherYear = changedYear === "y2" ? "y3" : "y2";

  data.weights[changedYear] = currentValue;
  data.weights[otherYear] = roundWeight(100 - currentValue);
}

function barColor(grade) {
  if (grade >= 70) return "#27500a";
  if (grade >= 60) return "#0c447c";
  if (grade >= 50) return "#854f0b";
  return "#a32d2d";
}

function classify(grade) {
  if (grade >= 70) {
    return {
      label: "First class",
      cls: "cls-first"
    };
  }

  if (grade >= 60) {
    return {
      label: "2:1",
      cls: "cls-21"
    };
  }

  if (grade >= 50) {
    return {
      label: "2:2",
      cls: "cls-22"
    };
  }

  return {
    label: "Third / below",
    cls: "cls-third"
  };
}

function recalculate() {
  const y2 = calcYearAvg("y2");
  const y3 = calcYearAvg("y3");

  const w2 = yearWeight("y2");
  const w3 = yearWeight("y3");

  document.getElementById("y2avg").textContent = y2 !== null ? y2.toFixed(1) + "%" : "—";
  document.getElementById("y3avg").textContent = y3 !== null ? y3.toFixed(1) + "%" : "—";

  document.getElementById("y2weight").value = w2;
  document.getElementById("y3weight").value = w3;

  document.getElementById("y2weightText").textContent = "weight: " + w2 + "%";
  document.getElementById("y3weightText").textContent = "weight: " + w3 + "%";

  document.getElementById("weight-total").textContent = w2 + w3 + "% total";

  document.getElementById("formula-note").textContent =
    "Final = (Year 2 avg × " + w2 + "%) + (Year 3 avg × " + w3 + "%)";

  if (y2 !== null && y3 !== null) {
    const finalGrade = y2 * (w2 / 100) + y3 * (w3 / 100);

    document.getElementById("final").textContent = finalGrade.toFixed(1) + "%";

    const classification = classify(finalGrade);
    const badge = document.getElementById("cls-badge");

    badge.textContent = classification.label;
    badge.className = "cls-badge " + classification.cls;
  } else {
    document.getElementById("final").textContent = "—";

    const badge = document.getElementById("cls-badge");
    badge.textContent = "add grades";
    badge.className = "cls-badge cls-tbd";
  }

  renderTargets();
}

function renderTargets() {
  const y2 = calcYearAvg("y2");
  const container = document.getElementById("targets-content");

  const w2 = yearWeight("y2");
  const w3 = yearWeight("y3");

  if (y2 === null) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text2)">Add Year 2 grades first.</p>';
    return;
  }

  if (w3 <= 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text2)">Set Year 3 weight above 0% to calculate targets.</p>';
    return;
  }

  const targets = [
    {
      label: "First class (70%+)",
      t: 70
    },
    {
      label: "2:1 (60%+)",
      t: 60
    },
    {
      label: "2:2 (50%+)",
      t: 50
    }
  ];

  container.innerHTML = targets.map(target => {
    const needed = (target.t - y2 * (w2 / 100)) / (w3 / 100);

    let text;
    let cls;

    if (needed <= 0) {
      text = "already secured";
      cls = "need-ok";
    } else if (needed > 100) {
      text = "not achievable";
      cls = "need-no";
    } else {
      text = "need " + needed.toFixed(1) + "% avg in Year 3";
      cls = "need-num";
    }

    return `
      <div class="need-row">
        <span style="font-weight:600">${target.label}</span>
        <span class="${cls}">${text}</span>
      </div>
    `;
  }).join("");
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function renderYear(year) {
  const panel = document.getElementById("tab-" + year);

  panel.innerHTML = data[year].modules.map(module => {
    const grade = calcModuleGrade(module);

    const totalWeight = module.components.reduce((sum, component) => {
      return sum + (Number(component.weight) || 0);
    }, 0);

    const warning = totalWeight > 0 && Math.abs(totalWeight - 100) > 0.5
      ? "weights total " + totalWeight.toFixed(0) + "% — should add up to 100%"
      : "";

    return `
      <div class="card">
        <div class="card-header">
          <input
            class="module-name-input"
            value="${esc(module.name)}"
            placeholder="Module name"
            data-yr="${year}"
            data-mid="${module.id}"
            data-field="mname"
          />

          <div style="display:flex;align-items:center;gap:6px">
            <span class="module-grade" id="badge-${year}-${module.id}">
              ${grade !== null ? grade.toFixed(1) + "%" : "—"}
            </span>

            <button
              class="del-mod-btn"
              data-yr="${year}"
              data-mid="${module.id}"
              data-action="delmod"
            >
              remove
            </button>
          </div>
        </div>

        <div class="bar-wrap">
          <div
            class="bar-fill"
            id="bar-${year}-${module.id}"
            style="width:${grade !== null ? Math.min(grade, 100) : 0}%;background:${grade !== null ? barColor(grade) : "transparent"}"
          ></div>
        </div>

        <div class="col-headers">
          <div class="col-hdr">assessment</div>
          <div class="col-hdr">weight %</div>
          <div class="col-hdr">grade %</div>
          <div></div>
        </div>

        ${module.components.map(component => `
          <div class="comp-row">
            <input
              class="comp-input name-input"
              placeholder="e.g. Exam 1"
              value="${esc(component.name)}"
              data-yr="${year}"
              data-mid="${module.id}"
              data-cid="${component.id}"
              data-field="name"
            />

            <input
              class="comp-input"
              type="number"
              min="0"
              max="100"
              placeholder="40"
              value="${esc(component.weight)}"
              data-yr="${year}"
              data-mid="${module.id}"
              data-cid="${component.id}"
              data-field="weight"
            />

            <input
              class="comp-input"
              type="number"
              min="0"
              max="100"
              placeholder="72"
              value="${esc(component.grade)}"
              data-yr="${year}"
              data-mid="${module.id}"
              data-cid="${component.id}"
              data-field="grade"
            />

            <button
              class="rm-btn"
              data-yr="${year}"
              data-mid="${module.id}"
              data-cid="${component.id}"
              data-action="delcomp"
            >
              ×
            </button>
          </div>
        `).join("")}

        <div class="weight-warn" id="warn-${year}-${module.id}">
          ${warning}
        </div>

        <button
          class="add-comp-btn"
          data-yr="${year}"
          data-mid="${module.id}"
          data-action="addcomp"
        >
          + add assessment
        </button>
      </div>
    `;
  }).join("") + `
    <button class="add-mod-btn" data-yr="${year}" data-action="addmod">
      + add module
    </button>
  `;
}

function refreshModuleBadge(year, moduleId) {
  const module = data[year].modules.find(item => item.id === moduleId);

  if (!module) {
    return;
  }

  const grade = calcModuleGrade(module);

  const badge = document.getElementById("badge-" + year + "-" + moduleId);
  const bar = document.getElementById("bar-" + year + "-" + moduleId);
  const warning = document.getElementById("warn-" + year + "-" + moduleId);

  if (badge) {
    badge.textContent = grade !== null ? grade.toFixed(1) + "%" : "—";
  }

  if (bar) {
    bar.style.width = (grade !== null ? Math.min(grade, 100) : 0) + "%";
    bar.style.background = grade !== null ? barColor(grade) : "transparent";
  }

  if (warning) {
    const totalWeight = module.components.reduce((sum, component) => {
      return sum + (Number(component.weight) || 0);
    }, 0);

    warning.textContent = totalWeight > 0 && Math.abs(totalWeight - 100) > 0.5
      ? "weights total " + totalWeight.toFixed(0) + "% — should add up to 100%"
      : "";
  }
}

function render() {
  renderYear("y2");
  renderYear("y3");
  recalculate();
}

document.body.addEventListener("input", event => {
  const element = event.target;

  if (element.dataset.weightYear) {
    setYearWeight(element.dataset.weightYear, element.value);
    recalculate();
    saveData();
    return;
  }

  const year = element.dataset.yr;
  const moduleId = Number(element.dataset.mid);
  const componentId = Number(element.dataset.cid);
  const field = element.dataset.field;

  if (!year || !field) {
    return;
  }

  const module = data[year].modules.find(item => item.id === moduleId);

  if (!module) {
    return;
  }

  if (field === "mname") {
    module.name = element.value;
  } else {
    const component = module.components.find(item => item.id === componentId);

    if (component) {
      component[field] = element.value;
    }
  }

  refreshModuleBadge(year, moduleId);
  recalculate();
  saveData();
});

document.body.addEventListener("click", event => {
  const tabButton = event.target.closest("[data-tab]");

  if (tabButton) {
    switchTab(tabButton.dataset.tab);
    return;
  }

  function exportGradesAsPDF() {
  const y2Average = calcYearAvg("y2");
  const y3Average = calcYearAvg("y3");

  const y2Weight = yearWeight("y2");
  const y3Weight = yearWeight("y3");

  const finalGrade = y2Average !== null && y3Average !== null
    ? y2Average * (y2Weight / 100) + y3Average * (y3Weight / 100)
    : null;

  const classification = finalGrade !== null
    ? classify(finalGrade).label
    : "Not enough grades added";

  const today = new Date().toLocaleDateString("en-GB");

  function moduleRows(year) {
    return data[year].modules.map(module => {
      const moduleGrade = calcModuleGrade(module);

      const componentRows = module.components.map(component => {
        return `
          <tr>
            <td>${esc(component.name || "Untitled assessment")}</td>
            <td>${component.weight || "—"}%</td>
            <td>${component.grade || "—"}%</td>
          </tr>
        `;
      }).join("");

      return `
        <section class="print-module">
          <h3>${esc(module.name || "Untitled module")}</h3>
          <p>
            Module grade:
            <strong>${moduleGrade !== null ? moduleGrade.toFixed(1) + "%" : "Not calculated"}</strong>
          </p>

          <table>
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Weight</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${componentRows}
            </tbody>
          </table>
        </section>
      `;
    }).join("");
  }

  const reportHTML = `
    <section id="print-report">
      <header class="print-header">
        <h1>Degree Grade Report</h1>
        <p>Generated on ${today} using Degree Grade Tracker.</p>
      </header>

      <section class="print-summary">
        <div>
          <span>Year 2 average</span>
          <strong>${y2Average !== null ? y2Average.toFixed(1) + "%" : "—"}</strong>
          <p>Weight: ${y2Weight}%</p>
        </div>

        <div>
          <span>Year 3 average</span>
          <strong>${y3Average !== null ? y3Average.toFixed(1) + "%" : "—"}</strong>
          <p>Weight: ${y3Weight}%</p>
        </div>

        <div>
          <span>Final grade</span>
          <strong>${finalGrade !== null ? finalGrade.toFixed(1) + "%" : "—"}</strong>
          <p>${classification}</p>
        </div>
      </section>

      <section class="print-year">
        <h2>Year 2 Modules</h2>
        ${moduleRows("y2")}
      </section>

      <section class="print-year">
        <h2>Year 3 Modules</h2>
        ${moduleRows("y3")}
      </section>

      <p class="print-note">
        This report is an estimate only. Universities may use different rules for credits,
        rounding, compensation, borderline classifications, or final degree calculations.
        Always check your official university regulations.
      </p>
    </section>
  `;

  let printArea = document.getElementById("print-area");

  if (!printArea) {
    printArea = document.createElement("div");
    printArea.id = "print-area";
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = reportHTML;

  setTimeout(() => {
    window.print();
  }, 100);
}
if (event.target.closest("#export-pdf-btn")) {
  exportGradesAsPDF();
  return;
}

  if (event.target.closest("#clear-data-btn")) {
    clearData();
    return;
  }

  const element = event.target.closest("[data-action]");

  if (!element) {
    return;
  }

  const year = element.dataset.yr;
  const moduleId = Number(element.dataset.mid);
  const componentId = Number(element.dataset.cid);
  const action = element.dataset.action;

  if (action === "addmod") {
    data[year].modules.push(newModule("Module " + (data[year].modules.length + 1)));
    render();
    saveData();
  }

  if (action === "addcomp") {
    const module = data[year].modules.find(item => item.id === moduleId);

    if (module) {
      module.components.push(newComp());
      render();
      saveData();
    }
  }

  if (action === "delmod") {
    if (data[year].modules.length > 1) {
      data[year].modules = data[year].modules.filter(item => item.id !== moduleId);
      render();
      saveData();
    }
  }

  if (action === "delcomp") {
    const module = data[year].modules.find(item => item.id === moduleId);

    if (module && module.components.length > 1) {
      module.components = module.components.filter(item => item.id !== componentId);
      render();
      saveData();
    }
  }
});

render();