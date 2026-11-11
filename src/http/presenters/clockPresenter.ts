import type { GameClocks } from "../../domain/game/clock";

/**
 * The clock fields of a game: the time each side has left and the time it has used, in milliseconds.
 * remaining is null when the game has no time limit. The same fields go on the game, its summary and the
 * socket events that change the clocks, so a client reads them the same way everywhere.
 */
export const clocksWire = (clocks: GameClocks) => ({
    ladoBrancoTempoMilisegundosRestante: clocks.white.remainingMs,
    ladoBrancoTempoMilisegundosGasto: clocks.white.spentMs,
    ladoPretoTempoMilisegundosRestante: clocks.black.remainingMs,
    ladoPretoTempoMilisegundosGasto: clocks.black.spentMs,
});
