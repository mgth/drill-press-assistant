import type { Machine } from "./machine";

/** Une position de courroies complète et la vitesse de broche qui en résulte. */
export interface Combination {
  /** pairs[k] = paire [iMenant, iMené] choisie pour belts[k]. */
  pairs: Array<[number, number]>;
  /** d_menant / d_mené par courroie. */
  ratios: number[];
  /** motorRpm × Π ratios, en tr/min. */
  spindleRpm: number;
}

/** Vitesse de chaque arbre (tr/min), ordonnée moteur → broche, pour une position donnée. */
export function shaftRpms(m: Machine, pairs: Array<[number, number]>): number[] {
  const rpms = [m.motorRpm];
  m.belts.forEach((belt, k) => {
    const [i, j] = pairs[k];
    const dFrom = m.shafts[belt.fromShaft].stacks[belt.fromStack].steps[i];
    const dTo = m.shafts[belt.toShaft].stacks[belt.toStack].steps[j];
    rpms.push(rpms[k] * (dFrom / dTo));
  });
  return rpms;
}

/**
 * Toutes les combinaisons de positions de courroies (produit cartésien des
 * paires autorisées de chaque courroie), triées par vitesse de broche
 * croissante. Volume typique : 4 à 16 combinaisons.
 */
export function enumerateCombinations(m: Machine): Combination[] {
  let partials: Array<{ pairs: Array<[number, number]>; ratios: number[]; rpm: number }> = [
    { pairs: [], ratios: [], rpm: m.motorRpm },
  ];

  m.belts.forEach((belt) => {
    const fromSteps = m.shafts[belt.fromShaft].stacks[belt.fromStack].steps;
    const toSteps = m.shafts[belt.toShaft].stacks[belt.toStack].steps;
    partials = partials.flatMap((p) =>
      belt.allowedPairs.map(([i, j]) => {
        const ratio = fromSteps[i] / toSteps[j];
        return {
          pairs: [...p.pairs, [i, j] as [number, number]],
          ratios: [...p.ratios, ratio],
          rpm: p.rpm * ratio,
        };
      }),
    );
  });

  return partials
    .map(({ pairs, ratios, rpm }) => ({ pairs, ratios, spindleRpm: rpm }))
    .sort((a, b) => a.spindleRpm - b.spindleRpm);
}
