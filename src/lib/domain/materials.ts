/** Vitesses de coupe de perçage, valeurs prudentes pour usage amateur. */
export interface Material {
  id: string;
  labelFr: string;
  /** Abréviation courte pour les jetons de la frise Vc. */
  abbrFr: string;
  /** Vitesse de coupe Vc en m/min pour forets HSS. */
  vcHss: number;
}

/** Vc carbure ≈ 2,5 × Vc HSS (ordre de grandeur). */
export const CARBIDE_FACTOR = 2.5;

export const MATERIALS: Material[] = [
  { id: "steel", labelFr: "Acier (doux)", abbrFr: "Acier", vcHss: 25 },
  { id: "stainless", labelFr: "Acier inoxydable", abbrFr: "Inox", vcHss: 12 },
  { id: "cast-iron", labelFr: "Fonte", abbrFr: "Fonte", vcHss: 20 },
  { id: "aluminum", labelFr: "Aluminium", abbrFr: "Alu", vcHss: 70 },
  { id: "brass", labelFr: "Laiton / bronze", abbrFr: "Laiton", vcHss: 45 },
  { id: "hardwood", labelFr: "Bois dur", abbrFr: "Bois d.", vcHss: 40 },
  { id: "softwood", labelFr: "Bois tendre", abbrFr: "Bois t.", vcHss: 60 },
  { id: "plastic", labelFr: "Plastique", abbrFr: "Plast.", vcHss: 35 },
];

export function materialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

/** Matériau dont la Vc correspond exactement à cette valeur pour ce type de foret, ou null. */
export function vcMaterial(vc: number, carbide: boolean): Material | null {
  const factor = carbide ? CARBIDE_FACTOR : 1;
  return MATERIALS.find((m) => m.vcHss * factor === vc) ?? null;
}

/** Grille de base de la frise Vc (m/min) : fine jusqu'à 50, plus espacée au-delà. */
const VC_GRID = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200];

/** Valeurs de la frise Vc pour un type de foret : grille de base plus les Vc des matériaux pour ce type. */
export function vcChipValues(carbide: boolean): number[] {
  const factor = carbide ? CARBIDE_FACTOR : 1;
  return [...new Set([...VC_GRID, ...MATERIALS.map((m) => m.vcHss * factor)])].sort(
    (a, b) => a - b,
  );
}
