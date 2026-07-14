import { CARBIDE_FACTOR, MATERIALS, materialById } from "$lib/domain/materials";
import type { AdvisorSettings } from "$lib/storage/storage";

/** Matériau + type de foret correspondant exactement à cette Vc, s'il existe (HSS prioritaire). */
function matchVc(vc: number): { materialId: string; carbide: boolean } | null {
  for (const mat of MATERIALS) if (mat.vcHss === vc) return { materialId: mat.id, carbide: false };
  for (const mat of MATERIALS)
    if (mat.vcHss * CARBIDE_FACTOR === vc) return { materialId: mat.id, carbide: true };
  return null;
}

class AdvisorState {
  materialId = $state("steel");
  diameterMm = $state(8);
  carbide = $state(false);
  /** Vc choisie à la main dans la frise ; null = suivre matériau + type de foret. */
  vcOverride = $state<number | null>(null);
  /**
   * Combinaison choisie manuellement dans la table ou le schéma (null =
   * suivre la recommandation). Clé = JSON des paires.
   */
  selectedKey = $state<string | null>(null);

  get vc(): number {
    if (this.vcOverride !== null) return this.vcOverride;
    const mat = materialById(this.materialId);
    if (!mat) return 0;
    return mat.vcHss * (this.carbide ? CARBIDE_FACTOR : 1);
  }

  setMaterial(id: string): void {
    this.materialId = id;
    this.vcOverride = null;
  }

  setCarbide(carbide: boolean): void {
    this.carbide = carbide;
    this.vcOverride = null;
  }

  /**
   * Vc choisie dans la frise : si elle correspond à un couple matériau/foret
   * connu, on le sélectionne ; sinon la Vc devient « personnalisée »
   * (matériau et type de foret désélectionnés).
   */
  setVc(vc: number): void {
    const match = matchVc(vc);
    if (match) {
      this.materialId = match.materialId;
      this.carbide = match.carbide;
      this.vcOverride = null;
    } else {
      this.vcOverride = vc;
    }
  }

  /** true quand la Vc ne correspond à aucun couple matériau/foret. */
  get custom(): boolean {
    return this.vcOverride !== null;
  }

  load(saved: AdvisorSettings | null): void {
    if (!saved) return;
    if (materialById(saved.materialId)) this.materialId = saved.materialId;
    if (saved.diameterMm > 0) this.diameterMm = saved.diameterMm;
    this.carbide = saved.carbide;
    this.vcOverride = saved.vcOverride ?? null;
  }
}

export const advisorState = new AdvisorState();

export function comboKey(pairs: Array<[number, number]>): string {
  return JSON.stringify(pairs);
}
