(() => {
const defaultTentTypes = window.tentTypes;

const RECIPE_STORAGE_KEY = "pfadfinder-schiefbahn-materialrechner-recipes";
const RECIPE_SCHEMA_VERSION = 1;
const DEFAULT_MARKING = "Kennzeichnung später eintragen";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeComponent(component, fallbackIdPrefix, index) {
  const idRaw = typeof component?.id === "string" ? component.id.trim() : "";
  const id = idRaw || `${fallbackIdPrefix}_${index + 1}`;
  const labelRaw = typeof component?.label === "string" ? component.label.trim() : "";
  const label = labelRaw || id;
  const markingRaw = typeof component?.marking === "string" ? component.marking.trim() : "";
  const marking = markingRaw || DEFAULT_MARKING;
  const qtyNum = Number(component?.qty);
  const qty = Number.isFinite(qtyNum) ? Math.max(1, Math.round(qtyNum)) : 1;

  return {
    id,
    label,
    marking,
    qty
  };
}

function sanitizeComponentList(components, fallbackIdPrefix) {
  if (!Array.isArray(components)) {
    return [];
  }

  return components.map((component, index) =>
    sanitizeComponent(component, fallbackIdPrefix, index)
  );
}

function sanitizeVariants(variants, tentId) {
  if (!isObject(variants)) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(variants).map(([variantId, variant]) => {
    const label = typeof variant?.label === "string" && variant.label.trim()
      ? variant.label.trim()
      : variantId;

    return [
      variantId,
      {
        label,
        components: sanitizeComponentList(variant?.components, `${tentId}_${variantId}`)
      }
    ];
  });

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(sanitizedEntries);
}

function sanitizePoleOptions(poleOptions, tentId) {
  const source = isObject(poleOptions) ? poleOptions : {};

  return {
    fixed: sanitizeComponentList(source.fixed, `${tentId}_fixed`),
    tripod: sanitizeComponentList(source.tripod, `${tentId}_tripod`)
  };
}

function sanitizeTentTypes(tentTypes) {
  if (!isObject(tentTypes)) {
    throw new Error("Ungueltige Rezeptdaten: tentTypes fehlt oder ist kein Objekt.");
  }

  const entries = Object.entries(tentTypes).map(([tentId, tent]) => {
    const label = typeof tent?.label === "string" && tent.label.trim()
      ? tent.label.trim()
      : tentId;

    const description = typeof tent?.description === "string" ? tent.description : "";

    const variants = sanitizeVariants(tent?.variants, tentId);
    const components = sanitizeComponentList(tent?.components, `${tentId}_base`);

    const sanitizedTent = {
      label,
      description,
      poleOptions: sanitizePoleOptions(tent?.poleOptions, tentId)
    };

    if (variants) {
      sanitizedTent.variants = variants;
    }

    if (components.length > 0 || !variants) {
      sanitizedTent.components = components;
    }

    return [tentId, sanitizedTent];
  });

  if (entries.length === 0) {
    throw new Error("Ungueltige Rezeptdaten: Keine Zeltarten gefunden.");
  }

  return Object.fromEntries(entries);
}

function readStoredPayload() {
  const raw = localStorage.getItem(RECIPE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw);

  if (!isObject(parsed)) {
    return null;
  }

  if (parsed.schemaVersion !== RECIPE_SCHEMA_VERSION || !isObject(parsed.tentTypes)) {
    return null;
  }

  return parsed;
}

function writeStoredPayload(tentTypes) {
  const payload = {
    schemaVersion: RECIPE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    tentTypes
  };

  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(payload));
}

function getTentTypes() {
  try {
    const stored = readStoredPayload();

    if (stored?.tentTypes) {
      return sanitizeTentTypes(stored.tentTypes);
    }
  } catch (error) {
    console.warn("Gespeicherte Rezepte konnten nicht geladen werden. Defaults werden genutzt.", error);
  }

  return sanitizeTentTypes(deepClone(defaultTentTypes));
}

function saveTentTypes(tentTypes) {
  const sanitized = sanitizeTentTypes(tentTypes);
  writeStoredPayload(sanitized);
  return sanitized;
}

function resetTentTypes() {
  localStorage.removeItem(RECIPE_STORAGE_KEY);
  return getTentTypes();
}

function exportTentTypes() {
  const tentTypes = getTentTypes();

  return JSON.stringify(
    {
      schemaVersion: RECIPE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      tentTypes
    },
    null,
    2
  );
}

function importTentTypesFromJson(jsonText) {
  const parsed = JSON.parse(jsonText);

  if (!isObject(parsed) || !isObject(parsed.tentTypes)) {
    throw new Error("Importdatei ist ungueltig. Erwartet wird ein Objekt mit tentTypes.");
  }

  return saveTentTypes(parsed.tentTypes);
}

function getComponentLibrary(tentTypes = getTentTypes()) {
  const map = new Map();

  function addComponent(component) {
    if (!component?.id) {
      return;
    }

    if (!map.has(component.id)) {
      map.set(component.id, {
        id: component.id,
        label: component.label,
        marking: component.marking
      });
    }
  }

  for (const tent of Object.values(tentTypes)) {
    const baseComponents = Array.isArray(tent.components) ? tent.components : [];
    baseComponents.forEach(addComponent);

    if (isObject(tent.variants)) {
      for (const variant of Object.values(tent.variants)) {
        (Array.isArray(variant?.components) ? variant.components : []).forEach(addComponent);
      }
    }

    if (isObject(tent.poleOptions)) {
      for (const optionComponents of Object.values(tent.poleOptions)) {
        (Array.isArray(optionComponents) ? optionComponents : []).forEach(addComponent);
      }
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "de"));
}

window.recipeStore = {
  getTentTypes,
  saveTentTypes,
  resetTentTypes,
  exportTentTypes,
  importTentTypesFromJson,
  getComponentLibrary
};
})();
