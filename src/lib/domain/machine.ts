/**
 * Modèle générique d'une transmission par courroies de perceuse à colonne :
 * une chaîne linéaire d'arbres (moteur → [intermédiaire] → broche), chaque
 * arbre portant un ou deux cônes de poulies étagées. Un arbre intermédiaire
 * à cône unique se modélise en faisant référencer le même cône par la
 * courroie d'entrée et celle de sortie.
 */
import { enumerateCombinations } from "./calc";

/** Cône de poulies étagées. Diamètres en mm, index 0 = étage du HAUT. */
export interface PulleyStack {
  id: string;
  label: string;
  steps: number[];
}

export interface Shaft {
  id: string;
  label: string;
  /** 1 cône (cas courant) ou 2 (arbre intermédiaire à double cône). */
  stacks: PulleyStack[];
}

export interface Belt {
  /** Côté menant : indices dans machine.shafts / shaft.stacks. */
  fromShaft: number;
  fromStack: number;
  /** Côté mené. */
  toShaft: number;
  toStack: number;
  /** Paires d'étages [iMenant, iMené] physiquement possibles pour la courroie. */
  allowedPairs: Array<[number, number]>;
  /**
   * Repères des positions tels que gravés sur la machine (ex. 1, 2, 3 pour la
   * courroie moteur, A, B, C pour la courroie broche), alignés sur
   * allowedPairs. Défaut : numéro de la position.
   */
  pairNames?: string[];
}

export function pairName(belt: Belt, i: number): string {
  return belt.pairNames?.[i]?.trim() || String(i + 1);
}

/** Repères par défaut : chiffres pour la première courroie, lettres ensuite. */
export function defaultPairNames(beltIndex: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    beltIndex === 0 ? String(i + 1) : String.fromCharCode(65 + (i % 26)),
  );
}

/** Normalise une machine chargée depuis la persistance (données d'avant les repères). */
export function ensurePairNames(m: Machine): void {
  m.belts.forEach((belt, k) => {
    const defaults = defaultPairNames(k, belt.allowedPairs.length);
    belt.pairNames = belt.allowedPairs.map((_, i) => belt.pairNames?.[i] ?? defaults[i]);
  });
}

export interface Machine {
  id: string;
  name: string;
  /** Vitesse moteur en tr/min (typ. 1420 ou 2800). */
  motorRpm: number;
  /** Ordonnés moteur → broche. belts[k] relie shafts[k] à shafts[k+1]. */
  shafts: Shaft[];
  belts: Belt[];
}

export interface Issue {
  level: "error" | "warning";
  message: string;
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/**
 * Appariement par défaut : étage i du cône menant ↔ étage i du cône mené
 * (même niveau vertical, les deux cônes étant saisis dans le même ordre
 * haut → bas). Si les nombres d'étages diffèrent, aucune paire par défaut :
 * la saisie manuelle s'impose.
 */
export function defaultPairs(
  from: PulleyStack,
  to: PulleyStack,
): Array<[number, number]> {
  if (from.steps.length !== to.steps.length) return [];
  return from.steps.map((_, i) => [i, i] as [number, number]);
}

/**
 * Sur une vraie paire de cônes étagés, la somme des diamètres en vis-à-vis
 * est quasi constante (longueur de courroie fixe). Une variation au-delà de
 * cette tolérance signale une erreur de saisie ou une paire impossible.
 */
export const BELT_SUM_TOLERANCE = 0.1;

export function validateMachine(m: Machine): Issue[] {
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  if (!(m.motorRpm > 0)) err("La vitesse moteur doit être supérieure à 0.");
  if (m.shafts.length < 2) err("Il faut au moins deux arbres (moteur et broche).");
  if (m.belts.length !== Math.max(0, m.shafts.length - 1))
    err("Il faut exactement une courroie entre chaque paire d'arbres consécutifs.");

  for (const shaft of m.shafts) {
    for (const stack of shaft.stacks) {
      if (stack.steps.length === 0)
        err(`« ${stack.label} » (${shaft.label}) n'a aucun étage.`);
      if (stack.steps.some((d) => !(d > 0)))
        err(`« ${stack.label} » (${shaft.label}) a un diamètre invalide (doit être > 0).`);
    }
  }

  m.belts.forEach((belt, k) => {
    const from = m.shafts[belt.fromShaft]?.stacks[belt.fromStack];
    const to = m.shafts[belt.toShaft]?.stacks[belt.toStack];
    if (belt.fromShaft !== k || belt.toShaft !== k + 1) {
      err(`Courroie ${k + 1} : doit relier l'arbre ${k + 1} à l'arbre ${k + 2}.`);
      return;
    }
    if (!from || !to) {
      err(`Courroie ${k + 1} : cône introuvable.`);
      return;
    }
    if (belt.allowedPairs.length === 0) {
      err(`Courroie ${k + 1} : aucune position définie.`);
      return;
    }
    for (const [i, j] of belt.allowedPairs) {
      if (from.steps[i] === undefined || to.steps[j] === undefined) {
        err(`Courroie ${k + 1} : position (${i + 1}, ${j + 1}) hors limites.`);
        return;
      }
    }
    const sums = belt.allowedPairs.map(([i, j]) => from.steps[i] + to.steps[j]);
    const min = Math.min(...sums);
    const max = Math.max(...sums);
    if (min > 0 && (max - min) / max > BELT_SUM_TOLERANCE)
      warn(
        `Courroie ${k + 1} : la somme des diamètres varie de plus de ${Math.round(BELT_SUM_TOLERANCE * 100)} % ` +
          "entre positions — vérifiez la saisie (sur de vrais cônes étagés elle est quasi constante).",
      );
  });

  if (
    issues.every((i) => i.level !== "error") &&
    enumerateCombinations(m).length === 0
  )
    err(
      "Aucune combinaison possible : sur un cône partagé, les deux courroies ne peuvent pas occuper le même étage.",
    );

  return issues;
}

/** true si l'arbre intermédiaire utilise le même cône pour l'entrée et la sortie. */
export function isSharedIntermediate(m: Machine, shaftIndex: number): boolean {
  const beltIn = m.belts[shaftIndex - 1];
  const beltOut = m.belts[shaftIndex];
  return !!beltIn && !!beltOut && beltIn.toStack === beltOut.fromStack;
}

/**
 * Bascule un arbre intermédiaire entre cône unique partagé (les deux
 * courroies sur le même cône, étages entrée/sortie forcément distincts) et
 * double cône (un cône par courroie).
 */
export function setSharedIntermediate(m: Machine, shaftIndex: number, shared: boolean): void {
  const shaft = m.shafts[shaftIndex];
  if (!shaft || shaftIndex <= 0 || shaftIndex >= m.shafts.length - 1) return;
  const beltIn = m.belts[shaftIndex - 1];
  const beltOut = m.belts[shaftIndex];
  if (shared && shaft.stacks.length > 1) {
    shaft.stacks = [shaft.stacks[0]];
    shaft.stacks[0].label = "Cône intermédiaire";
    beltIn.toStack = 0;
    beltOut.fromStack = 0;
  } else if (!shared && shaft.stacks.length === 1) {
    const src = shaft.stacks[0];
    src.label = "Cône intermédiaire (entrée)";
    shaft.stacks = [
      src,
      { id: newId(), label: "Cône intermédiaire (sortie)", steps: [...src.steps] },
    ];
    beltIn.toStack = 0;
    beltOut.fromStack = 1;
  }
  syncBeltPairs(m);
}

/**
 * Après modification du nombre d'étages d'un cône : retire les positions hors
 * limites (et leurs repères) et, s'il n'en reste aucune, retente
 * l'appariement par défaut.
 */
export function syncBeltPairs(m: Machine): void {
  m.belts.forEach((belt, k) => {
    const from = m.shafts[belt.fromShaft]?.stacks[belt.fromStack];
    const to = m.shafts[belt.toShaft]?.stacks[belt.toStack];
    if (!from || !to) return;
    const inRange = belt.allowedPairs.map(
      ([i, j]) => i < from.steps.length && j < to.steps.length,
    );
    belt.allowedPairs = belt.allowedPairs.filter((_, i) => inRange[i]);
    belt.pairNames = belt.pairNames?.filter((_, i) => inRange[i]);
    if (belt.allowedPairs.length === 0) {
      belt.allowedPairs = defaultPairs(from, to);
      belt.pairNames = defaultPairNames(k, belt.allowedPairs.length);
    }
  });
}

/** Gabarit : perceuse simple, 2 arbres, 5 vitesses. */
export function createTwoShaftMachine(): Machine {
  const motor: PulleyStack = {
    id: newId(),
    label: "Cône moteur",
    steps: [100, 87, 74, 61, 48],
  };
  const spindle: PulleyStack = {
    id: newId(),
    label: "Cône broche",
    steps: [48, 61, 74, 87, 100],
  };
  return {
    id: newId(),
    name: "Perceuse 2 arbres",
    motorRpm: 1420,
    shafts: [
      { id: newId(), label: "Moteur", stacks: [motor] },
      { id: newId(), label: "Broche", stacks: [spindle] },
    ],
    belts: [
      {
        fromShaft: 0,
        fromStack: 0,
        toShaft: 1,
        toStack: 0,
        allowedPairs: defaultPairs(motor, spindle),
        pairNames: ["A", "B", "C", "D", "E"],
      },
    ],
  };
}

/** Gabarit : perceuse 3 arbres (poulie intermédiaire à double cône), 12/16 vitesses. */
export function createThreeShaftMachine(): Machine {
  const motor: PulleyStack = {
    id: newId(),
    label: "Cône moteur",
    steps: [110, 90, 70, 50],
  };
  const midIn: PulleyStack = {
    id: newId(),
    label: "Cône intermédiaire (entrée)",
    steps: [50, 70, 90, 110],
  };
  const midOut: PulleyStack = {
    id: newId(),
    label: "Cône intermédiaire (sortie)",
    steps: [110, 90, 70, 50],
  };
  const spindle: PulleyStack = {
    id: newId(),
    label: "Cône broche",
    steps: [50, 70, 90, 110],
  };
  return {
    id: newId(),
    name: "Perceuse 3 arbres",
    motorRpm: 1420,
    shafts: [
      { id: newId(), label: "Moteur", stacks: [motor] },
      { id: newId(), label: "Intermédiaire", stacks: [midIn, midOut] },
      { id: newId(), label: "Broche", stacks: [spindle] },
    ],
    belts: [
      {
        fromShaft: 0,
        fromStack: 0,
        toShaft: 1,
        toStack: 0,
        allowedPairs: defaultPairs(motor, midIn),
        pairNames: ["1", "2", "3", "4"],
      },
      {
        fromShaft: 1,
        fromStack: 1,
        toShaft: 2,
        toStack: 0,
        allowedPairs: defaultPairs(midOut, spindle),
        pairNames: ["A", "B", "C", "D"],
      },
    ],
  };
}
