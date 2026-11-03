import { Router } from "express";
import type { Catalog } from "../../domain/catalog";
import { PieceNames } from "../../domain/pieces/pieceNames";
import { success } from "../envelope";

const DOCUMENTATION_URL = "https://documenter.getpostman.com/view/15046943/TzJrByfx";

const GROUP_MEMBERS = [
    "Igor Lisbôa",
    "Caio Wey",
    "Victor Marques",
    "Victor Matheus",
    "Milena Verissimo",
    "Matheus Baldas",
];

/** Read-only lists and the welcome message. */
export const catalogRoutes = (catalog: Catalog): Router => {
    const router = Router();

    router.get("/", (_req, res) => {
        res.json(success("Olá, esse é nosso XADREZ!", { grupo: [...GROUP_MEMBERS].sort(), documentacao: DOCUMENTATION_URL }));
    });

    router.get("/tabela-equivalencia", (_req, res) => {
        res.json(success("Tabela de equivalência retornada com sucesso!", [...catalog.squares].reverse()));
    });

    router.get("/tipos-de-jogo", (_req, res) => {
        res.json(success("Tipos de jogo retornados com sucesso!", catalog.gameTypes));
    });

    router.get("/lados-do-jogo", (_req, res) => {
        res.json(success("Lados do jogo retornados com sucesso!", catalog.sides));
    });

    router.get("/tipos-de-jogador", (_req, res) => {
        res.json(success("Tipos de jogador retornados com sucesso!", catalog.playerTypes));
    });

    router.get("/tipos-de-peca", (_req, res) => {
        res.json(success("Tipos de peça retornados com sucesso!", catalog.pieceTypes));
    });

    router.get("/tipos-de-peca/promocao-peao", (_req, res) => {
        const choices = catalog.pieceTypes.filter((piece) => piece.nome !== PieceNames.King && piece.nome !== PieceNames.Pawn);
        res.json(success("Possíveis peças para promover um peão retornadas com sucesso!", choices));
    });

    return router;
};
