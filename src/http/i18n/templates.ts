import type { Locale } from "./locales";

type TranslatedLocale = Exclude<Locale, "pt-BR">;

/**
 * A Portuguese message that has a value in it. The pattern captures the values; each
 * language's text puts them back with {1}, {2}... (the side name and the board data are kept as they are).
 */
export interface MessageTemplate {
    readonly pattern: RegExp;
    readonly texts: Readonly<Record<TranslatedLocale, string>>;
}

export const MESSAGE_TEMPLATES: readonly MessageTemplate[] = [
    {
        pattern: /^Já tem um empate proposto pelo lado (.+)$/, // names-check:ignore (Portuguese wire messages the domain throws)
        texts: {
            en: "A draw has already been offered by the {1} side",
            fr: "Une nulle a déjà été proposée par le camp {1}",
            it: "Una patta è già stata proposta dal lato {1}",
            de: "Ein Remis wurde bereits von der Seite {1} angeboten",
        },
    },
    {
        pattern: /^Já tem um reset proposto pelo lado (.+)$/, // names-check:ignore (Portuguese wire messages the domain throws)
        texts: {
            en: "A reset has already been offered by the {1} side",
            fr: "Une réinitialisation a déjà été proposée par le camp {1}",
            it: "Una reimpostazione è già stata proposta dal lato {1}",
            de: "Ein Zurücksetzen wurde bereits von der Seite {1} vorgeschlagen",
        },
    },
    {
        pattern: /^Peça na casa da linha:(\S+) e coluna:(\S+) inválida \((.*)\)$/, // names-check:ignore (Portuguese wire messages the domain throws)
        texts: {
            en: "The piece on row {1}, column {2} is invalid ({3})",
            fr: "La pièce de la ligne {1}, colonne {2} est invalide ({3})",
            it: "Il pezzo sulla riga {1} e colonna {2} non è valido ({3})",
            de: "Die Figur in Reihe {1}, Spalte {2} ist ungültig ({3})",
        },
    },
    {
        pattern: /^Peça na casa da linha:(\S+) e coluna:(\S+) tem o lado definido de forma incorreta \((.*)\)$/, // names-check:ignore (Portuguese wire messages the domain throws)
        texts: {
            en: "The piece on row {1}, column {2} has its side set incorrectly ({3})",
            fr: "La pièce de la ligne {1}, colonne {2} a un camp défini de façon incorrecte ({3})",
            it: "Il pezzo sulla riga {1} e colonna {2} ha il lato impostato in modo errato ({3})",
            de: "Die Seite der Figur in Reihe {1}, Spalte {2} ist falsch angegeben ({3})",
        },
    },
    {
        pattern: /^Esse tipo de peça escolhido para casa da linha:(\S+) e coluna:(\S+) é inválido \((.*)\)$/, // names-check:ignore (Portuguese wire message the domain throws)
        texts: {
            en: "The chosen piece type for the square at row {1}, column {2} is invalid ({3})",
            fr: "Le type de pièce choisi pour la case de la ligne {1}, colonne {2} est invalide ({3})",
            it: "Il tipo di pezzo scelto per la casella alla riga {1} e colonna {2} non è valido ({3})",
            de: "Der gewählte Figurentyp für das Feld in Reihe {1}, Spalte {2} ist ungültig ({3})",
        },
    },
];

/** Fills a template text with the values captured from the Portuguese message. */
const fill = (text: string, values: readonly string[]): string =>
    text.replace(/\{(\d+)\}/g, (_match, index: string) => values[Number(index) - 1]);

/** Translates a message built from a template, or returns undefined when no template matches. */
export const translateTemplate = (message: string, locale: TranslatedLocale): string | undefined => {
    for (const template of MESSAGE_TEMPLATES) {
        const match = template.pattern.exec(message);
        if (match !== null) {
            return fill(template.texts[locale], match.slice(1));
        }
    }
    return undefined;
};
