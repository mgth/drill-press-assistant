import type { Machine } from "./machine";
import { enumerateCombinations, type Combination } from "./calc";

/** Vitesse de rotation idéale (tr/min) pour une vitesse de coupe Vc (m/min) et un Ø de foret (mm). */
export function idealRpm(vcMPerMin: number, drillDiameterMm: number): number {
  return (vcMPerMin * 1000) / (Math.PI * drillDiameterMm);
}

/** Écart relatif signé à la vitesse idéale (+0,11 = 11 % trop vite). */
export function deviation(rpm: number, ideal: number): number {
  return (rpm - ideal) / ideal;
}

/** Écart formaté pour l'affichage, ex. « +11 % » ou « −35 % ». */
export function formatDeviation(rpm: number, ideal: number): string {
  const pct = Math.round(deviation(rpm, ideal) * 100);
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct)} %`;
}

/**
 * Dépasser la vitesse de coupe use l'outil (chaleur au bord de coupe) alors
 * qu'être en dessous ne fait surtout que ralentir : le dépassement compte
 * double dans le choix de la combinaison.
 */
export const OVER_PENALTY_FACTOR = 2;

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
 * Règle : la combinaison la plus proche de la vitesse idéale en écart
 * relatif, le dépassement étant pénalisé double (idéal 1100, choix 720/1220 →
 * 1220 : +11 % pondéré ×2 bat −35 %). Si même la plus lente dépasse l'idéal
 * (petit foret, machine rapide), `overspeed` déclenche l'avertissement.
 */
export function recommend(m: Machine, vc: number, drillDiameterMm: number): Recommendation {
  const ideal = idealRpm(vc, drillDiameterMm);
  const all = enumerateCombinations(m);
  const penalty = (c: Combination) => {
    const dev = deviation(c.spindleRpm, ideal);
    return dev >= 0 ? dev * OVER_PENALTY_FACTOR : -dev;
  };
  const best = all.reduce<Combination | null>(
    (a, b) => (a === null || penalty(b) < penalty(a) ? b : a),
    null,
  )!;
  return { ideal, best, all, overspeed: all.length > 0 && all[0].spindleRpm > ideal };
}
