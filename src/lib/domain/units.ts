/** Conversions métrique ↔ impérial. Le modèle stocke toujours mm et m/min. */

export const MM_PER_INCH = 25.4;
/** 1 m/min en pieds/min (SFM). */
export const SFM_PER_M_MIN = 3.280839895;

/** Forets fractionnaires courants pour la frise de diamètres en impérial. */
// prettier-ignore
export const IMPERIAL_DRILLS: Array<{ label: string; mm: number }> = ([
  ["1/16", 1 / 16], ["5/64", 5 / 64], ["3/32", 3 / 32], ["1/8", 1 / 8],
  ["5/32", 5 / 32], ["3/16", 3 / 16], ["7/32", 7 / 32], ["1/4", 1 / 4],
  ["5/16", 5 / 16], ["3/8", 3 / 8], ["7/16", 7 / 16], ["1/2", 1 / 2],
  ["9/16", 9 / 16], ["5/8", 5 / 8], ["3/4", 3 / 4], ["1", 1],
] as Array<[string, number]>).map(([label, inches]) => ({ label, mm: inches * MM_PER_INCH }));

/** Grille de base de la frise Vc en impérial (SFM), convertie en m/min à l'usage. */
export const SFM_GRID = [25, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 650];
