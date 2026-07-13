// ─────────────────────────────────────────────────────────────
// Lightweight i18n dictionary + language metadata.
// Three target languages: Moroccan Darija, Standard Arabic, French.
// (UI copy only — the analysis *commentary* is localized by the LLM.)
// ─────────────────────────────────────────────────────────────

import type { Lang } from "@/types";

export interface LangMeta {
  code: Lang;
  label: string;
  flag: string;
  dir: "rtl" | "ltr";
  /** Human name used when instructing the LLM which language to write in. */
  llmName: string;
}

export const LANGS: Record<Lang, LangMeta> = {
  dar: { code: "dar", label: "الدارجة", flag: "🇲🇦", dir: "rtl", llmName: "Moroccan Darija (written in Arabic script, casual register)" },
  ar: { code: "ar", label: "العربية", flag: "🇲🇦", dir: "rtl", llmName: "Modern Standard Arabic" },
  fr: { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr", llmName: "French" },
};

export const LANG_ORDER: Lang[] = ["dar", "ar", "fr"];

type Dict = Record<string, Record<Lang, string>>;

export const t: Dict = {
  appTagline: {
    dar: "تحليل ذكي ديال السباق ديال الخيل",
    ar: "تحليل ذكي لسباقات الخيل",
    fr: "L'analyse intelligente des courses hippiques",
  },
  searchPlaceholder: {
    dar: "قلب على شي كورس... مثلا «كورس السبت» ولا «Prix d'Amérique»",
    ar: "ابحث عن سباق... مثلاً «سباق السبت» أو «Prix d'Amérique»",
    fr: "Rechercher une course... ex. « Prix d'Amérique » ou « course de samedi »",
  },
  analyze: { dar: "حلّل دابا", ar: "حلّل الآن", fr: "Analyser" },
  analyzing: { dar: "كيتحلّل...", ar: "جاري التحليل...", fr: "Analyse en cours..." },
  digitalLogic: { dar: "المنطق الرقمي", ar: "المنطق الرقمي", fr: "Logique Digitale" },
  raceConditions: { dar: "شروط السباق", ar: "ظروف السباق", fr: "Conditions de Course" },
  coupDePoker: { dar: "Coup de Poker", ar: "Coup de Poker", fr: "Coup de Poker" },
  finalPrognosis: { dar: "التوقّع النهائي", ar: "التوقّع النهائي", fr: "Pronostic Final" },
  creditsLeft: { dar: "التحاليل الباقية", ar: "التحاليل المتبقية", fr: "Analyses restantes" },
  favorites: { dar: "المفضّلة", ar: "المفضلة", fr: "Favoris" },
  history: { dar: "التاريخ", ar: "السجل", fr: "Historique" },
  upgrade: { dar: "ترقّى Premium", ar: "الترقية إلى Premium", fr: "Passer Premium" },
  watchAd: { dar: "شوف إعلان و ربح تحليل", ar: "شاهد إعلاناً لربح تحليل", fr: "Regarder une pub" },
  noCredits: {
    dar: "سالاو ليك التحاليل المجّانية ديال اليوم.",
    ar: "انتهت تحاليلك المجانية لهذا اليوم.",
    fr: "Vous avez épuisé vos analyses gratuites du jour.",
  },
  riskSafe: { dar: "آمن", ar: "آمن", fr: "Prudent" },
  riskBalanced: { dar: "متوازن", ar: "متوازن", fr: "Équilibré" },
  riskRisky: { dar: "مغامرة", ar: "مخاطرة", fr: "Risqué" },
};

export function tr(key: string, lang: Lang): string {
  return t[key]?.[lang] ?? key;
}
