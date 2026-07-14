import type { Machine } from "./machine";

/** Une position de courroies complète et la vitesse de broche qui en résulte. */
export interface Combination {
  /** pairs[k] = paire [iMenant, iMené] choisie pour belts[k]. */
  pairs: Array<[number, number]>;
  /** pairIndexes[k] = indice de la paire dans belts[k].allowedPairs (→ repère de position). */
  pairIndexes: number[];
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
 * Quand deux courroies consécutives partagent le même cône (arbre
 * intermédiaire à cône unique), elles ne peuvent pas occuper le même étage.
 */
function hasSharedStepConflict(m: Machine, pairs: Array<[number, number]>): boolean {
  for (let k = 1; k < m.belts.length; k++) {
    const prev = m.belts[k - 1];
    const cur = m.belts[k];
    if (
      cur.fromShaft === prev.toShaft &&
      cur.fromStack === prev.toStack &&
      pairs[k][0] === pairs[k - 1][1]
    )
      return true;
  }
  return false;
}

/**
 * Toutes les combinaisons de positions de courroies (produit cartésien des
 * paires autorisées de chaque courroie, moins celles où deux courroies se
 * disputent le même étage d'un cône partagé), triées par vitesse de broche
 * croissante. Volume typique : 4 à 16 combinaisons.
 */
export function enumerateCombinations(m: Machine): Combination[] {
  let partials: Array<{
    pairs: Array<[number, number]>;
    pairIndexes: number[];
    ratios: number[];
    rpm: number;
  }> = [{ pairs: [], pairIndexes: [], ratios: [], rpm: m.motorRpm }];

  m.belts.forEach((belt) => {
    const fromSteps = m.shafts[belt.fromShaft].stacks[belt.fromStack].steps;
    const toSteps = m.shafts[belt.toShaft].stacks[belt.toStack].steps;
    partials = partials.flatMap((p) =>
      belt.allowedPairs.map(([i, j], pairIndex) => {
        const ratio = fromSteps[i] / toSteps[j];
        return {
          pairs: [...p.pairs, [i, j] as [number, number]],
          pairIndexes: [...p.pairIndexes, pairIndex],
          ratios: [...p.ratios, ratio],
          rpm: p.rpm * ratio,
        };
      }),
    );
  });

  return partials
    .filter((p) => !hasSharedStepConflict(m, p.pairs))
    .map(({ pairs, pairIndexes, ratios, rpm }) => ({ pairs, pairIndexes, ratios, spindleRpm: rpm }))
    .sort((a, b) => a.spindleRpm - b.spindleRpm);
}
