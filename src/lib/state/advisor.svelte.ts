import { CARBIDE_FACTOR, materialById } from "$lib/domain/materials";

class AdvisorState {
  materialId = $state("steel");
  diameterMm = $state(8);
  carbide = $state(false);
  /**
   * Combinaison choisie manuellement dans la table ou le schéma (null =
   * suivre la recommandation). Clé = JSON des paires.
   */
  selectedKey = $state<string | null>(null);

  get vc(): number {
    const mat = materialById(this.materialId);
    if (!mat) return 0;
    return mat.vcHss * (this.carbide ? CARBIDE_FACTOR : 1);
  }

  load(saved: { materialId: string; diameterMm: number; carbide: boolean } | null): void {
    if (!saved) return;
    if (materialById(saved.materialId)) this.materialId = saved.materialId;
    if (saved.diameterMm > 0) this.diameterMm = saved.diameterMm;
    this.carbide = saved.carbide;
  }
}

export const advisorState = new AdvisorState();

export function comboKey(pairs: Array<[number, number]>): string {
  return JSON.stringify(pairs);
}
