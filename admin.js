(() => {
const {
  exportTentTypes,
  getComponentLibrary,
  getTentTypes,
  importTentTypesFromJson,
  resetTentTypes,
  saveTentTypes
} = window.recipeStore;

const ADMIN_PIN = "hubi32";
const ADMIN_UNLOCK_KEY = "pfadfinder-schiefbahn-admin-unlocked";

const appViewEl = document.querySelector("#appView");
const adminHostEl = document.querySelector("#adminHost");
const openAdminButtonEl = document.querySelector("#openAdminButton");
const closeAdminButtonEl = document.querySelector("#closeAdminButton");
const lockPanelEl = document.querySelector("#lockPanel");
const adminPanelEl = document.querySelector("#adminPanel");
const pinFormEl = document.querySelector("#pinForm");
const pinInputEl = document.querySelector("#pinInput");
const pinStatusEl = document.querySelector("#pinStatus");
const adminStatusEl = document.querySelector("#adminStatus");
const tentSelectEl = document.querySelector("#tentSelect");
const scopeSelectEl = document.querySelector("#scopeSelect");
const addRowButtonEl = document.querySelector("#addRowButton");
const duplicateTentButtonEl = document.querySelector("#duplicateTentButton");
const saveButtonEl = document.querySelector("#saveButton");
const exportButtonEl = document.querySelector("#exportButton");
const importButtonEl = document.querySelector("#importButton");
const importFileInputEl = document.querySelector("#importFileInput");
const resetDefaultsButtonEl = document.querySelector("#resetDefaultsButton");
const librarySearchInputEl = document.querySelector("#librarySearchInput");
const libraryResultsEl = document.querySelector("#libraryResults");
const addFromLibraryButtonEl = document.querySelector("#addFromLibraryButton");
const componentsTableBodyEl = document.querySelector("#componentsTableBody");
const validationBoxEl = document.querySelector("#validationBox");

let recipes = getTentTypes();
let filteredLibrary = [];

if (pinFormEl && lockPanelEl && adminPanelEl) {
  init();
}

function init() {
  openAdminButtonEl?.addEventListener("click", openAdminView);
  closeAdminButtonEl?.addEventListener("click", closeAdminView);

  if (sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "true") {
    unlockAdmin();
  }

  pinFormEl.addEventListener("submit", handlePinSubmit);
  tentSelectEl.addEventListener("change", () => {
    renderScopeOptions();
    renderEditor();
  });
  scopeSelectEl.addEventListener("change", renderEditor);

  addRowButtonEl.addEventListener("click", () => {
    getActiveComponents(true).push(createEmptyComponent());
    renderEditor();
  });

  duplicateTentButtonEl.addEventListener("click", duplicateCurrentTent);
  saveButtonEl.addEventListener("click", saveAllRecipes);
  exportButtonEl.addEventListener("click", exportRecipes);
  importButtonEl.addEventListener("click", () => importFileInputEl.click());
  importFileInputEl.addEventListener("change", importRecipesFromFile);
  resetDefaultsButtonEl.addEventListener("click", resetToDefaults);

  librarySearchInputEl.addEventListener("input", renderLibrary);
  addFromLibraryButtonEl.addEventListener("click", addSelectedLibraryComponent);

  componentsTableBodyEl.addEventListener("input", handleTableInput);
  componentsTableBodyEl.addEventListener("click", handleTableClick);
}

function openAdminView() {
  if (!adminHostEl) {
    return;
  }

  if (appViewEl) {
    appViewEl.hidden = true;
  }

  adminHostEl.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeAdminView() {
  if (!adminHostEl) {
    return;
  }

  adminHostEl.hidden = true;

  if (appViewEl) {
    appViewEl.hidden = false;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handlePinSubmit(event) {
  event.preventDefault();
  const value = pinInputEl.value.trim();

  if (value !== ADMIN_PIN) {
    pinStatusEl.textContent = "Falsche PIN.";
    return;
  }

  unlockAdmin();
}

function unlockAdmin() {
  sessionStorage.setItem(ADMIN_UNLOCK_KEY, "true");
  lockPanelEl.hidden = true;
  adminPanelEl.hidden = false;
  pinStatusEl.textContent = "";

  renderTentOptions();
  renderScopeOptions();
  renderLibrary();
  renderEditor();
}

function renderTentOptions() {
  const entries = Object.entries(recipes);
  tentSelectEl.innerHTML = "";

  for (const [tentId, tent] of entries) {
    const option = document.createElement("option");
    option.value = tentId;
    option.textContent = tent.label;
    tentSelectEl.append(option);
  }
}

function getCurrentTentId() {
  return tentSelectEl.value || Object.keys(recipes)[0];
}

function getCurrentTent() {
  return recipes[getCurrentTentId()];
}

function renderScopeOptions() {
  const tent = getCurrentTent();
  scopeSelectEl.innerHTML = "";

  if (!tent) {
    return;
  }

  if (!tent.variants || Object.keys(tent.variants).length === 0) {
    appendScopeOption("base", "Basis-Komponenten");
  }

  if (tent.variants) {
    for (const [variantId, variant] of Object.entries(tent.variants)) {
      appendScopeOption(`variant:${variantId}`, `Variante: ${variant.label}`);
    }
  }

  for (const optionKey of Object.keys(tent.poleOptions ?? {})) {
    const optionLabel = optionKey === "fixed" ? "Aufbau: Mittelstange" : `Aufbau: ${optionKey}`;
    appendScopeOption(`pole:${optionKey}`, optionLabel);
  }
}

function appendScopeOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  scopeSelectEl.append(option);
}

function getActiveComponents(createMissing = false) {
  const tentId = getCurrentTentId();
  const tent = recipes[tentId];
  const scope = scopeSelectEl.value;

  if (scope.startsWith("variant:")) {
    const variantId = scope.slice("variant:".length);

    if (!tent.variants && createMissing) {
      tent.variants = {};
    }

    if (!tent.variants?.[variantId] && createMissing) {
      tent.variants[variantId] = {
        label: variantId,
        components: []
      };
    }

    return tent.variants?.[variantId]?.components ?? [];
  }

  if (scope.startsWith("pole:")) {
    const poleKey = scope.slice("pole:".length);

    if (!tent.poleOptions && createMissing) {
      tent.poleOptions = {};
    }

    if (!Array.isArray(tent.poleOptions?.[poleKey]) && createMissing) {
      tent.poleOptions[poleKey] = [];
    }

    return tent.poleOptions?.[poleKey] ?? [];
  }

  if (!Array.isArray(tent.components) && createMissing) {
    tent.components = [];
  }

  return tent.components ?? [];
}

function createEmptyComponent() {
  return {
    id: "",
    label: "",
    marking: "Kennzeichnung spaeter eintragen",
    qty: 1
  };
}

function renderEditor() {
  const components = getActiveComponents(true);
  componentsTableBodyEl.innerHTML = "";

  components.forEach((component, index) => {
    const row = document.createElement("tr");
    row.dataset.index = String(index);

    row.innerHTML = `
      <td><input data-field="id" value="${escapeHtml(component.id ?? "")}"></td>
      <td><input data-field="label" value="${escapeHtml(component.label ?? "")}"></td>
      <td><input data-field="marking" value="${escapeHtml(component.marking ?? "")}"></td>
      <td>
        <input data-field="qty" type="number" min="1" step="1" value="${Number(component.qty) || 1}">
        <div class="admin-qty-quick">
          ${[1, 2, 3, 4, 8, 12, 16].map((qty) => `<button type="button" data-action="set-qty" data-qty="${qty}">${qty}</button>`).join("")}
        </div>
      </td>
      <td>
        <div class="admin-row-actions">
          <button type="button" data-action="up">↑</button>
          <button type="button" data-action="down">↓</button>
          <button type="button" data-action="delete">Loeschen</button>
        </div>
      </td>
    `;

    componentsTableBodyEl.append(row);
  });

  renderValidation();
}

function handleTableInput(event) {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const row = target.closest("tr");

  if (!row) {
    return;
  }

  const index = Number(row.dataset.index);
  const field = target.dataset.field;
  const components = getActiveComponents(true);

  if (!components[index] || !field) {
    return;
  }

  if (field === "qty") {
    const parsed = Number(target.value);
    components[index].qty = Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 1;
  } else {
    components[index][field] = target.value;
  }

  renderValidation();
}

function handleTableClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const row = target.closest("tr");

  if (!row) {
    return;
  }

  const index = Number(row.dataset.index);
  const action = target.dataset.action;
  const components = getActiveComponents(true);

  if (!components[index]) {
    return;
  }

  if (action === "delete") {
    components.splice(index, 1);
    renderEditor();
    return;
  }

  if (action === "up" && index > 0) {
    [components[index - 1], components[index]] = [components[index], components[index - 1]];
    renderEditor();
    return;
  }

  if (action === "down" && index < components.length - 1) {
    [components[index + 1], components[index]] = [components[index], components[index + 1]];
    renderEditor();
    return;
  }

  if (action === "set-qty") {
    const qty = Number(target.dataset.qty);
    components[index].qty = qty;
    renderEditor();
  }
}

function getAllComponents() {
  const list = [];

  for (const [tentId, tent] of Object.entries(recipes)) {
    (tent.components ?? []).forEach((component) => list.push({ tentId, scope: "base", component }));

    for (const [variantId, variant] of Object.entries(tent.variants ?? {})) {
      (variant.components ?? []).forEach((component) => {
        list.push({ tentId, scope: `variant:${variantId}`, component });
      });
    }

    for (const [poleId, components] of Object.entries(tent.poleOptions ?? {})) {
      (components ?? []).forEach((component) => {
        list.push({ tentId, scope: `pole:${poleId}`, component });
      });
    }
  }

  return list;
}

function renderValidation() {
  const issues = [];
  const idMap = new Map();

  for (const entry of getAllComponents()) {
    const component = entry.component;
    const id = String(component.id ?? "").trim();

    if (!id) {
      issues.push("Leere Komponenten-ID gefunden.");
      continue;
    }

    if (!Number.isFinite(Number(component.qty)) || Number(component.qty) < 1) {
      issues.push(`Ungueltige Menge bei ID ${id}.`);
    }

    if (!idMap.has(id)) {
      idMap.set(id, {
        label: component.label,
        marking: component.marking
      });
      continue;
    }

    const existing = idMap.get(id);
    if (existing.label !== component.label || existing.marking !== component.marking) {
      issues.push(`ID-Konflikt bei ${id}: gleiche ID mit unterschiedlichem Namen oder Kennzeichnung.`);
    }
  }

  if (issues.length === 0) {
    validationBoxEl.className = "admin-validation";
    validationBoxEl.textContent = "Keine Validierungsprobleme gefunden.";
    return;
  }

  validationBoxEl.className = "admin-validation admin-validation--error";
  validationBoxEl.innerHTML = `<ul>${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`;
}

function duplicateCurrentTent() {
  const tentId = getCurrentTentId();
  const tent = recipes[tentId];

  if (!tent) {
    return;
  }

  let copyIndex = 2;
  let newTentId = `${tentId}_copy`;

  while (recipes[newTentId]) {
    newTentId = `${tentId}_copy_${copyIndex}`;
    copyIndex += 1;
  }

  recipes[newTentId] = JSON.parse(JSON.stringify(tent));
  recipes[newTentId].label = `${tent.label} Kopie`;

  renderTentOptions();
  tentSelectEl.value = newTentId;
  renderScopeOptions();
  renderLibrary();
  renderEditor();
  showStatus("Zelt wurde dupliziert.");
}

function renderLibrary() {
  const term = librarySearchInputEl.value.trim().toLowerCase();
  const library = getComponentLibrary(recipes);

  filteredLibrary = library.filter((item) => {
    if (!term) {
      return true;
    }

    return item.id.toLowerCase().includes(term) || item.label.toLowerCase().includes(term);
  });

  libraryResultsEl.innerHTML = "";

  for (const item of filteredLibrary) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.label} (${item.id})`;
    libraryResultsEl.append(option);
  }
}

function addSelectedLibraryComponent() {
  const selectedId = libraryResultsEl.value;

  if (!selectedId) {
    showStatus("Bitte zuerst eine Bibliotheks-Komponente auswaehlen.");
    return;
  }

  const selected = filteredLibrary.find((item) => item.id === selectedId);

  if (!selected) {
    return;
  }

  getActiveComponents(true).push({
    id: selected.id,
    label: selected.label,
    marking: selected.marking,
    qty: 1
  });

  renderEditor();
}

function saveAllRecipes() {
  try {
    recipes = saveTentTypes(recipes);
    showStatus("Rezepte wurden gespeichert.");
    renderLibrary();
    renderValidation();
  } catch (error) {
    showStatus(`Speichern fehlgeschlagen: ${error.message}`);
  }
}

function exportRecipes() {
  const content = exportTentTypes();
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zelt-rezepte.json";
  link.click();
  URL.revokeObjectURL(url);
  showStatus("Export wurde heruntergeladen.");
}

async function importRecipesFromFile(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    recipes = importTentTypesFromJson(text);
    renderTentOptions();
    renderScopeOptions();
    renderLibrary();
    renderEditor();
    showStatus("Import erfolgreich.");
  } catch (error) {
    showStatus(`Import fehlgeschlagen: ${error.message}`);
  } finally {
    importFileInputEl.value = "";
  }
}

function resetToDefaults() {
  const confirmed = window.confirm("Alle Admin-Aenderungen verwerfen und Defaults laden?");

  if (!confirmed) {
    return;
  }

  recipes = resetTentTypes();
  renderTentOptions();
  renderScopeOptions();
  renderLibrary();
  renderEditor();
  showStatus("Defaults wurden geladen.");
}

function showStatus(message) {
  adminStatusEl.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
})();
