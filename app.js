(() => {
/*
  Materialrechner Pfadfinder Schiefbahn
  Vanilla JavaScript, keine externen Abhängigkeiten.
*/
const { getTentTypes } = window.recipeStore;
const tentTypes = getTentTypes();

const STORAGE_KEY = "pfadfinder-schiefbahn-materialrechner-state";
const PREFERENCES_STORAGE_KEY = "pfadfinder-schiefbahn-materialrechner-preferences";

const state = createInitialState();
const preferences = createInitialPreferences();
const bomColumnState = {
  showMarking: false,
  showSources: false
};

const tentCardsEl = document.querySelector("#tentCards");
const bomOutputEl = document.querySelector("#bomOutput");
const resetButtonEl = document.querySelector("#resetButton");
const undoResetButtonEl = document.querySelector("#undoResetButton");
const copyButtonEl = document.querySelector("#copyButton");
const openTextViewButtonEl = document.querySelector("#openTextViewButton");
const copyStatusEl = document.querySelector("#copyStatus");
const themeModeButtonEls = Array.from(document.querySelectorAll('[data-action="theme"]'));
const contrastButtonEls = Array.from(document.querySelectorAll('[data-action="contrast"]'));
const themeColorMetaEl = document.querySelector('meta[name="theme-color"]');
const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
let lastStateBeforeReset = null;

init();

function init() {
  restorePreferences();
  applyPreferences();

  restoreState();
  renderTentCards();
  renderBom();

  resetButtonEl.addEventListener("click", resetApp);
  undoResetButtonEl.addEventListener("click", undoReset);
  copyButtonEl.addEventListener("click", handlePrimaryExportAction);
  openTextViewButtonEl.addEventListener("click", openBomTextView);
  themeModeButtonEls.forEach((button) => {
    button.addEventListener("click", cycleThemeMode);
  });
  contrastButtonEls.forEach((button) => {
    button.addEventListener("click", toggleContrastMode);
  });
  updateExportButtons();

  window.addEventListener("resize", () => {
    updateExportButtons();
  });

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  prefersDarkQuery.addEventListener("change", () => {
    if (preferences.themeMode === "system") {
      applyPreferences();
    }
  });
}

function createInitialState() {
  return Object.fromEntries(
    Object.keys(tentTypes).map((tentId) => [
      tentId,
      {
        count: 0,
        poleOption: "fixed",
        variant: getDefaultVariantId(tentId)
      }
    ])
  );
}

function createInitialPreferences() {
  return {
    themeMode: "system",
    contrastMode: "normal"
  };
}

function getDefaultVariantId(tentId) {
  const tent = tentTypes[tentId];
  const variantIds = tent?.variants ? Object.keys(tent.variants) : [];
  return variantIds.length > 0 ? variantIds[0] : null;
}

function getSelectedVariantId(tentId, tentState) {
  const tent = tentTypes[tentId];

  if (!tent?.variants) {
    return null;
  }

  return tent.variants[tentState.variant] ? tentState.variant : getDefaultVariantId(tentId);
}

function getPoleOptionHelpText(poleOption) {
  if (poleOption === "tripod") {
    return "Dreibein: Drei Stangen tragen die Mitte und sind oft stabiler bei Wind.";
  }

  return "Mittelstange: Klassischer Aufbau mit einer zentralen Stange in der Mitte.";
}

function getVariantHelpText(tentId, variantId) {
  if (tentId !== "grossraumjurte") {
    return "";
  }

  if (variantId === "teller") {
    return "Teller: Aufbau mit Teller-Set und Ketten.";
  }

  return "Spinne: Aufbau mit Metallspinne und passenden Verbindern.";
}

function restoreState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!savedState || typeof savedState !== "object") {
      return;
    }

    for (const tentId of Object.keys(tentTypes)) {
      const savedTentState = savedState[tentId];

      if (!savedTentState) {
        continue;
      }

      state[tentId].count = Number.isInteger(savedTentState.count)
        ? Math.max(0, savedTentState.count)
        : 0;

      state[tentId].poleOption = tentTypes[tentId].poleOptions[savedTentState.poleOption]
        ? savedTentState.poleOption
        : "fixed";

      const selectedVariantId = getSelectedVariantId(tentId, savedTentState);
      state[tentId].variant = selectedVariantId;
    }
  } catch (error) {
    console.warn("Gespeicherter Zustand konnte nicht geladen werden.", error);
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Zustand konnte nicht gespeichert werden.", error);
  }
}

function restorePreferences() {
  try {
    const savedPreferences = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY));

    if (!savedPreferences || typeof savedPreferences !== "object") {
      return;
    }

    const allowedThemeModes = ["system", "light", "dark"];
    const allowedContrastModes = ["normal", "high"];

    preferences.themeMode = allowedThemeModes.includes(savedPreferences.themeMode)
      ? savedPreferences.themeMode
      : "system";
    preferences.contrastMode = allowedContrastModes.includes(savedPreferences.contrastMode)
      ? savedPreferences.contrastMode
      : "normal";
  } catch (error) {
    console.warn("Einstellungen konnten nicht geladen werden.", error);
  }
}

function persistPreferences() {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn("Einstellungen konnten nicht gespeichert werden.", error);
  }
}

function getResolvedTheme() {
  if (preferences.themeMode === "system") {
    return prefersDarkQuery.matches ? "dark" : "light";
  }

  return preferences.themeMode;
}

function updatePreferenceButtons() {
  const modeLabels = {
    system: "System",
    light: "Hell",
    dark: "Dunkel"
  };

  const modeIcons = {
    system: "⚙",
    light: "☀",
    dark: "☾"
  };

  themeModeButtonEls.forEach((button) => {
    button.textContent = `Design: ${modeLabels[preferences.themeMode]}`;
    button.setAttribute("aria-pressed", String(preferences.themeMode !== "system"));
    button.setAttribute("data-icon", modeIcons[preferences.themeMode]);
    button.setAttribute("aria-label", `Designmodus wechseln (aktuell: ${modeLabels[preferences.themeMode]})`);
    button.title = `Design: ${modeLabels[preferences.themeMode]}`;
  });

  const isHighContrast = preferences.contrastMode === "high";
  contrastButtonEls.forEach((button) => {
    button.textContent = isHighContrast ? "Kontrast: Hoch" : "Kontrast: Normal";
    button.setAttribute("aria-pressed", String(isHighContrast));
    button.setAttribute("data-icon", isHighContrast ? "◑" : "◐");
    button.setAttribute("aria-label", isHighContrast ? "Kontrast umschalten (aktuell: hoch)" : "Kontrast umschalten (aktuell: normal)");
    button.title = isHighContrast ? "Kontrast: Hoch" : "Kontrast: Normal";
  });
}

function applyPreferences() {
  const resolvedTheme = getResolvedTheme();
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.setAttribute("data-contrast", preferences.contrastMode);

  if (themeColorMetaEl) {
    themeColorMetaEl.content = resolvedTheme === "dark" ? "#0f1714" : "#1f4d40";
  }

  updatePreferenceButtons();
}

function cycleThemeMode() {
  const modes = ["system", "light", "dark"];
  const currentIndex = modes.indexOf(preferences.themeMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  preferences.themeMode = modes[nextIndex];
  persistPreferences();
  applyPreferences();
}

function toggleContrastMode() {
  preferences.contrastMode = preferences.contrastMode === "high" ? "normal" : "high";
  persistPreferences();
  applyPreferences();
}

function renderTentCards() {
  tentCardsEl.innerHTML = "";

  for (const [index, [tentId, tent]] of Object.entries(tentTypes).entries()) {
    const card = document.createElement("article");
    card.className = "tent-card";
    card.style.setProperty("--card-index", String(index));

    const title = document.createElement("h3");
    title.textContent = tent.label;

    const description = document.createElement("p");
    description.className = "tent-card__description";
    description.textContent = tent.description;

    const counter = document.createElement("div");
    counter.className = "counter";

    const minusButton = document.createElement("button");
    minusButton.className = "counter__button";
    minusButton.type = "button";
    minusButton.textContent = "−";
    minusButton.setAttribute("aria-label", `${tent.label} reduzieren`);
    minusButton.disabled = state[tentId].count === 0;
    minusButton.addEventListener("click", () => updateCount(tentId, -1));
    minusButton.addEventListener("keydown", (event) => handleCounterKeydown(event, tentId));

    const countValue = document.createElement("div");
    countValue.className = "counter__value";
    countValue.textContent = state[tentId].count;
    countValue.setAttribute("aria-label", `${tent.label}: ${state[tentId].count}`);

    const plusButton = document.createElement("button");
    plusButton.className = "counter__button";
    plusButton.type = "button";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", `${tent.label} erhöhen`);
    plusButton.addEventListener("click", () => updateCount(tentId, 1));
    plusButton.addEventListener("keydown", (event) => handleCounterKeydown(event, tentId));

    counter.append(minusButton, countValue, plusButton);

    const optionField = document.createElement("div");
    optionField.className = "option-field";

    const selectId = `pole-option-${tentId}`;

    const label = document.createElement("label");
    label.setAttribute("for", selectId);
    label.textContent = "Aufbauoption";

    const select = document.createElement("select");
    select.id = selectId;
    const poleHelpId = `${selectId}-help`;
    select.setAttribute("aria-describedby", poleHelpId);
    select.addEventListener("change", (event) => {
      state[tentId].poleOption = event.target.value;
      persistState();
      renderTentCards();
      renderBom();
    });

    const fixedOption = document.createElement("option");
    fixedOption.value = "fixed";
    fixedOption.textContent = "Mittelstange";

    const tripodOption = document.createElement("option");
    tripodOption.value = "tripod";
    tripodOption.textContent = "Dreibein-Kombination";

    select.append(fixedOption, tripodOption);

    const selectedPoleOption = tent.poleOptions[state[tentId].poleOption]
      ? state[tentId].poleOption
      : "fixed";
    select.value = selectedPoleOption;

    const poleHelp = document.createElement("p");
    poleHelp.className = "option-help";
    poleHelp.id = poleHelpId;
    poleHelp.textContent = getPoleOptionHelpText(selectedPoleOption);

    optionField.append(label, select, poleHelp);

    let variantField = null;
    const variantIds = tent.variants ? Object.keys(tent.variants) : [];

    if (variantIds.length > 1) {
      variantField = document.createElement("div");
      variantField.className = "option-field";

      const variantSelectId = `variant-${tentId}`;
      const variantLabel = document.createElement("label");
      variantLabel.setAttribute("for", variantSelectId);
      variantLabel.textContent = "Variante";

      const variantSelect = document.createElement("select");
      variantSelect.id = variantSelectId;
      const variantHelpId = `${variantSelectId}-help`;
      variantSelect.setAttribute("aria-describedby", variantHelpId);
      variantSelect.addEventListener("change", (event) => {
        state[tentId].variant = event.target.value;
        persistState();
        renderTentCards();
        renderBom();
      });

      for (const variantId of variantIds) {
        const variantOption = document.createElement("option");
        variantOption.value = variantId;
        variantOption.textContent = tent.variants[variantId].label;
        variantSelect.append(variantOption);
      }

      const selectedVariantId = getSelectedVariantId(tentId, state[tentId]);
      variantSelect.value = selectedVariantId;

      const variantHelp = document.createElement("p");
      variantHelp.className = "option-help";
      variantHelp.id = variantHelpId;
      variantHelp.textContent = getVariantHelpText(
        tentId,
        selectedVariantId
      );

      variantField.append(variantLabel, variantSelect, variantHelp);
    }

    card.append(title, description, counter, optionField);

    if (variantField) {
      card.append(variantField);
    }

    tentCardsEl.append(card);
  }
}

function updateCount(tentId, delta) {
  state[tentId].count = Math.max(0, state[tentId].count + delta);
  persistState();
  renderTentCards();
  renderBom();
}

function handleCounterKeydown(event, tentId) {
  const increaseKeys = ["ArrowUp", "ArrowRight", "+", "Add"];
  const decreaseKeys = ["ArrowDown", "ArrowLeft", "-", "Subtract"];

  if (increaseKeys.includes(event.key)) {
    event.preventDefault();
    updateCount(tentId, 1);
    return;
  }

  if (decreaseKeys.includes(event.key)) {
    event.preventDefault();
    updateCount(tentId, -1);
  }
}

function resetApp() {
  lastStateBeforeReset = JSON.parse(JSON.stringify(state));

  for (const tentId of Object.keys(state)) {
    state[tentId].count = 0;
    state[tentId].poleOption = "fixed";
    state[tentId].variant = getDefaultVariantId(tentId);
  }

  persistState();
  renderTentCards();
  renderBom();
  undoResetButtonEl.hidden = false;
  showCopyStatus("");
}

function undoReset() {
  if (!lastStateBeforeReset) {
    showCopyStatus("Kein Zurücksetzen zum Rückgängig machen vorhanden.");
    return;
  }

  for (const tentId of Object.keys(state)) {
    state[tentId].count = Math.max(0, lastStateBeforeReset[tentId]?.count ?? 0);
    state[tentId].poleOption = lastStateBeforeReset[tentId]?.poleOption ?? "fixed";
    state[tentId].variant = getSelectedVariantId(tentId, {
      variant: lastStateBeforeReset[tentId]?.variant
    });
  }

  persistState();
  renderTentCards();
  renderBom();
  undoResetButtonEl.hidden = true;
  lastStateBeforeReset = null;
  showCopyStatus("Zurücksetzen wurde rückgängig gemacht.");
}

function calculateBom() {
  const bom = new Map();

  for (const [tentId, tentState] of Object.entries(state)) {
    const count = tentState.count;

    if (count <= 0) {
      continue;
    }

    const tent = tentTypes[tentId];
    const selectedVariantId = getSelectedVariantId(tentId, tentState);
    const variantCount = tent.variants ? Object.keys(tent.variants).length : 0;
    const selectedVariantLabel = selectedVariantId && variantCount > 1
      ? tent.variants[selectedVariantId].label
      : "";
    const variantComponents = selectedVariantId
      ? tent.variants[selectedVariantId].components
      : tent.components ?? [];
    const selectedPoleComponents = tent.poleOptions[tentState.poleOption] ?? [];
    const allComponents = [...variantComponents, ...selectedPoleComponents];

    for (const component of allComponents) {
      const totalQty = component.qty * count;
      const existingItem = bom.get(component.id);

      if (existingItem) {
        existingItem.qty += totalQty;
        existingItem.sources.push({
          tentLabel: tent.label,
          variantLabel: selectedVariantLabel,
          tentCount: count,
          componentQty: component.qty,
          selectedPoleOption: tentState.poleOption
        });
      } else {
        bom.set(component.id, {
          id: component.id,
          label: component.label,
          marking: component.marking,
          qty: totalQty,
          sources: [
            {
              tentLabel: tent.label,
              variantLabel: selectedVariantLabel,
              tentCount: count,
              componentQty: component.qty,
              selectedPoleOption: tentState.poleOption
            }
          ]
        });
      }
    }
  }

  return [...bom.values()].sort((a, b) => a.label.localeCompare(b.label, "de"));
}

function renderBom() {
  const bomItems = calculateBom();
  const isNarrowViewport = window.matchMedia("(max-width: 520px)").matches;
  const isVeryNarrowViewport = window.matchMedia("(max-width: 400px)").matches;
  const isIPhone14Or15Viewport = window.matchMedia("(min-width: 390px) and (max-width: 430px)").matches;
  const areBothOptionalColumnsHidden = !bomColumnState.showMarking && !bomColumnState.showSources;
  const areAllOptionalColumnsOpen = bomColumnState.showMarking && bomColumnState.showSources;
  const areSomeOptionalColumnsOpen = !areBothOptionalColumnsHidden && !areAllOptionalColumnsOpen;
  const shouldCompactSources = isNarrowViewport && bomColumnState.showSources;

  if (bomItems.length === 0) {
    bomOutputEl.innerHTML = '<div class="empty-state">Bitte wähle zuerst mindestens ein Zelt aus.</div>';
    copyButtonEl.disabled = true;
    openTextViewButtonEl.disabled = true;
    updateExportButtons();
    return;
  }

  copyButtonEl.disabled = false;
  openTextViewButtonEl.disabled = false;
  updateExportButtons();

  const controls = document.createElement("div");
  controls.className = "bom-column-toggles";

  const markingToggle = document.createElement("button");
  markingToggle.className = "column-toggle-button";
  markingToggle.type = "button";
  markingToggle.setAttribute("aria-pressed", String(bomColumnState.showMarking));
  markingToggle.textContent = bomColumnState.showMarking
    ? "Kennzeichnung ausblenden"
    : "Kennzeichnung anzeigen";
  markingToggle.addEventListener("click", () => {
    bomColumnState.showMarking = !bomColumnState.showMarking;
    renderBom();
  });

  const sourcesToggle = document.createElement("button");
  sourcesToggle.className = "column-toggle-button";
  sourcesToggle.type = "button";
  sourcesToggle.setAttribute("aria-pressed", String(bomColumnState.showSources));
  sourcesToggle.textContent = bomColumnState.showSources
    ? "Herkunft ausblenden"
    : "Herkunft anzeigen";
  sourcesToggle.addEventListener("click", () => {
    bomColumnState.showSources = !bomColumnState.showSources;
    renderBom();
  });

  controls.append(markingToggle, sourcesToggle);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "bom-table-wrapper";

  if (isNarrowViewport && !areBothOptionalColumnsHidden) {
    tableWrapper.classList.add("bom-table-wrapper--mobile-scroll");
  }

  const table = document.createElement("table");
  table.className = "bom-table";

  if (!bomColumnState.showMarking) {
    table.classList.add("bom-table--hide-marking");
  }

  if (!bomColumnState.showSources) {
    table.classList.add("bom-table--hide-sources");
  }

  if (areBothOptionalColumnsHidden) {
    table.classList.add("bom-table--default-columns");
  }

  if (areSomeOptionalColumnsOpen) {
    table.classList.add("bom-table--partial-columns");
  }

  if (areAllOptionalColumnsOpen) {
    table.classList.add("bom-table--all-columns-visible");
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Materialname</th>
        <th>Anzahl</th>
        <th>Kennzeichnung</th>
        <th>Herkunft</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  for (const item of bomItems) {
    const row = document.createElement("tr");

    const sourceList = document.createElement("ul");
    sourceList.className = "source-list";

    const maxVisibleSources = isVeryNarrowViewport
      ? 1
      : isIPhone14Or15Viewport && areAllOptionalColumnsOpen
        ? 1
      : isNarrowViewport
        ? 2
        : Number.POSITIVE_INFINITY;
    const visibleSources = item.sources.slice(0, maxVisibleSources);

    for (const source of visibleSources) {
      const sourceItem = document.createElement("li");
      const sourceLabel = source.variantLabel
        ? `${source.tentLabel} (${source.variantLabel})`
        : source.tentLabel;

      sourceItem.textContent = shouldCompactSources
        ? `${source.tentCount}x ${sourceLabel}`
        : `${source.tentCount} × ${sourceLabel} à ${source.componentQty}`;
      sourceList.append(sourceItem);
    }

    const hiddenSourcesCount = item.sources.length - visibleSources.length;

    if (hiddenSourcesCount > 0) {
      const moreItem = document.createElement("li");
      moreItem.className = "source-list__more";
      moreItem.textContent = `+${hiddenSourcesCount} weitere Herkunft${hiddenSourcesCount === 1 ? "" : "en"}`;
      sourceList.append(moreItem);
    }

    row.append(
      createTableCell(item.label),
      createTableCell(String(item.qty)),
      createTableCell(item.marking),
      createTableCell(sourceList)
    );

    tbody.append(row);
  }

  tableWrapper.append(table);
  bomOutputEl.replaceChildren(controls, tableWrapper);

  const shouldShowScrollHint = isNarrowViewport && !areBothOptionalColumnsHidden;

  if (shouldShowScrollHint) {
    const scrollHint = document.createElement("p");
    scrollHint.className = "bom-scroll-hint";
    scrollHint.textContent = "Tipp: Seitlich wischen, um weitere Spalten sichtbar zu machen.";
    bomOutputEl.replaceChildren(controls, scrollHint, tableWrapper);
  }
}

function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  if (maxScroll <= 0) {
    document.documentElement.style.setProperty("--scroll-progress", "0");
    return;
  }

  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
}

function createTableCell(content) {
  const cell = document.createElement("td");

  if (content instanceof Node) {
    cell.append(content);
  } else {
    cell.textContent = content;
  }

  return cell;
}

function createBomText() {
  const bomItems = calculateBom();

  if (bomItems.length === 0) {
    return "Bitte wähle zuerst mindestens ein Zelt aus.";
  }

  const lines = [
    "Stückliste",
    "==========",
    ""
  ];

  for (const item of bomItems) {
    const sources = item.sources
      .map((source) => {
        const sourceLabel = source.variantLabel
          ? `${source.tentLabel} (${source.variantLabel})`
          : source.tentLabel;

        return `${source.tentCount} × ${sourceLabel} à ${source.componentQty}`;
      })
      .join("; ");

    lines.push(`${item.qty} × ${item.label}`);
    lines.push(`Kennzeichnung: ${item.marking}`);
    lines.push(`Herkunft: ${sources}`);
    lines.push("");
  }

  return lines.join("\n");
}

async function copyBomToClipboard() {
  const text = createBomText();

  return copyBomTextToClipboard(text, {
    successMessage: "Stückliste wurde kopiert.",
    fallbackMessage: "Stückliste wurde kopiert (Fallback)."
  });
}

function hasBomItems() {
  return calculateBom().length > 0;
}

function isLikelyMobileDevice() {
  const matchesMobileAgent = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent);
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return matchesMobileAgent || hasCoarsePointer;
}

function canUseWebShareForText() {
  return window.isSecureContext && typeof navigator.share === "function";
}

function shouldPreferNativeShare() {
  return isLikelyMobileDevice() && canUseWebShareForText();
}

function updateExportButtons() {
  copyButtonEl.textContent = shouldPreferNativeShare()
    ? "Stückliste teilen"
    : "Stückliste kopieren";

  openTextViewButtonEl.hidden = isLikelyMobileDevice();
}

async function handlePrimaryExportAction() {
  if (!hasBomItems()) {
    showCopyStatus("Keine Stückliste vorhanden.");
    return;
  }

  const text = createBomText();

  if (shouldPreferNativeShare()) {
    try {
      await navigator.share({
        title: "Stückliste",
        text
      });
      showCopyStatus("Stückliste wurde geteilt.");
      return;
    } catch (error) {
      const copied = await copyBomTextToClipboard(text, {
        successMessage: "Teilen abgebrochen. Stückliste wurde kopiert.",
        fallbackMessage: "Teilen nicht möglich. Stückliste wurde kopiert (Fallback).",
        manualMessage: "Teilen nicht möglich. Bitte manuell markieren und kopieren."
      });

      if (copied) {
        return;
      }

      console.warn("Teilen und Kopieren sind fehlgeschlagen.", error);
      return;
    }
  }

  await copyBomTextToClipboard(text, {
    successMessage: "Stückliste wurde kopiert.",
    fallbackMessage: "Stückliste wurde kopiert (Fallback)."
  });
}

async function copyBomTextToClipboard(text, options = {}) {
  const successMessage = options.successMessage ?? "Stückliste wurde kopiert.";
  const fallbackMessage = options.fallbackMessage ?? "Stückliste wurde kopiert (Fallback).";
  const manualMessage = options.manualMessage ?? "Kopieren nicht möglich. Bitte manuell markieren und kopieren.";

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API nicht verfügbar");
    }

    await navigator.clipboard.writeText(text);
    showCopyStatus(successMessage);
    return true;
  } catch (error) {
    console.warn("Zwischenablage nicht verfügbar, Fallback wird genutzt.", error);
    const copiedWithFallback = copyTextFallback(text);

    if (copiedWithFallback) {
      showCopyStatus(fallbackMessage);
      return true;
    }

    showCopyStatus(manualMessage);
    return false;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function openBomTextView() {
  if (!hasBomItems()) {
    showCopyStatus("Keine Stückliste vorhanden.");
    return;
  }

  const text = createBomText();
  const openedWindow = window.open("", "_blank");

  if (!openedWindow) {
    showCopyStatus("Textansicht wurde vom Browser blockiert. Bitte Pop-ups erlauben.");
    return;
  }

  const escapedText = escapeHtml(text);

  openedWindow.document.write(`<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Stückliste</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      color: #2e2418;
      background: #f7f1e6;
      font-family: "Segoe UI", Tahoma, sans-serif;
    }

    h1 {
      margin: 0 0 16px;
      font-size: 1.4rem;
    }

    pre {
      margin: 0;
      padding: 16px;
      border: 1px solid #ded0b4;
      border-radius: 12px;
      background: #fffdf7;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: "Cascadia Mono", Consolas, monospace;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <h1>Stückliste (Textansicht)</h1>
  <pre>${escapedText}</pre>
</body>
</html>`);
  openedWindow.document.close();
  showCopyStatus("Textansicht wurde in einem neuen Tab geöffnet.");
}

function copyTextFallback(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand("copy");
    textarea.remove();
    return successful;
  } catch (error) {
    console.warn("Fallback-Kopieren ist fehlgeschlagen.", error);
    return false;
  }
}

function showCopyStatus(message) {
  copyStatusEl.textContent = message;

  if (!message) {
    return;
  }

  window.clearTimeout(showCopyStatus.timeoutId);
  showCopyStatus.timeoutId = window.setTimeout(() => {
    copyStatusEl.textContent = "";
  }, 2500);
}
})();
