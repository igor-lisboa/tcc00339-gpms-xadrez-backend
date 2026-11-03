import { describe, expect, it } from "vitest";
import { negotiateLocale } from "../../../src/http/i18n/locales";
import { translateMessage } from "../../../src/http/i18n/translateMessage";

describe("negotiateLocale", () => {
    it("Given no Accept-Language header, When negotiated, Then the answer is pt-BR", () => {
        expect(negotiateLocale(undefined)).toBe("pt-BR");
    });

    it("Given the languages the frontend sends, When negotiated, Then each maps to its locale", () => {
        expect(negotiateLocale("en")).toBe("en");
        expect(negotiateLocale("pt-BR")).toBe("pt-BR");
        expect(negotiateLocale("pt")).toBe("pt-BR");
        expect(negotiateLocale("fr")).toBe("fr");
        expect(negotiateLocale("it")).toBe("it");
        expect(negotiateLocale("de")).toBe("de");
    });

    it("Given a regional tag, When negotiated, Then its base language is used", () => {
        expect(negotiateLocale("fr-CH")).toBe("fr");
        expect(negotiateLocale("en-US")).toBe("en");
        expect(negotiateLocale("pt-PT")).toBe("pt-BR");
    });

    it("Given several languages with quality values, When negotiated, Then the highest quality supported one wins", () => {
        expect(negotiateLocale("de;q=0.5, en;q=0.9")).toBe("en");
        expect(negotiateLocale("es;q=0.9, it;q=0.8, en;q=0.7")).toBe("it");
    });

    it("Given a language the API does not support, When negotiated, Then the answer is pt-BR", () => {
        expect(negotiateLocale("es")).toBe("pt-BR");
        expect(negotiateLocale("*")).toBe("pt-BR");
        expect(negotiateLocale("constructor")).toBe("pt-BR");
    });

    it("Given a language refused with q=0, When negotiated, Then it is skipped", () => {
        expect(negotiateLocale("it;q=0, en;q=0.5")).toBe("en");
        expect(negotiateLocale("it;q=0")).toBe("pt-BR");
    });
});

describe("translateMessage", () => {
    it("Given a known message and English, When translated, Then the English text is returned", () => {
        expect(translateMessage("Jogo não encontrado", "en")).toBe("Game not found");
    });

    it("Given pt-BR, When translated, Then the message is unchanged", () => {
        expect(translateMessage("Jogo não encontrado", "pt-BR")).toBe("Jogo não encontrado");
    });

    it("Given a message with no translation, When translated, Then it is returned as it is", () => {
        expect(translateMessage("Tipo de jogo inexistente 42", "fr")).toBe("Tipo de jogo inexistente 42");
    });

    it("Given a message that is a property name of plain objects, When translated, Then it is returned as it is", () => {
        expect(translateMessage("constructor", "de")).toBe("constructor");
    });

    it("Given a draw already offered by a side, When translated, Then the side name is kept and the rest is translated", () => {
        expect(translateMessage("Já tem um empate proposto pelo lado Branco", "en")).toBe(
            "A draw has already been offered by the Branco side"
        );
    });

    it("Given a board refusal with coordinates, When translated, Then the values are kept in the translated text", () => {
        expect(translateMessage('Peça na casa da linha:2 e coluna:3 inválida (["X"])', "fr")).toBe(
            'La pièce de la ligne 2, colonne 3 est invalide (["X"])'
        );
    });

    it("Given a message with a template and pt-BR, When translated, Then it is unchanged", () => {
        expect(translateMessage("Já tem um reset proposto pelo lado Preto", "pt-BR")).toBe(
            "Já tem um reset proposto pelo lado Preto"
        );
    });
});
