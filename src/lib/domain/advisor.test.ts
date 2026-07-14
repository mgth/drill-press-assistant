import { describe, expect, it } from "vitest";
import { idealRpm, recommend } from "./advisor";
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

  it("prend la plus rapide des combinaisons sous la vitesse idéale", () => {
    // Idéal ≈ 1592 tr/min (alu Vc 70, Ø 14) → 1420 est la plus rapide en dessous
    const r = recommend(m, 70, 14);
    expect(Math.round(r.best.spindleRpm)).toBe(1420);
    expect(r.overspeed).toBe(false);
  });

  it("tolère un dépassement de 5 %", () => {
    // Idéal ≈ 1409 tr/min : 1420 dépasse de 0,8 % → accepté
    const r = recommend(m, 31, 7);
    expect(Math.round(r.best.spindleRpm)).toBe(1420);
    expect(r.overspeed).toBe(false);
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
