const express = require("express");

const JogoController = require("./controllers/JogoController");
const JogoJogadorController = require("./controllers/JogoJogadorController");
const JogoPecaController = require("./controllers/JogoPecaController");
const LadosJogoController = require("./controllers/LadosJogoController");
const TabelaEquivalenciaController = require("./controllers/TabelaEquivalenciaController");
const TiposJogadorController = require("./controllers/TiposJogadorController");
const TiposJogoController = require("./controllers/TiposJogoController");

const routes = express.Router();

routes.get("/", (req, res) => {
    return res.json({
        message: "Olá, esse é nosso XADREZ!",
        data: {
            grupo: [
                "Igor Lisboa",
                "Caio Wey",
                "Victor Marques",
                "Victor Matheus",
                "Milena Verissimo",
                "Matheus Baldas"
            ].sort(),
            documentacao: "https://documenter.getpostman.com/view/13081554/Tz5m8KPR"
        },
        success: true
    });
});

routes.get("/jogos", JogoController.index);
routes.get("/jogos/ia", JogoController.indexIa);
routes.get("/jogos/:jogoId", JogoController.find);
routes.post("/jogos", JogoController.create);

routes.get("/jogos/:jogoId/lado-atual", JogoController.recuperaLadoAtual);
routes.get("/jogos/:jogoId/ias", JogoController.recuperaLadosIa);
routes.get("/jogos/:jogoId/rei-adversario", JogoController.recuperaPecaReiAdversario);

routes.get("/jogos/:jogoId/pecas", JogoPecaController.index);
routes.get("/jogos/:jogoId/pecas/:casaNome/possiveis-jogadas", JogoPecaController.possiveisJogadas);
routes.post("/jogos/:jogoId/pecas/:casaOrigem/move/:casaDestino", JogoPecaController.realizaJogada);

routes.post("/jogos/:jogoId/jogadores", JogoJogadorController.insereJogador);

routes.get("/tabela-equivalencia", TabelaEquivalenciaController.index);

routes.get("/tipos-de-jogo", TiposJogoController.index);
routes.get("/lados-do-jogo", LadosJogoController.index);
routes.get("/tipos-de-jogador", TiposJogadorController.index);

module.exports = routes;