import { describe, expect, it } from "vitest";
import { enumerateCombinations, shaftRpms } from "./calc";
import {
  createThreeShaftMachine,
  createTwoShaftMachine,
  defaultPairs,
  stepName,
  validateMachine,
  type Machine,
  type PulleyStack,
} from "./machine";

function twoShaft(motorRpm: number, motorSteps: number[], spindleSteps: number[]): Machine {
  const motor: PulleyStack = { id: "m", label: "Moteur", steps: motorSteps };
  const spindle: PulleyStack = { id: "s", label: "Broche", steps: spindleSteps };
  return {
    id: "test",
    name: "Test",
    motorRpm,
    shafts: [
      { id: "sh0", label: "Moteur", stacks: [motor] },
      { id: "sh1", label: "Broche", stacks: [spindle] },
    ],
    belts: [
      { fromShaft: 0, fromStack: 0, toShaft: 1, toStack: 0, allowedPairs: defaultPairs(motor, spindle) },
    ],
  };
}

describe("enumerateCombinations", () => {
  it("calcule le ratio simple sur 2 arbres", () => {
    // 1420 tr/min, poulie menante 60 mm → menée 120 mm : la broche tourne 2× moins vite
    const m = twoShaft(1420, [60], [120]);
    const combos = enumerateCombinations(m);
    expect(combos).toHaveLength(1);
    expect(combos[0].spindleRpm).toBeCloseTo(710, 5);
    expect(combos[0].ratios).toEqual([0.5]);
  });

  it("énumère toutes les positions d'une paire de cônes et trie par vitesse croissante", () => {
    const m = twoShaft(1420, [100, 74, 48], [48, 74, 100]);
    const combos = enumerateCombinations(m);
    expect(combos).toHaveLength(3);
    expect(combos.map((c) => Math.round(c.spindleRpm))).toEqual([682, 1420, 2958]);
    expect(combos[0].pairs).toEqual([[2, 2]]); // 48 → 100 : le plus lent
    expect(combos[2].pairs).toEqual([[0, 0]]); // 100 → 48 : le plus rapide
  });

  it("chaîne les rapports sur 3 arbres (produit cartésien des deux courroies)", () => {
    const m = createThreeShaftMachine();
    const combos = enumerateCombinations(m);
    expect(combos).toHaveLength(16); // 4 positions × 4 positions
    // Extrêmes : (50/110)² × 1420 et (110/50)² × 1420
    expect(combos[0].spindleRpm).toBeCloseTo(1420 * (50 / 110) ** 2, 5);
    expect(combos[15].spindleRpm).toBeCloseTo(1420 * (110 / 50) ** 2, 5);
    // Le tri est croissant
    for (let i = 1; i < combos.length; i++)
      expect(combos[i].spindleRpm).toBeGreaterThanOrEqual(combos[i - 1].spindleRpm);
  });

  it("shaftRpms donne la vitesse de chaque arbre", () => {
    const m = createThreeShaftMachine();
    // Position [0,0] : moteur 110 → entrée 50 ; sortie 110 → broche 50
    const rpms = shaftRpms(m, [
      [0, 0],
      [0, 0],
    ]);
    expect(rpms).toHaveLength(3);
    expect(rpms[0]).toBe(1420);
    expect(rpms[1]).toBeCloseTo(1420 * (110 / 50), 5);
    expect(rpms[2]).toBeCloseTo(1420 * (110 / 50) ** 2, 5);
  });
});

describe("defaultPairs", () => {
  it("apparie au même niveau quand les cônes ont le même nombre d'étages", () => {
    const a: PulleyStack = { id: "a", label: "A", steps: [100, 80, 60] };
    const b: PulleyStack = { id: "b", label: "B", steps: [60, 80, 100] };
    expect(defaultPairs(a, b)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it("ne propose rien quand les nombres d'étages diffèrent", () => {
    const a: PulleyStack = { id: "a", label: "A", steps: [100, 80] };
    const b: PulleyStack = { id: "b", label: "B", steps: [60, 80, 100] };
    expect(defaultPairs(a, b)).toEqual([]);
  });
});

describe("stepName", () => {
  it("utilise le repère gravé quand il existe, sinon le numéro", () => {
    const named: PulleyStack = { id: "a", label: "A", steps: [50, 70], stepNames: ["A", "B"] };
    const bare: PulleyStack = { id: "b", label: "B", steps: [50, 70] };
    const blank: PulleyStack = { id: "c", label: "C", steps: [50, 70], stepNames: ["", "  "] };
    expect(stepName(named, 1)).toBe("B");
    expect(stepName(bare, 1)).toBe("2");
    expect(stepName(blank, 0)).toBe("1"); // repère vide → retombe sur le numéro
  });
});

describe("validateMachine", () => {
  it("accepte les gabarits fournis", () => {
    expect(validateMachine(createTwoShaftMachine())).toEqual([]);
    expect(validateMachine(createThreeShaftMachine())).toEqual([]);
  });

  it("refuse un diamètre nul et une courroie sans position", () => {
    const m = twoShaft(1420, [0], [100]);
    m.belts[0].allowedPairs = [];
    const issues = validateMachine(m);
    expect(issues.filter((i) => i.level === "error")).toHaveLength(2);
  });

  it("avertit quand la somme des diamètres varie trop entre positions", () => {
    // 100+48=148 vs 74+74=148 vs 48+200=248 : la 3e paire est incohérente
    const m = twoShaft(1420, [100, 74, 48], [48, 74, 200]);
    const issues = validateMachine(m);
    expect(issues.some((i) => i.level === "warning")).toBe(true);
  });
});
