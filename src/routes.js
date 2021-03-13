const express = require("express");

const JogoController = require("./controllers/JogoController");
const JogoPecaController = require("./controllers/JogoPecaController");
const TabelaEquivalenciaController = require("./controllers/TabelaEquivalenciaController");
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
routes.get("/jogos/:id", JogoController.find);
routes.post("/jogos", JogoController.create);

routes.get("/jogos/:jogoId/pecas/:casaNome/possiveis-jogadas", JogoPecaController.possiveisJogadas);
routes.get("/jogos/:jogoId/pecas/:casaOrigem/move/:casaDestino", JogoPecaController.realizaJogada);


routes.get("/tabela-equivalencia", TabelaEquivalenciaController.index);

routes.get("/tipos-de-jogo", TiposJogoController.index);

module.exports = routes;