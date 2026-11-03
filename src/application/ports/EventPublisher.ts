import type { Game } from "../../domain/game/Game";
import type { PlayedMove } from "../../domain/game/playMove";
import type { PromotedPawn } from "../../domain/game/promotePawn";
import type { RequestedAction } from "../../domain/game/RequestedAction";
import type { Side } from "../../domain/game/Side";

/** Something that happened, described without any transport detail. The socket adapter decides who hears it. */
export type GameEvent =
    | { readonly type: "gameCreated" }
    | { readonly type: "gameReset"; readonly gameId: number }
    | { readonly type: "gameFinished"; readonly gameId: number; readonly ending: string; readonly sides: Side[] }
    | { readonly type: "playerJoined"; readonly gameId: number; readonly opponent: Side }
    | { readonly type: "moveMade"; readonly gameId: number; readonly played: PlayedMove; readonly game: Game; readonly promotion: PromotedPawn | null; readonly opponent: Side }
    | { readonly type: "drawOffered"; readonly gameId: number; readonly opponent: Side }
    | { readonly type: "drawAnswered"; readonly gameId: number; readonly opponent: Side; readonly accepted: boolean }
    | { readonly type: "resetOffered"; readonly gameId: number; readonly opponent: Side }
    | { readonly type: "resetAnswered"; readonly gameId: number; readonly opponent: Side; readonly accepted: boolean }
    | { readonly type: "actionsRequested"; readonly gameId: number; readonly actions: RequestedAction[]; readonly sides: Side[] }
    | { readonly type: "aiForced" };

export interface EventPublisher {
    publish(event: GameEvent): void;
}
