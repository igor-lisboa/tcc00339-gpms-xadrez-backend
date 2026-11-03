import de from "./messages/de";
import en from "./messages/en";
import fr from "./messages/fr";
import it from "./messages/it";
import type { Locale } from "./locales";
import { translateTemplate } from "./templates";

/** Portuguese message (the key) -> text in another language. */
export type MessageTable = Readonly<Record<string, string>>;

/** pt-BR has no table: the messages are already written in it. */
const TABLES: Partial<Record<Locale, MessageTable>> = { en, fr, it, de };

/**
 * Returns the message in the given language: first an exact match in the table,
 * then a template for messages with a value in them. Anything else is returned as it is.
 */
export const translateMessage = (message: string, locale: Locale): string => {
    if (locale === "pt-BR") {
        return message;
    }
    if (Object.hasOwn(TABLES[locale] ?? {}, message)) {
        return TABLES[locale]?.[message] ?? message;
    }
    return translateTemplate(message, locale) ?? message;
};
