/**
 * Modèle générique d'une transmission par courroies de perceuse à colonne :
 * une chaîne linéaire d'arbres (moteur → [intermédiaire] → broche), chaque
 * arbre portant un ou deux cônes de poulies étagées.
 */

/** Cône de poulies étagées. Diamètres en mm, index 0 = étage du HAUT. */
export interface PulleyStack {
  id: string;
  label: string;
  steps: number[];
  /** Noms des étages tels que gravés sur la machine (ex. A, B, C ou 1, 2, 3). Défaut : numéro. */
  stepNames?: string[];
}

export function stepName(stack: PulleyStack, i: number): string {
  return stack.stepNames?.[i]?.trim() || String(i + 1);
}

/** Normalise un cône chargé depuis la persistance (données d'avant les repères d'étages). */
export function ensureStepNames(stack: PulleyStack): void {
  if (!stack.stepNames || stack.stepNames.length !== stack.steps.length) {
    stack.stepNames = stack.steps.map((_, i) => stepName(stack, i));
  }
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

  return issues;
}

/**
 * Après modification du nombre d'étages d'un cône : retire les paires hors
 * limites et, s'il n'en reste aucune, retente l'appariement par défaut.
 */
export function syncBeltPairs(m: Machine): void {
  for (const belt of m.belts) {
    const from = m.shafts[belt.fromShaft]?.stacks[belt.fromStack];
    const to = m.shafts[belt.toShaft]?.stacks[belt.toStack];
    if (!from || !to) continue;
    belt.allowedPairs = belt.allowedPairs.filter(
      ([i, j]) => i < from.steps.length && j < to.steps.length,
    );
    if (belt.allowedPairs.length === 0) belt.allowedPairs = defaultPairs(from, to);
  }
}

/** Gabarit : perceuse simple, 2 arbres, 5 vitesses. */
export function createTwoShaftMachine(): Machine {
  const motor: PulleyStack = {
    id: newId(),
    label: "Cône moteur",
    steps: [100, 87, 74, 61, 48],
    stepNames: ["1", "2", "3", "4", "5"],
  };
  const spindle: PulleyStack = {
    id: newId(),
    label: "Cône broche",
    steps: [48, 61, 74, 87, 100],
    stepNames: ["A", "B", "C", "D", "E"],
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
    stepNames: ["1", "2", "3", "4"],
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
    stepNames: ["A", "B", "C", "D"],
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
      },
      {
        fromShaft: 1,
        fromStack: 1,
        toShaft: 2,
        toStack: 0,
        allowedPairs: defaultPairs(midOut, spindle),
      },
    ],
  };
}
