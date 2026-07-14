import { describe, expect, it } from "vitest";
import { IMPERIAL_DRILLS, MM_PER_INCH, SFM_PER_M_MIN, SFM_GRID } from "./units";
import { vcChipValues } from "./materials";

describe("units", () => {
  it("convertit pouces ↔ mm", () => {
    expect(1 * MM_PER_INCH).toBeCloseTo(25.4, 6);
    expect(IMPERIAL_DRILLS.find((d) => d.label === "1/2")!.mm).toBeCloseTo(12.7, 6);
    expect(IMPERIAL_DRILLS.find((d) => d.label === "1")!.mm).toBeCloseTo(25.4, 6);
  });

  it("convertit m/min ↔ SFM (≈ 3,28)", () => {
    expect(30 * SFM_PER_M_MIN).toBeCloseTo(98.43, 1); // 30 m/min ≈ 98 SFM
  });

  it("la grille Vc impériale reste stockée en m/min et inclut les Vc matériaux", () => {
    const metric = vcChipValues(false, false);
    const imperial = vcChipValues(false, true);
    // Chaque valeur SFM de la grille se retrouve en m/min dans la frise impériale
    for (const sfm of SFM_GRID)
      expect(imperial.some((v) => Math.abs(v * SFM_PER_M_MIN - sfm) < 0.01)).toBe(true);
    // Les Vc des matériaux (m/min) sont présentes dans les deux
    expect(metric).toContain(25); // acier HSS
    expect(imperial).toContain(25);
  });
});
