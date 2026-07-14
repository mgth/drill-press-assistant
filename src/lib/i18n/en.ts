import type { IssueParams, Strings } from "./fr";

/** English translation — same shape as the French dictionary. */
export const en: Strings = {
  appTitle: "Drill press assistant",
  tabs: {
    machine: "Machine",
    drilling: "Drilling",
  },
  machine: {
    pickerLabel: "Machine",
    newTwoShaft: "New (2 shafts)",
    newThreeShaft: "New (3 shafts)",
    delete: "Delete",
    deleteConfirm: "Delete this machine?",
    name: "Name",
    motorRpm: "Motor speed (rpm)",
    spindleLeft: "Spindle on the left of the diagram (as you see the machine)",
    addStep: "Add a step",
    removeStep: "Remove",
    stepDiameter: "Ø",
    pairName: "Position label (as engraved on the machine)",
    belt: "Belt",
    sharedCone: "Single cone (input and output on the same cone)",
    beltPairs: "Available positions",
    beltPairHint: "driving step → driven step",
    drivingStep: "driving step",
    drivenStep: "driven step",
    addPair: "Add a position",
    resetPairs: "Reset (same level)",
    step: "Step",
    stepShort: "St.",
    noMachine: "No machine yet. Create one to get started.",
  },
  factory: {
    twoShaftName: "2-shaft drill press",
    threeShaftName: "3-shaft drill press",
    motorShaft: "Motor",
    intermediateShaft: "Intermediate",
    spindleShaft: "Spindle",
    motorCone: "Motor cone",
    spindleCone: "Spindle cone",
    intermediateCone: "Intermediate cone",
    intermediateConeIn: "Intermediate cone (input)",
    intermediateConeOut: "Intermediate cone (output)",
  },
  issues: {
    "motor-rpm": (_: IssueParams) => "Motor speed must be greater than 0.",
    "min-shafts": (_: IssueParams) => "At least two shafts are required (motor and spindle).",
    "belt-count": (_: IssueParams) =>
      "Exactly one belt is required between each pair of consecutive shafts.",
    "empty-stack": (p: IssueParams) => `“${p.stack}” (${p.shaft}) has no steps.`,
    "bad-diameter": (p: IssueParams) =>
      `“${p.stack}” (${p.shaft}) has an invalid diameter (must be > 0).`,
    "belt-chain": (p: IssueParams) =>
      `Belt ${p.belt}: must connect shaft ${p.from} to shaft ${p.to}.`,
    "stack-missing": (p: IssueParams) => `Belt ${p.belt}: cone not found.`,
    "no-pairs": (p: IssueParams) => `Belt ${p.belt}: no position defined.`,
    "pair-out-of-range": (p: IssueParams) =>
      `Belt ${p.belt}: position (${p.i}, ${p.j}) out of range.`,
    "diameter-sum": (p: IssueParams) =>
      `Belt ${p.belt}: the diameter sum varies by more than ${p.tolerance}% across positions ` +
      "— check your input (on real stepped cones it is nearly constant).",
    "no-combination": (_: IssueParams) =>
      "No combination is possible: on a shared cone, the two belts cannot use the same step.",
  },
  advisor: {
    title: "Drilling parameters",
    material: "Material",
    custom: "Custom",
    diameter: "Drill Ø",
    bitType: "Bit type",
    hss: "HSS",
    carbide: "Carbide",
    idealRpm: "Ideal speed",
    rpm: "rpm",
    vc: "Cutting speed",
    recommended: "Recommended position",
    overspeedWarning:
      "Even the slowest combination exceeds the ideal speed: reduce the feed rate and lubricate.",
    invalidMachine: "The machine has errors — fix it in the Machine tab.",
  },
  table: {
    title: "All speeds",
    position: "Position",
    spindleRpm: "Spindle (rpm)",
    deviation: "Deviation",
    diaRange: "Suggested Ø",
    allDiameters: "all",
    recommendedBadge: "recommended",
    selectedBadge: "shown",
  },
  schematic: {
    aria: "Pulley diagram and belt positions",
  },
};
