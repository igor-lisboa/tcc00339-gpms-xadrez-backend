import type { Game } from "../domain/game/Game";
import type { Side } from "../domain/game/Side";
import type { Piece } from "../domain/pieces/Piece";
import type { PieceWithMoves } from "../domain/moves/rawMoves";
import type { PossibleMove } from "../domain/moves/possibleMoves";
import type { MoveRecord } from "../domain/moves/MoveRecord";
import type { Catalog } from "../domain/catalog";
import type { EventPublisher } from "./ports/EventPublisher";
import type { GameRepository } from "./ports/GameRepository";
import type { GameContext } from "./persistence";
import * as queries from "./gameQueries";
import * as commands from "./gameCommands";
import * as offers from "./offerCommands";
import * as ai from "./aiCommands";

export interface GameServiceDeps {
    readonly repository: GameRepository;
    readonly events: EventPublisher;
    readonly catalog: Catalog;
}

/**
 * The application's entry point for the HTTP layer. Each method is one use-case;
 * the work itself is in gameQueries, gameCommands and offerCommands.
 */
export class GameService {
    private readonly context: GameContext;

    constructor(deps: GameServiceDeps) {
        this.context = deps;
    }

    listGames(): Game[] {
        return queries.listGames(this.context);
    }

    getGame(gameId: number): Game {
        return queries.getGame(this.context, gameId);
    }

    getTurns(gameId: number) {
        return queries.getTurns(this.context, gameId);
    }

    getSides(gameId: number) {
        return queries.getSides(this.context, gameId);
    }

    getCurrentSide(gameId: number): Side {
        return queries.getCurrentSide(this.context, gameId);
    }

    getSidesWithoutPlayer(gameId: number): Side[] {
        return queries.getSidesWithoutPlayer(this.context, gameId);
    }

    getPiecesOfSide(gameId: number, sideId: number): PieceWithMoves[] {
        return queries.getPiecesOfSide(this.context, gameId, sideId);
    }

    getPossibleMovesOfPiece(gameId: number, sideId: number, squareName: string): PossibleMove[] {
        return queries.getPossibleMovesOfPiece(this.context, gameId, sideId, squareName);
    }

    getOpponentKing(gameId: number, sideId: number): PieceWithMoves | undefined {
        return queries.getOpponentKing(this.context, gameId, sideId);
    }

    createGame(input: commands.CreateGameInput): Game {
        return commands.createGame(this.context, input);
    }

    resetGame(gameId: number): Game {
        return commands.resetGame(this.context, gameId);
    }

    joinPlayer(gameId: number, sideId: number, playerTypeId: number): Side {
        return commands.joinPlayer(this.context, gameId, sideId, playerTypeId);
    }

    leaveSide(gameId: number, sideId: number): Side {
        return commands.leaveSide(this.context, gameId, sideId);
    }

    makeMove(gameId: number, sideId: number, from: string, to: string): MoveRecord {
        return commands.makeMove(this.context, gameId, sideId, from, to);
    }

    choosePromotion(gameId: number, sideId: number, pieceTypeId: number): Piece {
        return commands.choosePromotion(this.context, gameId, sideId, pieceTypeId);
    }

    proposeDraw(gameId: number, sideId: number): void {
        offers.proposeDraw(this.context, gameId, sideId);
    }

    answerDraw(gameId: number, sideId: number, accepted: boolean): void {
        offers.answerDrawOffer(this.context, gameId, sideId, accepted);
    }

    proposeReset(gameId: number, sideId: number): void {
        offers.proposeReset(this.context, gameId, sideId);
    }

    answerReset(gameId: number, sideId: number, accepted: boolean): void {
        offers.answerResetOffer(this.context, gameId, sideId, accepted);
    }

    listAiGames() {
        return ai.listAiGames(this.context);
    }

    aiSidesOf(gameId: number) {
        return ai.aiSidesOf(this.context, gameId);
    }

    playAiTurns() {
        return ai.playAiTurns(this.context);
    }

    runAiMoves(requested: ai.AiRequest[]) {
        return ai.runMoves(this.context, requested);
    }

    aiPromote(gameId: number, sideId: number): Piece {
        return ai.aiPromote(this.context, gameId, sideId);
    }

    forceAi(): void {
        this.context.events.publish({ type: "aiForced" });
    }
}
