const express = require("express");

const JogoController = require("./controllers/JogoController");
const JogoJogadorController = require("./controllers/JogoJogadorController");
const JogoPecaController = require("./controllers/JogoPecaController");
const LadosJogoController = require("./controllers/LadosJogoController");
const TabelaEquivalenciaController = require("./controllers/TabelaEquivalenciaController");
const TiposJogadorController = require("./controllers/TiposJogadorController");
const TiposJogoController = require("./controllers/TiposJogoController");
const TiposPecaController = require("./controllers/TiposPecaController");

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
            documentacao: "https://documenter.getpostman.com/view/15046943/TzCQaRvP"
        },
        success: true
    });
});

routes.get("/jogos", JogoController.lista);
routes.post("/jogos", JogoController.cria);
routes.get("/jogos/ia", JogoController.listaIa);
routes.post("/jogos/ia", JogoController.executaJogadasIa);
routes.get("/jogos/:jogoId", JogoController.encontra);
routes.get("/jogos/:jogoId/ias", JogoController.recuperaLadosIa);
routes.get("/jogos/:jogoId/lado-atual", JogoController.recuperaLadoAtual);
routes.get("/jogos/:jogoId/lado-sem-jogador", JogoJogadorController.recuperaLadosSemJogador);
routes.get("/jogos/:jogoId/rei-adversario", JogoController.recuperaPecaReiAdversario);
routes.get("/jogos/:jogoId/pecas", JogoPecaController.lista);
routes.get("/jogos/:jogoId/pecas/:casaNome/possiveis-jogadas", JogoPecaController.possiveisJogadas);
routes.post("/jogos/:jogoId/pecas/:casaOrigem/move/:casaDestino", JogoPecaController.realizaJogada);
routes.post("/jogos/:jogoId/jogadores", JogoJogadorController.insereJogador);
routes.delete("/jogos/:jogoId/jogadores/:ladoId", JogoJogadorController.removeJogador);
routes.get("/tabela-equivalencia", TabelaEquivalenciaController.lista);
routes.get("/tipos-de-jogo", TiposJogoController.lista);
routes.get("/lados-do-jogo", LadosJogoController.lista);
routes.get("/tipos-de-jogador", TiposJogadorController.lista);
routes.get("/tipos-de-peca", TiposPecaController.lista);
routes.get("/ia", JogoController.forcaIa);

module.exports = routes;