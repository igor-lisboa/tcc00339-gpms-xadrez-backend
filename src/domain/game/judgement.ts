import { GameEnding } from "../../shared/constants";
import { isInsufficientMaterial } from "../rules/material";
import type { Game } from "./Game";
import type { Side } from "./Side";
import { checkClocks, startTurn } from "./clock";

/** Sets whose turn it is, starting a new turn if the side changed. Judges the position for the new side. */
export const defineCurrentSide = (game: Game, sideId: number): void => {
    game.currentSideId = sideId;
    const last = game.turns.at(-1);
    if (last !== undefined && last.sideId !== sideId) {
        last.end();
        startTurn(game);
    }
    game.refresh();
    if (isInsufficientMaterial(piecesOf(game.white), piecesOf(game.black))) {
        game.finish(GameEnding.InsufficientMaterial);
    }
    judgeSide(game, sideId);
};

/** Recomputes the check flag and the clocks, as a read of the game needs. */
export const refreshForRead = (game: Game): void => {
    game.refresh();
    game.currentInCheck = game.isKingAttacked(game.currentSideId);
    checkClocks(game);
};

/** Detects threefold repetition and insufficient material after a move. */
export const judgeAfterMove = (game: Game): void => {
    if (game.board.isThreefoldRepetition()) {
        game.finish(GameEnding.ThreefoldRepetition);
    }
    if (isInsufficientMaterial(piecesOf(game.white), piecesOf(game.black))) {
        game.finish(GameEnding.InsufficientMaterial);
    }
};

/** Checkmate or stalemate for the side on the move. */
const judgeSide = (game: Game, sideId: number): void => {
    game.currentInCheck = game.isKingAttacked(sideId);
    if (sideId !== game.currentSideId || game.legalMovesOf(sideId).length > 0) {
        return;
    }
    if (!game.currentInCheck) {
        game.finish(GameEnding.Stalemate);
    } else {
        game.finish(sideId === game.white.id ? GameEnding.BlackWins : GameEnding.WhiteWins);
    }
};

const piecesOf = (side: Side) => side.pieces.map((entry) => entry.piece);
