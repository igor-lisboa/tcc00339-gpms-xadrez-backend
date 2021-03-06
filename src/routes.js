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
                "Igor Lisbôa",
                "Caio Wey",
                "Victor Marques",
                "Victor Matheus",
                "Milena Verissimo",
                "Matheus Baldas"
            ].sort(),
            documentacao: "https://documenter.getpostman.com/view/15046943/TzJrByfx"
        },
        success: true
    });
});

routes.get("/jogos", JogoController.lista);
routes.post("/jogos", JogoController.cria);
routes.get("/jogos/ia", JogoController.listaIa);
routes.post("/jogos/ia", JogoController.executaJogadasIa);
routes.post("/jogos/ia/executa", JogoController.executaJogadasIaAlone);
routes.post("/jogos/:jogoId/ia/promove-peao", JogoController.iaPromovePeao);
routes.get("/jogos/:jogoId", JogoController.encontra);
routes.get("/jogos/:jogoId/simples", JogoController.encontraSimples);
routes.get("/jogos/:jogoId/turnos", JogoController.recuperaTurnos);
routes.get("/jogos/:jogoId/lados", JogoController.recuperaLados);
routes.put("/jogos/:jogoId/reset", JogoController.reset);
routes.put("/jogos/:jogoId/reset/propoe", JogoController.propoeReset);
routes.post("/jogos/:jogoId/reset/responde", JogoController.respondePropostaReset);
routes.put("/jogos/:jogoId/empate/propoe", JogoController.propoeEmpate);
routes.post("/jogos/:jogoId/empate/responde", JogoController.respondePropostaEmpate);
routes.post("/jogos/:jogoId/promove-peao/:pecaIdEscolhida", JogoController.promovePeao);
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
routes.get("/tipos-de-peca/promocao-peao", TiposPecaController.listaPromocaoPeao);
routes.get("/ia", JogoController.forcaIa);

module.exports = routes;