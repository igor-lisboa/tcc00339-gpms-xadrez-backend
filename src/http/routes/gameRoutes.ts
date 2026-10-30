import { Router, type Request } from "express";
import type { GameService } from "../../application/GameService";
import { pieceWire, sideMoveWire } from "../presenters/movePresenter";
import { gameWire, pieceOnSquareWire, possibleMoveWire, sideWire, summaryWire, turnWire } from "../presenters/gamePresenter";
import { sideIdFromHeader, success } from "../envelope";

const sideOf = (req: Request): number => sideIdFromHeader(req.headers.lado);
const gameIdOf = (req: Request): number => Number(req.params.jogoId);

/** The flag for the summary view. Only the literal "true" (any case) counts; this is kept from the API's history. */
const parseSuperSimplified = (value: unknown): boolean => {
    if (value === undefined) {
        return false;
    }
    if (typeof value === "string") {
        const parsed: unknown = JSON.parse(value.toLowerCase());
        return typeof parsed === "boolean" ? parsed : false;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return false;
};

/** Game routes. Order matters: "/jogos/ia" must be declared before "/jogos/:jogoId". */
export const gameRoutes = (service: GameService): Router => {
    const router = Router();

    router.get("/jogos", (_req, res) =>
        res.json(success("Jogos retornados com sucesso!", service.listGames().map(gameWire)))
    );

    router.post("/jogos", (req, res) => {
        const body = req.body ?? {};
        const game = service.createGame({
            tipoJogo: body.tipoJogo,
            tempoDeTurnoEmMilisegundos: body.tempoDeTurnoEmMilisegundos,
            tabuleiroCasas: body.tabuleiroCasas,
            ladoId: body.ladoId,
        });
        res.json(success("Jogo incluído com sucesso!", gameWire(game)));
    });

    router.get("/jogos/:jogoId", (req, res) => {
        const game = service.getGame(gameIdOf(req));
        res.json(success("Jogo retornado com sucesso!", gameWire(game)));
    });

    router.get("/jogos/:jogoId/simples", (req, res) => {
        const superSimplified = parseSuperSimplified(req.query.tabuleiroSuperSimplificado);
        const game = service.getGame(gameIdOf(req));
        res.json(success("Jogo simplificado retornado com sucesso!", summaryWire(game, superSimplified)));
    });

    router.get("/jogos/:jogoId/turnos", (req, res) => {
        const turns = service.getTurns(gameIdOf(req));
        res.json(success("Turnos do Jogo retornados com sucesso!", turns.map(turnWire)));
    });

    router.get("/jogos/:jogoId/lados", (req, res) => {
        const sides = service.getSides(gameIdOf(req));
        res.json(success("Lados do Jogo retornados com sucesso!", { branco: sideWire(sides.white), preto: sideWire(sides.black) }));
    });

    router.put("/jogos/:jogoId/reset", (req, res) => {
        const game = service.resetGame(gameIdOf(req));
        res.json(success("Jogo resetado com sucesso!", gameWire(game)));
    });

    router.put("/jogos/:jogoId/reset/propoe", (req, res) => {
        service.proposeReset(gameIdOf(req), sideOf(req));
        res.json(success("Reset proposto ao lado adversário com sucesso!", null));
    });

    router.post("/jogos/:jogoId/reset/responde", (req, res) => {
        const resposta = Boolean(req.body?.resposta);
        service.answerReset(gameIdOf(req), sideOf(req), resposta);
        res.json(success("Reset proposto respondido com sucesso!", { resposta: req.body?.resposta }));
    });

    router.put("/jogos/:jogoId/empate/propoe", (req, res) => {
        service.proposeDraw(gameIdOf(req), sideOf(req));
        res.json(success("Empate proposto ao lado adversário com sucesso!", null));
    });

    router.post("/jogos/:jogoId/empate/responde", (req, res) => {
        const resposta = Boolean(req.body?.resposta);
        service.answerDraw(gameIdOf(req), sideOf(req), resposta);
        res.json(success("Empate proposto respondido com sucesso!", { resposta: req.body?.resposta }));
    });

    router.post("/jogos/:jogoId/promove-peao/:pecaIdEscolhida", (req, res) => {
        const piece = service.choosePromotion(gameIdOf(req), sideOf(req), Number(req.params.pecaIdEscolhida));
        res.json(success("Peão promovido com sucesso!", pieceWire(piece)));
    });

    router.get("/jogos/:jogoId/lado-atual", (req, res) => {
        const side = service.getCurrentSide(gameIdOf(req));
        res.json(success("Lado atual do jogo retornado com sucesso!", sideWire(side)));
    });

    router.get("/jogos/:jogoId/lado-sem-jogador", (req, res) => {
        const sides = service.getSidesWithoutPlayer(gameIdOf(req));
        res.json(success("Lados que estão sem jogador retornados com sucesso!", sides.map(sideWire)));
    });

    router.get("/jogos/:jogoId/rei-adversario", (req, res) => {
        const king = service.getOpponentKing(gameIdOf(req), sideOf(req));
        res.json(success("Rei do jogador adversário retornado com sucesso!", king ? pieceOnSquareWire(king) : undefined));
    });

    router.get("/jogos/:jogoId/pecas", (req, res) => {
        const pieces = service.getPiecesOfSide(gameIdOf(req), sideOf(req));
        res.json(success("Peças retornadas com sucesso!", pieces.map(pieceOnSquareWire)));
    });

    router.get("/jogos/:jogoId/pecas/:casaNome/possiveis-jogadas", (req, res) => {
        const moves = service.getPossibleMovesOfPiece(gameIdOf(req), sideOf(req), req.params.casaNome);
        res.json(success("Possíveis jogadas da peça na casa informada retornadas com sucesso!", moves.map(possibleMoveWire)));
    });

    router.post("/jogos/:jogoId/pecas/:casaOrigem/move/:casaDestino", (req, res) => {
        const move = service.makeMove(gameIdOf(req), sideOf(req), req.params.casaOrigem, req.params.casaDestino);
        res.json(success("Jogada realizada com sucesso!", sideMoveWire(move)));
    });

    router.post("/jogos/:jogoId/jogadores", (req, res) => {
        const side = service.joinPlayer(gameIdOf(req), Number(req.body?.ladoId), Number(req.body?.tipoId));
        res.json(success("Definições do jogador atualizadas com sucesso!", sideWire(side)));
    });

    router.delete("/jogos/:jogoId/jogadores/:ladoId", (req, res) => {
        const side = service.leaveSide(gameIdOf(req), Number(req.params.ladoId));
        res.json(success("Desistência do jogador realizada com sucesso!", sideWire(side)));
    });

    return router;
};
