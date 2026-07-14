import { describe, expect, it } from "vitest";
import { formatDeviation, idealRpm, recommend } from "./advisor";
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
