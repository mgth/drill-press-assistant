import type { Material } from "$lib/domain/materials";
import { fr, type Strings } from "./fr";
import { en } from "./en";

export type LocaleId = "fr" | "en";

export const LOCALES: Array<{ id: LocaleId; label: string }> = [
  { id: "fr", label: "FR" },
  { id: "en", label: "EN" },
];

class I18nState {
  locale = $state<LocaleId>("fr");

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
