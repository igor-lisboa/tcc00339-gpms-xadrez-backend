import type { Side } from "../../domain/game/Side";
import type { Turn } from "../../domain/game/Turn";
import type { PossibleMove } from "../../domain/moves/possibleMoves";
import type { PieceWithMoves } from "../../domain/moves/rawMoves";
import { pieceWire, sideMoveWire, squareWire } from "./movePresenter";

/** The JSON shape of a turn and of a side, and of the moves a side can make. Names are the ones the frontend expects. */

export const turnWire = (turn: Turn) => ({
    ladoId: turn.sideId,
    momentoInicio: turn.startedAtMs,
    momentoFim: turn.endedAtMs,
    totalMilisegundos: turn.totalMs,
});

export const sideWire = (side: Side) => ({
    id: side.id,
    lado: side.name,
    cabecaPraBaixo: side.headDown,
    jogadasRealizadas: side.performedMoves.map(sideMoveWire),
    tipo: side.playerType === null ? null : { id: side.playerType.id, nome: side.playerType.nome },
    tempoMilisegundosRestante: side.remainingMs,
    possiveisJogadas: side.possibleMoves.map(possibleMoveWire),
    pecas: side.pieces.map(pieceOnSquareWire),
});

export const possibleMoveWire = (move: PossibleMove) => ({
    casaOrigem: squareWire(move.from),
    casaDestino: squareWire(move.to),
    nome: move.moveName,
    peca: move.pieceType,
    pecaValor: move.pieceValue,
    pecaCaptura: move.capturedPiece === null ? null : pieceWire(move.capturedPiece),
    capturantes: move.attackers.map((attacker) => ({
        casaOrigem: squareWire(attacker.from),
        casaDestino: squareWire(attacker.to),
        nomeJogada: attacker.moveName,
        podeCapturavel: attacker.mayEnterAttackedSquare,
        pecaCaptura: attacker.capturedPiece === null ? null : pieceWire(attacker.capturedPiece),
        captura: attacker.canCapture,
        anda: attacker.canMove,
        peca: attacker.pieceType,
        pecaValor: attacker.pieceValue,
    })),
    capturavel: move.isCapturable,
    captura: move.isCapture,
});

export const pieceOnSquareWire = (entry: PieceWithMoves) => ({
    casa: entry.square.name,
    linha: entry.square.linha,
    coluna: entry.square.coluna,
    peca: pieceWire(entry.piece),
    movimentosPossiveis: entry.candidates.map((candidate) => ({
        casaDestino: squareWire(candidate.to),
        nomeJogada: candidate.moveName,
        direcao: legacyDirection(candidate.direction),
        anda: candidate.canMove,
        captura: candidate.canCapture,
        podeCapturavel: candidate.mayEnterAttackedSquare,
        casas: candidate.steps,
    })),
});

const DIRECTION_NAMES: Record<string, string> = {
    forward: "frente",
    backward: "tras",
    left: "esquerda",
    right: "direita",
    forwardLeft: "frenteEsquerda",
    forwardRight: "frenteDireita",
    backwardLeft: "trasEsquerda",
    backwardRight: "trasDireita",
    special: "especial",
};

const legacyDirection = (direction: string): string => DIRECTION_NAMES[direction];
