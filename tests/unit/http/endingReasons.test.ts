import { describe, expect, it } from "vitest";
import { endingReasonWire } from "../../../src/http/presenters/catalogPresenter";
import { EndingReason } from "../../../src/shared/constants";

/** The values the frontend reads from motivoFinalizacao, in the order it lists them. */
const FRONTEND_REASONS = [
    "xequeMate",
    "tempoEsgotado",
    "desistencia",
    "reiAfogado",
    "comumAcordo",
    "regra50Movimentos",
    "regra75Movimentos",
    "repeticao3Posicoes",
    "repeticao5Posicoes",
    "insuficienciaMaterial",
    "posicaoMorta",
];

describe("motivoFinalizacao wire values", () => {
    it("Given every reason the domain can record, When sent, Then its value is one the frontend lists", () => {
        Object.values(EndingReason).forEach((reason) => {
            expect(FRONTEND_REASONS).toContain(endingReasonWire(reason));
        });
    });

    it("Given the domain reasons, When sent, Then each frontend value is produced by exactly one reason", () => {
        const sent = Object.values(EndingReason).map((reason) => endingReasonWire(reason));
        expect([...sent].sort()).toEqual([...FRONTEND_REASONS].sort());
    });

    it("Given a running game with no reason, When sent, Then the value is null, not a text", () => {
        expect(endingReasonWire(null)).toBeNull();
    });
});
