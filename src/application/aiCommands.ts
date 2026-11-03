import { DomainError } from "../domain/DomainError";
import { chooseAiMove, squareDistance, type AiOption } from "../domain/ai/chooseAiMove";
import type { Game } from "../domain/game/Game";
import type { Side } from "../domain/game/Side";
import type { MoveRecord } from "../domain/moves/MoveRecord";
import { legalMovesOf } from "../domain/moves/legality";
import type { Piece } from "../domain/pieces/Piece";
import { PieceNames } from "../domain/pieces/pieceNames";
import { GameType, PlayerType } from "../shared/constants";
import { listGames } from "./gameQueries";
import { choosePromotion, makeMove } from "./gameCommands";
import { loadGame, type GameContext } from "./persistence";

/** A legal move of an AI side, with the threat flag the AI's choice uses. */
export interface AiMove {
    readonly from: string;
    readonly to: string;
    readonly isCapturable: boolean;
    readonly isCapture: boolean;
    readonly moveName: string | null;
    readonly pieceType: string;
    readonly isThreatened: boolean;
}

export interface AiSideView {
    readonly side: Side;
    readonly moves: AiMove[];
}

/** A move asked for by the AI player or by a client. */
export interface AiRequest {
    readonly gameId: number;
    readonly sideId: number;
    readonly from: string;
    readonly to: string;
}

export interface AiRunResult {
    readonly executed: { readonly gameId: number; readonly sideId: number; readonly move: MoveRecord }[];
    readonly failed: { readonly gameId: number; readonly sideId: number; readonly error: string; readonly request: AiRequest }[];
}

const isAiGame = (game: Game): boolean =>
    (game.gameType.id === GameType.HumanVsAi || game.gameType.id === GameType.AiVsAi) && game.ending === null;

/** Unfinished games that have at least one AI side. */
export const listAiGames = (context: GameContext): { game: Game; sides: AiSideView[] }[] =>
    listGames(context)
        .filter(isAiGame)
        .map((stored) => {
            const game = loadGame(context, stored.id ?? -1);
            return { game, sides: aiSidesOf(context, game.id ?? -1) };
        });

/** The AI sides of a game, each with its legal moves and the threat flag. */
export const aiSidesOf = (context: GameContext, gameId: number): AiSideView[] => {
    const game = loadGame(context, gameId);
    return game
        .sides()
        .filter((side) => side.playerType?.id === PlayerType.Ai)
        .map((side) => ({ side, moves: aiMovesOf(game, side.id) }));
};

const aiMovesOf = (game: Game, sideId: number): AiMove[] => {
    const opponentTargets = new Set(consolidated(game, game.opponentOf(sideId).id).map((move) => move.to));
    return consolidated(game, sideId).map((move) => ({
        ...move,
        isThreatened: opponentTargets.has(move.from),
    }));
};

const consolidated = (game: Game, sideId: number): Omit<AiMove, "isThreatened">[] =>
    legalMovesOf(game.position(), sideId, game.sideById(sideId).possibleMoves).map((move) => ({
        from: move.from.name,
        to: move.to.name,
        isCapturable: move.isCapturable,
        isCapture: move.isCapture,
        moveName: move.moveName,
        pieceType: move.pieceType,
    }));

/** One AI move for the side on turn in every AI game. */
export const playAiTurns = (context: GameContext): AiRunResult => {
    const requests: AiRequest[] = [];
    listAiGames(context).forEach(({ game, sides }) => {
        const view = sides.find((candidate) => candidate.side.id === game.currentSideId);
        if (view === undefined) {
            return;
        }
        const choice = chooseAiMove(toOptions(game, view));
        if (choice !== undefined) {
            requests.push({ gameId: game.id ?? -1, sideId: view.side.id, from: choice.from, to: choice.to });
        }
    });
    return runMoves(context, requests);
};

const toOptions = (game: Game, view: AiSideView): AiOption[] => {
    const king = game.opponentKingOf(view.side.id);
    if (king === undefined) {
        throw new DomainError("Rei do adversário não encontrado");
    }
    const kingSquare = king.square.name;
    return view.moves.map((move) => ({
        from: move.from,
        to: move.to,
        moveName: move.moveName,
        pieceType: move.pieceType,
        isThreatened: move.isThreatened,
        isCapturable: move.isCapturable,
        isCapture: move.isCapture,
        distanceFrom: squareDistance(move.from, kingSquare),
        distanceTo: squareDistance(move.to, kingSquare),
    }));
};

/** Plays the given moves one by one. Failures are reported per move; any failure asks the AI to run again. */
export const runMoves = (context: GameContext, requests: AiRequest[]): AiRunResult => {
    const executed: AiRunResult["executed"][number][] = [];
    const failed: AiRunResult["failed"][number][] = [];

    requests.forEach((request) => {
        try {
            const move = makeMove(context, request.gameId, request.sideId, request.from, request.to);
            executed.push({ gameId: request.gameId, sideId: request.sideId, move });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            failed.push({ gameId: request.gameId, sideId: request.sideId, error: message, request });
        }
    });

    if (failed.length > 0) {
        context.events.publish({ type: "aiForced" });
    }
    return { executed, failed };
};

/** The AI picks one of the pieces a pawn may become. */
export const aiPromote = (context: GameContext, gameId: number, sideId: number): Piece => {
    const choices = context.catalog.pieceTypes.filter(
        (piece) => piece.nome !== PieceNames.King && piece.nome !== PieceNames.Pawn
    );
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    return choosePromotion(context, gameId, sideId, chosen.id);
};
