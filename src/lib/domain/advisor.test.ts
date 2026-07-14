import { describe, expect, it } from "vitest";
import { diameterRanges, formatDeviation, idealRpm, recommend } from "./advisor";
import { enumerateCombinations } from "./calc";
import { materialById } from "./materials";
import { createTwoShaftMachine, defaultPairs, type Machine, type PulleyStack } from "./machine";

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

describe("idealRpm", () => {
  it("acier Vc 25 m/min, foret Ø 10 mm → ≈ 796 tr/min", () => {
    const vc = materialById("steel")!.vcHss;
    expect(idealRpm(vc, 10)).toBeCloseTo(795.77, 1);
  });

  it("double de vitesse quand le diamètre est divisé par deux", () => {
    expect(idealRpm(25, 5)).toBeCloseTo(idealRpm(25, 10) * 2, 5);
  });
});

describe("recommend", () => {
  // Vitesses disponibles : ≈ 682, 1420, 2958 tr/min
  const m = twoShaft(1420, [100, 74, 48], [48, 74, 100]);

  it("prend la plus proche en dessous quand le dépassement serait trop cher", () => {
    // Idéal ≈ 1592 tr/min (alu Vc 70, Ø 14) : 1420 (−11 %) bat 2958 (+86 % ×2)
    const r = recommend(m, 70, 14);
    expect(Math.round(r.best.spindleRpm)).toBe(1420);
    expect(r.overspeed).toBe(false);
  });

  it("accepte un léger dépassement plutôt qu'un gros sous-régime (720/1220, idéal 1100)", () => {
    // Le cas de la vraie perceuse : gros trou dans la gamme de vitesses
    const gap = twoShaft(1000, [72, 122], [100, 100]);
    const r = recommend(gap, 11 * Math.PI, 10); // idéal = 1100 tr/min exactement
    expect(Math.round(r.best.spindleRpm)).toBe(1220); // +11 % ×2 bat −35 %
    expect(r.overspeed).toBe(false);
  });

  it("reste en dessous quand l'idéal est proche de la vitesse inférieure", () => {
    const gap = twoShaft(1000, [72, 122], [100, 100]);
    const r = recommend(gap, 8 * Math.PI, 10); // idéal = 800 tr/min
    expect(Math.round(r.best.spindleRpm)).toBe(720); // −10 % bat +53 % ×2
  });

  it("prend la plus lente et signale le dépassement quand tout est trop rapide", () => {
    // Inox Vc 12, Ø 30 → idéal ≈ 127 tr/min : même 682 est trop rapide
    const r = recommend(m, 12, 30);
    expect(Math.round(r.best.spindleRpm)).toBe(682);
    expect(r.overspeed).toBe(true);
  });

  it("retourne toutes les combinaisons triées pour la table", () => {
    const r = recommend(m, 25, 10);
    expect(r.all.map((c) => Math.round(c.spindleRpm))).toEqual([682, 1420, 2958]);
  });
});

describe("deviation", () => {
  it("formate l'écart signé en pourcentage", () => {
    expect(formatDeviation(1220, 1100)).toBe("+11 %");
    expect(formatDeviation(720, 1100)).toBe("−35 %");
    expect(formatDeviation(1100, 1100)).toBe("+0 %");
  });
});

describe("diameterRanges", () => {
  it("borne les plages à la bascule (r1 + 2·r2)/3, en cohérence avec recommend", () => {
    const m = twoShaft(1000, [72, 122], [100, 100]); // 720 et 1220 tr/min
    const vc = 11 * Math.PI; // idéal = 11000 / d
    const all = enumerateCombinations(m);
    const ranges = diameterRanges(all, vc);
    // Bascule à I* = (720 + 2×1220)/3 = 1053,33 tr/min → d* = 11000/1053,33 ≈ 10,44 mm
    const dStar = 11000 / ((720 + 2 * 1220) / 3);
    expect(ranges[0]).toEqual({ min: expect.closeTo(dStar, 6), max: null }); // 720 : les gros Ø
    expect(ranges[1]).toEqual({ min: null, max: expect.closeTo(dStar, 6) }); // 1220 : les petits Ø
    // Cohérence : de part et d'autre de la bascule, recommend choisit la bonne vitesse
    expect(Math.round(recommend(m, vc, dStar - 0.01).best.spindleRpm)).toBe(1220);
    expect(Math.round(recommend(m, vc, dStar + 0.01).best.spindleRpm)).toBe(720);
  });

  it("ne donne une plage qu'au premier représentant d'une vitesse en doublon", () => {
    // 100/50 et 50/25 mm donnent le même rapport → deux combos à la même vitesse
    const motor: PulleyStack = { id: "m", label: "M", steps: [100, 50] };
    const spindle: PulleyStack = { id: "s", label: "S", steps: [50, 25] };
    const m: Machine = {
      id: "t",
      name: "t",
      motorRpm: 1000,
      shafts: [
        { id: "a", label: "Moteur", stacks: [motor] },
        { id: "b", label: "Broche", stacks: [spindle] },
      ],
      belts: [
        {
          fromShaft: 0,
          fromStack: 0,
          toShaft: 1,
          toStack: 0,
          allowedPairs: [
            [0, 0],
            [1, 1],
          ],
        },
      ],
    };
    const all = enumerateCombinations(m); // deux fois 2000 tr/min
    const ranges = diameterRanges(all, 25);
    expect(ranges[0]).toEqual({ min: null, max: null }); // seule vitesse → tous les Ø
    expect(ranges[1]).toBeNull(); // doublon jamais recommandé
  });
});
