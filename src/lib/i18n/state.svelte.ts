import type { Material } from "$lib/domain/materials";
import { MM_PER_INCH, SFM_PER_M_MIN } from "$lib/domain/units";
import { fr, type Strings } from "./fr";
import { en } from "./en";

export type LocaleId = "fr" | "en";
export type UnitsId = "metric" | "imperial";

export const LOCALES: Array<{ id: LocaleId; label: string }> = [
  { id: "fr", label: "FR" },
  { id: "en", label: "EN" },
];

export const UNITS: Array<{ id: UnitsId; label: string }> = [
  { id: "metric", label: "mm" },
  { id: "imperial", label: "in" },
];

class I18nState {
  locale = $state<LocaleId>("fr");
  units = $state<UnitsId>("metric");

  get imperial(): boolean {
    return this.units === "imperial";
  }

  /** Unité de longueur affichée. */
  get lenUnit(): string {
    return this.imperial ? "in" : "mm";
  }

  /** Unité de vitesse de coupe affichée. */
  get vcUnit(): string {
    return this.imperial ? "SFM" : "m/min";
  }

  /** mm → valeur affichée dans l'unité courante (pour les champs de saisie). */
  displayLen(mm: number): number {
    return this.imperial ? Math.round((mm / MM_PER_INCH) * 1000) / 1000 : mm;
  }

  /** Valeur saisie dans l'unité courante → mm. */
  parseLen(display: number): number {
    return this.imperial ? display * MM_PER_INCH : display;
  }

  /** mm → texte formaté dans l'unité courante. */
  formatLen(mm: number): string {
    if (this.imperial) return this.formatNumber(Math.round((mm / MM_PER_INCH) * 100) / 100);
    return this.formatNumber(mm >= 10 ? Math.round(mm * 10) / 10 : Math.round(mm * 100) / 100);
  }

  /** Vc en m/min → texte formaté dans l'unité courante. */
  formatVc(mPerMin: number): string {
    return this.imperial
      ? this.formatNumber(Math.round(mPerMin * SFM_PER_M_MIN))
      : this.formatNumber(mPerMin);
  }

  get t(): Strings {
    return this.locale === "en" ? en : fr;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.locale === "fr" ? "fr-FR" : "en-US", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  materialLabel(m: Material): string {
    return this.locale === "en" ? m.labelEn : m.labelFr;
  }

  materialAbbr(m: Material): string {
    return this.locale === "en" ? m.abbrEn : m.abbrFr;
  }
}

export const i18n = new I18nState();
