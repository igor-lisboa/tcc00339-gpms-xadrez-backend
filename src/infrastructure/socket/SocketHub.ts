import type { Server, Socket } from "socket.io";
import type { RequestedAction } from "../../domain/game/RequestedAction";
import type { Side } from "../../domain/game/Side";
import type { EventPublisher, GameEvent } from "../../application/ports/EventPublisher";
import type { AiListener } from "../../application/ports/AiListener";
import { sideMoveWire } from "../../http/presenters/movePresenter";
import { logger } from "../../shared/logger";

/** Identifier the AI player uses when it connects. */
const AI_IDENTIFIER = "I.A.";

interface ConnectedPlayer {
    readonly socketId: string;
    readonly identifier: string;
}

/**
 * Keeps the list of connected players and turns domain events into socket.io messages.
 * Players are identified by "<gameId>-<sideId>"; the AI player by "I.A.".
 * Event names and payloads are the ones the frontend already listens to.
 */
export class SocketHub implements EventPublisher {
    private players: ConnectedPlayer[] = [];
    private ai?: AiListener;

    constructor(private readonly io: Server) {}

    /** The AI player inside this process. It receives the events sent to the AI identifier. */
    attachAi(ai: AiListener): void {
        this.ai = ai;
    }

    /** Wires a new socket: records who it is, and forgets it when it disconnects. */
    connect(socket: Socket): void {
        const identifier = String(socket.handshake.query.jogador); // names-check:ignore (query key of the wire protocol)
        this.players.push({ socketId: socket.id, identifier });
        logger.info({ identifier }, "player connected");

        socket.on("disconnect", () => {
            this.players = this.players.filter((player) => player.socketId !== socket.id);
            logger.info({ identifier }, "player disconnected");
        });
    }

    publish(event: GameEvent): void {
        switch (event.type) {
            case "gameCreated":
                this.io.emit("jogoCriado");
                this.ai?.onEvent("jogoCriado");
                return;
            case "gameReset":
                this.sendTo(this.gameIdentifiers(event.gameId), "jogoResetado");
                return;
            case "gameFinished":
                this.sendTo(this.gameIdentifiers(event.gameId), "jogoFinalizado", {
                    jogoFinalizacao: event.ending,
                    ladoIdVencedor: event.winnerSideId,
                });
                return;
            case "playerJoined":
                this.sendTo(this.sideIdentifiers(event.gameId, event.opponent), "adversarioEntrou");
                return;
            case "moveMade":
                this.sendTo(this.sideIdentifiers(event.gameId, event.opponent), "jogadaRealizada", {
                    jogadaRealizada: sideMoveWire(event.played.move),
                    chequeLadoAtual: event.game.currentInCheck,
                    promocaoPara: event.promotion ? event.promotion.piece.type : null,
                });
                return;
            case "drawOffered":
                this.sendTo(this.sideIdentifiers(event.gameId, event.opponent), "empateProposto", {
                    jogoId: event.gameId,
                    ladoId: event.opponent.id,
                });
                return;
            case "drawAnswered":
                this.sendTo(this.sideIdentifiers(event.gameId, event.opponent), "empatePropostoResposta");
                return;
            case "resetOffered":
                this.sendTo(this.sideIdentifiers(event.gameId, event.opponent), "resetProposto", {
                    jogoId: event.gameId,
                    ladoId: event.opponent.id,
                });
                return;
            case "resetAnswered":
                this.sendTo(this.sideIdentifiers(event.gameId, event.opponent), "resetPropostoResposta", event.accepted);
                return;
            case "actionsRequested":
                event.actions.forEach((action) => this.sendAction(event.gameId, action, event.sides));
                return;
            case "aiForced":
                this.sendTo([AI_IDENTIFIER], "forcaIa");
                return;
        }
    }

    private sendAction(gameId: number, action: RequestedAction, sides: Side[]): void {
        const side = sides.find((candidate) => candidate.id === action.ladoId);
        const identifiers = [`${gameId}-${action.ladoId}`];
        if (side?.playerType && side.playerType.id !== 0) {
            identifiers.push(AI_IDENTIFIER);
        }
        this.sendTo(identifiers, action.acao, action.data);
    }

    /** Both players and the AI: used for events that concern the whole game. */
    private gameIdentifiers(gameId: number): string[] {
        return [`${gameId}-0`, `${gameId}-1`, AI_IDENTIFIER];
    }

    /** One side, plus the AI when that side is played by the AI. */
    private sideIdentifiers(gameId: number, side: Side): string[] {
        const identifiers = [`${gameId}-${side.id}`];
        if (side.playerType !== null && side.playerType.id !== 0) {
            identifiers.push(AI_IDENTIFIER);
        }
        return identifiers;
    }

    private sendTo(identifiers: string[], eventName: string, payload?: unknown): void {
        if (identifiers.includes(AI_IDENTIFIER)) {
            this.ai?.onEvent(eventName, payload);
        }
        this.players
            .filter((player) => identifiers.includes(player.identifier))
            .forEach((player) => {
                if (payload === undefined) {
                    this.io.to(player.socketId).emit(eventName);
                } else {
                    this.io.to(player.socketId).emit(eventName, payload);
                }
            });
    }
}
