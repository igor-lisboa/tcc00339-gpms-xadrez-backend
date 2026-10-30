import type { AiMove, AiRequest } from "../../application/aiCommands";

/** A legal move of an AI side, as the AI endpoints return it. */
export const aiMoveWire = (move: AiMove) => ({
    de: move.from,
    para: move.to,
    capturavel: move.isCapturable,
    captura: move.isCapture,
    nome: move.moveName,
    peca: move.pieceType,
    pecaAmeacadaNaPosicaoAtual: move.isThreatened,
});

/** A requested move, as the client sent it. */
export const aiRequestWire = (request: AiRequest) => ({
    jogoId: request.gameId,
    ladoId: request.sideId,
    casaOrigem: request.from,
    casaDestino: request.to,
});

/** Reads a requested move from the wire format. Missing values become NaN or undefined, as they always have. */
export const aiRequestFromWire = (body: Record<string, unknown>): AiRequest => ({
    gameId: Number(body.jogoId),
    sideId: Number(body.ladoId),
    from: String(body.casaOrigem),
    to: String(body.casaDestino),
});
