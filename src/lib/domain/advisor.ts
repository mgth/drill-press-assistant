import type { Machine } from "./machine";
import { enumerateCombinations, type Combination } from "./calc";

/** Vitesse de rotation idéale (tr/min) pour une vitesse de coupe Vc (m/min) et un Ø de foret (mm). */
export function idealRpm(vcMPerMin: number, drillDiameterMm: number): number {
  return (vcMPerMin * 1000) / (Math.PI * drillDiameterMm);
}

/** Tolérance de dépassement de la vitesse idéale acceptée par la recommandation. */
export const OVERSPEED_TOLERANCE = 1.05;

export interface Recommendation {
  ideal: number;
  /** Combinaison retenue. */
  best: Combination;
  /** Toutes les combinaisons, triées par vitesse croissante. */
  all: Combination[];
  /** true si même la combinaison la plus lente dépasse la vitesse idéale. */
  overspeed: boolean;
}

/**
 * Règle : parmi les combinaisons ne dépassant pas la vitesse idéale de plus
 * de 5 %, prendre la plus rapide (en HSS, dépasser Vc brûle le foret ; être
 * en dessous ne fait que ralentir). S'il n'y en a aucune, prendre la plus
 * lente et signaler le dépassement.
 */
export function recommend(m: Machine, vc: number, drillDiameterMm: number): Recommendation {
  const ideal = idealRpm(vc, drillDiameterMm);
  const all = enumerateCombinations(m);
  const candidates = all.filter((c) => c.spindleRpm <= ideal * OVERSPEED_TOLERANCE);
  const best = candidates.length > 0 ? candidates[candidates.length - 1] : all[0];
  return { ideal, best, all, overspeed: candidates.length === 0 };
}
