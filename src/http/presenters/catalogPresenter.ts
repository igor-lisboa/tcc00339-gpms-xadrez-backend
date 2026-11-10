import type { EndingInfo } from "../../domain/catalog";
import { RequestedActionNames } from "../../domain/game/RequestedAction";
import { MoveNames } from "../../domain/pieces/pieceNames";
import { GameEnding, Side } from "../../shared/constants";
import { DIRECTION_NAMES } from "./sidePresenter";

/**
 * Lookup values the frontend reads to understand the API: the endings (with their category and the
 * side that wins), and the names of requested actions, move names and directions.
 */

type EndingCategory = "vitoria" | "empate" | "desistencia";

const ENDING_CATEGORY: Record<GameEnding, EndingCategory> = {
    [GameEnding.WhiteWins]: "vitoria",
    [GameEnding.BlackWins]: "vitoria",
    [GameEnding.FiftyMoveRule]: "empate",
    [GameEnding.InsufficientMaterial]: "empate",
    [GameEnding.Stalemate]: "empate",
    [GameEnding.MutualAgreement]: "empate",
    [GameEnding.ThreefoldRepetition]: "empate",
    [GameEnding.Resignation]: "desistencia",
    [GameEnding.TimeoutDraw]: "empate",
    [GameEnding.FivefoldRepetition]: "empate",
    [GameEnding.SeventyFiveMoveRule]: "empate",
    [GameEnding.DeadPosition]: "empate",
};

/** The side that wins, for the endings that always name one. A resignation's winner is on the game itself (ladoIdVencedor). */
const WINNING_SIDE: Partial<Record<GameEnding, Side>> = {
    [GameEnding.WhiteWins]: Side.White,
    [GameEnding.BlackWins]: Side.Black,
};

export const endingTypeWire = (ending: EndingInfo) => ({
    id: ending.id,
    tipo: ending.tipo,
    categoria: ENDING_CATEGORY[ending.id as GameEnding],
    ladoIdVencedor: WINNING_SIDE[ending.id as GameEnding] ?? null,
});

/** The names used on the wire. Move names may be null (a plain move), as in the MoveRecord of a move. */
export const enumsWire = () => ({
    acoesSolicitadas: Object.values(RequestedActionNames),
    nomesJogada: [...Object.values(MoveNames), null],
    direcoes: Object.values(DIRECTION_NAMES),
});
