import { Router } from "express";
import type { GameService } from "../../application/GameService";
import type { AiRequest, AiRunResult, AiSideView } from "../../application/aiCommands";
import { gameWire, sideWire } from "../presenters/gamePresenter";
import { pieceWire, sideMoveWire } from "../presenters/movePresenter";
import { aiMoveWire, aiRequestFromWire, aiRequestWire } from "../presenters/aiPresenter";
import { sideIdFromHeader, success } from "../envelope";

const aiViewWire = (view: AiSideView) => ({
    lado: sideWire(view.side),
    possiveisJogadas: view.moves.map(aiMoveWire),
});

const runResultWire = (result: AiRunResult) => ({
    jogadasExecutadas: result.executed.map((executed) => ({
        jogoId: executed.gameId,
        ladoId: executed.sideId,
        jogada: sideMoveWire(executed.move),
    })),
    jogadasErros: result.failed.map((failure) => ({
        jogoId: failure.gameId,
        ladoId: failure.sideId,
        erro: failure.error,
        jogadaSolicitada: aiRequestWire(failure.request),
    })),
});

/** AI routes. They must be mounted before the game routes, because "/jogos/ia" would otherwise match "/jogos/:jogoId". */
export const aiRoutes = (service: GameService): Router => {
    const router = Router();

    router.get("/jogos/ia", (_req, res) => {
        const games = service.listAiGames().map(({ game, sides }) => ({
            jogo: gameWire(game),
            ladosIa: sides.map(aiViewWire),
        }));
        res.json(success("Contexto dos Jogos que possuem jogadores I.A. retornados com sucesso!", games));
    });

    router.post("/jogos/ia", (req, res) => {
        const requests: AiRequest[] = (req.body?.jogadas ?? []).map(aiRequestFromWire);
        const result = service.runAiMoves(requests);
        res.json(success("Jogadas solicitadas pela I.A. executadas com sucesso!", runResultWire(result)));
    });

    router.post("/jogos/ia/executa", (_req, res) => {
        const result = service.playAiTurns();
        res.json(success("Jogadas da I.A. executadas com sucesso!", runResultWire(result)));
    });

    router.post("/jogos/:jogoId/ia/promove-peao", (req, res) => {
        const piece = service.aiPromote(Number(req.params.jogoId), sideIdFromHeader(req.headers.lado));
        res.json(success("Peão promovido com sucesso!", pieceWire(piece)));
    });

    router.get("/jogos/:jogoId/ias", (req, res) => {
        const views = service.aiSidesOf(Number(req.params.jogoId));
        res.json(success("I.A.s do jogo retornadas com sucesso!", views.map(aiViewWire)));
    });

    router.get("/ia", (_req, res) => {
        service.forceAi();
        res.json(success("Tentativa de forçar a I.A. a executar executada com sucesso!", null));
    });

    return router;
};
