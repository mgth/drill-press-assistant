/** Toutes les chaînes de l'interface, centralisées. */

export type IssueParams = Record<string, string | number>;

export const fr = {
  appTitle: "Assistant perceuse",
  tabs: {
    machine: "Machine",
    drilling: "Perçage",
  },
  machine: {
    pickerLabel: "Machine",
    newTwoShaft: "Nouvelle (2 arbres)",
    newThreeShaft: "Nouvelle (3 arbres)",
    delete: "Supprimer",
    deleteConfirm: "Supprimer cette machine ?",
    name: "Nom",
    motorRpm: "Vitesse moteur (tr/min)",
    spindleLeft: "Broche à gauche sur le schéma (telle que vous voyez la machine)",
    addStep: "Ajouter un étage",
    removeStep: "Retirer",
    stepDiameter: "Ø (mm)",
    pairName: "Repère de la position (tel que gravé sur la machine)",
    belt: "Courroie",
    sharedCone: "Cône unique (entrée et sortie sur le même cône)",
    beltPairs: "Positions possibles",
    beltPairHint: "étage menant → étage mené",
    drivingStep: "étage menant",
    drivenStep: "étage mené",
    addPair: "Ajouter une position",
    resetPairs: "Réinitialiser (même niveau)",
    step: "Étage",
    stepShort: "Ét.",
    noMachine: "Aucune machine. Créez-en une pour commencer.",
  },
  /** Libellés des machines créées par les gabarits (stockés dans les données). */
  factory: {
    twoShaftName: "Perceuse 2 arbres",
    threeShaftName: "Perceuse 3 arbres",
    motorShaft: "Moteur",
    intermediateShaft: "Intermédiaire",
    spindleShaft: "Broche",
    motorCone: "Cône moteur",
    spindleCone: "Cône broche",
    intermediateCone: "Cône intermédiaire",
    intermediateConeIn: "Cône intermédiaire (entrée)",
    intermediateConeOut: "Cône intermédiaire (sortie)",
  },
  /** Messages de validation, par code. */
  issues: {
    "motor-rpm": (_: IssueParams) => "La vitesse moteur doit être supérieure à 0.",
    "min-shafts": (_: IssueParams) => "Il faut au moins deux arbres (moteur et broche).",
    "belt-count": (_: IssueParams) =>
      "Il faut exactement une courroie entre chaque paire d'arbres consécutifs.",
    "empty-stack": (p: IssueParams) => `« ${p.stack} » (${p.shaft}) n'a aucun étage.`,
    "bad-diameter": (p: IssueParams) =>
      `« ${p.stack} » (${p.shaft}) a un diamètre invalide (doit être > 0).`,
    "belt-chain": (p: IssueParams) =>
      `Courroie ${p.belt} : doit relier l'arbre ${p.from} à l'arbre ${p.to}.`,
    "stack-missing": (p: IssueParams) => `Courroie ${p.belt} : cône introuvable.`,
    "no-pairs": (p: IssueParams) => `Courroie ${p.belt} : aucune position définie.`,
    "pair-out-of-range": (p: IssueParams) =>
      `Courroie ${p.belt} : position (${p.i}, ${p.j}) hors limites.`,
    "diameter-sum": (p: IssueParams) =>
      `Courroie ${p.belt} : la somme des diamètres varie de plus de ${p.tolerance} % ` +
      "entre positions — vérifiez la saisie (sur de vrais cônes étagés elle est quasi constante).",
    "no-combination": (_: IssueParams) =>
      "Aucune combinaison possible : sur un cône partagé, les deux courroies ne peuvent pas occuper le même étage.",
  },
  advisor: {
    title: "Paramètres de perçage",
    material: "Matériau",
    custom: "Personnalisé",
    diameter: "Ø de perçage (mm)",
    bitType: "Type de foret",
    hss: "HSS",
    carbide: "Carbure",
    idealRpm: "Vitesse idéale",
    rpm: "tr/min",
    vc: "Vitesse de coupe",
    recommended: "Position recommandée",
    overspeedWarning:
      "Même la combinaison la plus lente dépasse la vitesse idéale : réduisez la vitesse d'avance et lubrifiez.",
    invalidMachine: "La machine comporte des erreurs — corrigez-la dans l'onglet Machine.",
  },
  table: {
    title: "Toutes les vitesses",
    position: "Position",
    spindleRpm: "Broche (tr/min)",
    deviation: "Écart",
    diaRange: "Ø conseillé (mm)",
    allDiameters: "tous",
    recommendedBadge: "recommandé",
    selectedBadge: "affiché",
  },
  schematic: {
    aria: "Schéma des poulies et position des courroies",
  },
};

export type Strings = typeof fr;
