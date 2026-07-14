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

export interface DiameterRange {
  /** Ø mini en mm, null = jusqu'aux plus petits forets. */
  min: number | null;
  /** Ø maxi en mm, null = sans limite haute. */
  max: number | null;
}

/**
 * Pour chaque combinaison (triées par vitesse croissante), la plage de
 * diamètres pour laquelle elle serait la recommandée avec cette Vc. Découle
 * de la règle de pénalité : deux vitesses r₁ < r₂ basculent à l'idéal
 * I* = (r₁ + 2·r₂)/3 (dépassement compté double), converti en diamètre par
 * d = Vc × 1000 / (π × I). null = jamais recommandée (vitesse en doublon,
 * seule la première combinaison d'une vitesse donnée est retenue).
 */
export function diameterRanges(all: Combination[], vc: number): Array<DiameterRange | null> {
  const result: Array<DiameterRange | null> = all.map(() => null);
  // Premier représentant de chaque vitesse distincte — même départage que recommend().
  const winners: number[] = [];
  for (let i = 0; i < all.length; i++) {
    const prev = winners.length ? all[winners[winners.length - 1]].spindleRpm : null;
    if (prev === null || all[i].spindleRpm - prev > prev * 1e-9) winners.push(i);
  }
  const toDiameter = (ideal: number) => (vc * 1000) / (Math.PI * ideal);
  winners.forEach((comboIndex, k) => {
    const rpm = all[comboIndex].spindleRpm;
    const slower = k > 0 ? all[winners[k - 1]].spindleRpm : null;
    const faster = k < winners.length - 1 ? all[winners[k + 1]].spindleRpm : null;
    // Idéal en dessous duquel la vitesse inférieure gagne / au-dessus duquel la supérieure gagne.
    const idealLow = slower === null ? null : (slower + 2 * rpm) / 3;
    const idealHigh = faster === null ? null : (rpm + 2 * faster) / 3;
    result[comboIndex] = {
      min: idealHigh === null ? null : toDiameter(idealHigh),
      max: idealLow === null ? null : toDiameter(idealLow),
    };
  });
  return result;
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
