const JogoService = require("../services/JogoService");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Jogos retornados com sucesso!",
                data: JogoService.lista(),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    encontra(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "Jogo retornado com sucesso!",
                data: JogoService.encontra(jogoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    encontraSimples(req, res) {
        try {
            const { jogoId } = req.params;
            let { tabuleiroSuperSimplificado } = req.query;
            // valida string passada na query
            if (tabuleiroSuperSimplificado == undefined) {
                tabuleiroSuperSimplificado = false;
            } else if (typeof tabuleiroSuperSimplificado == "string") {
                tabuleiroSuperSimplificado = JSON.parse(tabuleiroSuperSimplificado.toLowerCase());
            } else if (typeof tabuleiroSuperSimplificado == "number") {
                if (tabuleiroSuperSimplificado == 0) {
                    tabuleiroSuperSimplificado = false;
                } else {
                    tabuleiroSuperSimplificado = true;
                }
            }
            // se apos validacoes o tipo n for boolean define false
            if (typeof tabuleiroSuperSimplificado != "boolean") {
                tabuleiroSuperSimplificado = false;
            }

            return res.json({
                message: "Jogo simplificado retornado com sucesso!",
                data: JogoService.encontraSimples(jogoId, tabuleiroSuperSimplificado),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    recuperaTurnos(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "Turnos do Jogo retornados com sucesso!",
                data: JogoService.recuperaTurnos(jogoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    recuperaLados(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "Lados do Jogo retornados com sucesso!",
                data: JogoService.recuperaLados(jogoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    reset(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "Jogo resetado com sucesso!",
                data: JogoService.resetJogo(jogoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    cria(req, res) {
        try {
            const { tipoJogo, tempoDeTurnoEmMilisegundos, tabuleiroCasas, ladoId } = req.body;
            return res.json({
                message: "Jogo incluído com sucesso!",
                data: JogoService.cria(tipoJogo, tempoDeTurnoEmMilisegundos, tabuleiroCasas, ladoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    propoeReset(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            JogoService.propoeReset(jogoId, ladoId);
            return res.json({
                message: "Reset proposto ao lado adversário com sucesso!",
                data: null,
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, respondePropostaReset(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            const { resposta } = req.body;
            JogoService.respondeResetProposto(jogoId, ladoId, resposta);
            return res.json({
                message: "Reset proposto respondido com sucesso!",
                data: { resposta },
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    propoeEmpate(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            JogoService.propoeEmpate(jogoId, ladoId);
            return res.json({
                message: "Empate proposto ao lado adversário com sucesso!",
                data: null,
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, respondePropostaEmpate(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            const { resposta } = req.body;
            JogoService.respondeEmpateProposto(jogoId, ladoId, resposta);
            return res.json({
                message: "Empate proposto respondido com sucesso!",
                data: { resposta },
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, recuperaLadoAtual(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "Lado atual do jogo retornado com sucesso!",
                data: JogoService.recuperaLadoAtual(jogoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, promovePeao(req, res) {
        try {
            const { jogoId, pecaIdEscolhida } = req.params;
            const ladoId = req.headers.lado;
            return res.json({
                message: "Peão promovido com sucesso!",
                data: JogoService.promovePeao(jogoId, ladoId, pecaIdEscolhida),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, iaPromovePeao(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            return res.json({
                message: "Peão promovido com sucesso!",
                data: JogoService.iaPromovePeao(jogoId, ladoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, recuperaPecaReiAdversario(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            return res.json({
                message: "Rei do jogador adversário retornado com sucesso!",
                data: JogoService.recuperaPecaReiAdversario(jogoId, ladoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, recuperaLadosIa(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "I.A.s do jogo retornadas com sucesso!",
                data: JogoService.recuperaLadosIa(jogoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, forcaIa(req, res) {
        try {
            JogoService.forcaIa();
            return res.json({
                message: "Tentativa de forçar a I.A. a executar executada com sucesso!",
                data: null,
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, listaIa(req, res) {
        try {
            return res.json({
                message: "Contexto dos Jogos que possuem jogadores I.A. retornados com sucesso!",
                data: JogoService.listaIa(),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, executaJogadasIa(req, res) {
        try {
            const { jogadas } = req.body;
            return res.json({
                message: "Jogadas solicitadas pela I.A. executadas com sucesso!",
                data: JogoService.executaJogadas(jogadas),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }, executaJogadasIaAlone(req, res) {
        try {
            return res.json({
                message: "Jogadas da I.A. executadas com sucesso!",
                data: JogoService.executaJogadasIa(),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }
}
