(() => {
/*
  Materialdaten für den Zeltmaterialrechner.
  Globale Komponenten (z. B. Heringe, Abspannschnüre) sind zentral gepflegt.
*/
const DEFAULT_MARKING = "Kennzeichnung später eintragen";

function component(id, label, qty, marking = DEFAULT_MARKING) {
  return { id, label, marking, qty };
}

// Globale, zeltübergreifende Komponenten.
const globalComponents = {
  abspannschnur: (qty) => component("abspannschnur", "Abspannschnur", qty),
  hering: (qty) => component("hering", "Hering", qty)
};

// Zelt-spezifische Bauteile pro Zeltart.
const tentSpecificComponents = {
  jurte: {
    kreuz: (qty) => component("kreuz_jurte", "Kreuz", qty),
    seitenstangeKlein: (qty) => component("seitenstange_klein_jurte", "Seitenstange klein (Jurte)", qty),
    mittelstangeSet: (qty) => component("mittelstange_set_jurte", "Mittelstangen-Set Jurte (2 Stangen + 1 Verbinder)", qty),
    schraubfuss: (qty) => component("schraubfuss_jurte", "Schraubfuß", qty),
    dreibeinStange: (qty) => component("dreibein_stange_jurte", "Dreibein-Stange", qty),
    dreibeinVerbinder: (qty) => component("dreibein_verbinder_jurte", "Dreibein-Verbinder", qty),
    dreibeinFuss: (qty) => component("dreibein_fuss_jurte", "Dreibein-Fuß", qty)
  },
  grossraumjurte: {
    metallspinne: (qty) => component("metallspinne_grossraum", "Metallspinne", qty),
    stangeSpinne: (qty) => component("stange_spinne_grossraum", "Stange (Spinne)", qty),
    verbinderSpinne: (qty) => component("verbinder_spinne_grossraum", "Verbinder (Spinne)", qty),
    fussSpinne: (qty) => component("fuss_spinne_grossraum", "Fuß (Spinne)", qty),
    tellerSet: (qty) => component("teller_set_grossraum", "Teller + 8 Ketten + Karabiner", qty),
    stangeTeller: (qty) => component("stange_teller_grossraum", "Stange (Teller)", qty),
    verbinderTeller: (qty) => component("verbinder_teller_grossraum", "Verbinder (Teller)", qty),
    fussTeller: (qty) => component("fuss_teller_grossraum", "Fuß (Teller)", qty),
    seitenstange: (qty) => component("seitenstange_grossraum", "Seitenstange Großraumjurte", qty),
    mittelstangeSet: (qty) => component("mittelstange_set_grossraum", "Mittelstangen-Set Großraumjurte (2 Stangen + 1 Verbinder)", qty),
    schraubfuss: (qty) => component("schraubfuss_grossraum", "Schraubfuß", qty),
    dreibeinStange: (qty) => component("dreibein_stange_grossraum", "Dreibein-Stange", qty),
    dreibeinVerbinder: (qty) => component("dreibein_verbinder_grossraum", "Dreibein-Verbinder", qty),
    dreibeinFuss: (qty) => component("dreibein_fuss_grossraum", "Dreibein-Fuß", qty)
  },
  kohte: {
    kohtenplane: (qty) => component("kohtenplane", "Kohtenplane", qty),
    seitenstange: (qty) => component("seitenstange_kohte", "Seitenstange Kohte", qty),
    mittelstange: (qty) => component("mittelstange_kohte", "Mittelstange Kohte", qty),
    dreibeinStange: (qty) => component("dreibein_stange", "Dreibein-Stange", qty),
    dreibeinVerbinder: (qty) => component("dreibein_verbinder", "Dreibein-Verbinder", qty)
  }
};

// Varianten pro Zeltart (nur nötig, wenn es mehrere Aufbauvarianten gibt).
const variants = {
  jurte: {
    standard: {
      label: "Standard",
      components: [
        tentSpecificComponents.jurte.kreuz(1),
        tentSpecificComponents.jurte.seitenstangeKlein(12),
        globalComponents.abspannschnur(12),
        globalComponents.hering(13)
      ]
    }
  },
  grossraumjurte: {
    spinne: {
      label: "Spinne",
      components: [
        tentSpecificComponents.grossraumjurte.metallspinne(1),
        tentSpecificComponents.grossraumjurte.stangeSpinne(9),
        tentSpecificComponents.grossraumjurte.verbinderSpinne(6),
        tentSpecificComponents.grossraumjurte.fussSpinne(3),
        tentSpecificComponents.grossraumjurte.seitenstange(16),
        globalComponents.abspannschnur(16),
        globalComponents.hering(19)
      ]
    },
    teller: {
      label: "Teller",
      components: [
        tentSpecificComponents.grossraumjurte.tellerSet(1),
        tentSpecificComponents.grossraumjurte.stangeTeller(6),
        tentSpecificComponents.grossraumjurte.verbinderTeller(3),
        tentSpecificComponents.grossraumjurte.fussTeller(3),
        tentSpecificComponents.grossraumjurte.seitenstange(16),
        globalComponents.abspannschnur(16),
        globalComponents.hering(17)
      ]
    }
  }
};

// Aufbauoptionen pro Zeltart.
const poleOptions = {
  jurte: {
    fixed: [
      tentSpecificComponents.jurte.mittelstangeSet(1),
      tentSpecificComponents.jurte.schraubfuss(1)
    ],
    tripod: [
      tentSpecificComponents.jurte.dreibeinStange(3),
      tentSpecificComponents.jurte.dreibeinVerbinder(1),
      tentSpecificComponents.jurte.dreibeinFuss(3)
    ]
  },
  grossraumjurte: {
    fixed: [
      tentSpecificComponents.grossraumjurte.mittelstangeSet(1),
      tentSpecificComponents.grossraumjurte.schraubfuss(1)
    ],
    tripod: [
      tentSpecificComponents.grossraumjurte.dreibeinStange(3),
      tentSpecificComponents.grossraumjurte.dreibeinVerbinder(1),
      tentSpecificComponents.grossraumjurte.dreibeinFuss(3)
    ]
  },
  kohte: {
    fixed: [
      tentSpecificComponents.kohte.mittelstange(1)
    ],
    tripod: [
      tentSpecificComponents.kohte.dreibeinStange(3),
      tentSpecificComponents.kohte.dreibeinVerbinder(1)
    ]
  }
};

// Basis-Komponenten ohne Varianten (z. B. Kohte).
const baseComponents = {
  kohte: [
    tentSpecificComponents.kohte.kohtenplane(4),
    tentSpecificComponents.kohte.seitenstange(8)
  ]
};

/*
  Muster für neue Zeltart "xyz":

  1) tentSpecificComponents.xyz anlegen
  2) optional variants.xyz anlegen
  3) poleOptions.xyz anlegen
  4) optional baseComponents.xyz anlegen
  5) in tentTypes.xyz referenzieren

  Beispiel:
  xyz: {
    label: "XYZ",
    description: "Beschreibung",
    variants: variants.xyz,          // oder weglassen
    components: baseComponents.xyz,  // oder weglassen
    poleOptions: poleOptions.xyz
  }
*/
const tentTypes = {
  jurte: {
    label: "Jurte",
    description: "Normale Jurte",
    variants: variants.jurte,
    poleOptions: poleOptions.jurte
  },

  grossraumjurte: {
    label: "Großraumjurte",
    description: "Große Jurte",
    variants: variants.grossraumjurte,
    poleOptions: poleOptions.grossraumjurte
  },

  kohte: {
    label: "Kohte",
    description: "Kohte",
    components: baseComponents.kohte,
    poleOptions: poleOptions.kohte
  }
};

window.tentTypes = tentTypes;
})();
