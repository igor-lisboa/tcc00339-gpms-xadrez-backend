/**
 * Languages the API can answer in. pt-BR is the language the messages were written in,
 * so it is the default and the fallback for any header the API does not know.
 */
export const SUPPORTED_LOCALES = ["pt-BR", "en", "fr", "it", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

/** Base languages that map to a supported locale. "pt" and "pt-PT" both get the Portuguese text. */
const LOCALE_BY_BASE_LANGUAGE = new Map<string, Locale>([
    ["pt", "pt-BR"],
    ["en", "en"],
    ["fr", "fr"],
    ["it", "it"],
    ["de", "de"],
]);

interface LanguagePreference {
    readonly tag: string;
    readonly quality: number;
}

const parsePreference = (part: string): LanguagePreference => {
    const [tag, ...params] = part.split(";").map((piece) => piece.trim());
    const qualityParam = params.find((param) => param.startsWith("q="));
    const quality = qualityParam === undefined ? 1 : Number(qualityParam.slice(2));
    return { tag: tag.toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
};

/** Parses an Accept-Language header, drops refused languages (q=0) and sorts by preference. */
const parseAcceptLanguage = (header: string): LanguagePreference[] =>
    header
        .split(",")
        .map(parsePreference)
        .filter((preference) => preference.tag.length > 0 && preference.quality > 0)
        .sort((first, second) => second.quality - first.quality);

const localeForTag = (tag: string): Locale | undefined => {
    const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === tag);
    return exact ?? LOCALE_BY_BASE_LANGUAGE.get(tag.split("-")[0]);
};

/** Picks the first language of the header that the API supports, or pt-BR when none matches. */
export const negotiateLocale = (header: string | undefined): Locale => {
    if (header === undefined) {
        return DEFAULT_LOCALE;
    }
    for (const { tag } of parseAcceptLanguage(header)) {
        const locale = localeForTag(tag);
        if (locale !== undefined) {
            return locale;
        }
    }
    return DEFAULT_LOCALE;
};
