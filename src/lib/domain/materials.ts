/** Vitesses de coupe de perçage, valeurs prudentes pour usage amateur. */
export interface Material {
  id: string;
  labelFr: string;
  /** Vitesse de coupe Vc en m/min pour forets HSS. */
  vcHss: number;
}

/** Vc carbure ≈ 2,5 × Vc HSS (ordre de grandeur). */
export const CARBIDE_FACTOR = 2.5;

export const MATERIALS: Material[] = [
  { id: "steel", labelFr: "Acier (doux)", vcHss: 25 },
  { id: "stainless", labelFr: "Acier inoxydable", vcHss: 12 },
  { id: "cast-iron", labelFr: "Fonte", vcHss: 20 },
  { id: "aluminum", labelFr: "Aluminium", vcHss: 70 },
  { id: "brass", labelFr: "Laiton / bronze", vcHss: 45 },
  { id: "hardwood", labelFr: "Bois dur", vcHss: 40 },
  { id: "softwood", labelFr: "Bois tendre", vcHss: 60 },
  { id: "plastic", labelFr: "Plastique", vcHss: 35 },
];

export function materialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}
