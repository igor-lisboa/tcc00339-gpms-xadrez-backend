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
    cria(req, res) {
        try {
            const { tipoJogo, tempoDeTurnoEmMilisegundos } = req.body;
            return res.json({
                message: "Jogo incluído com sucesso!",
                data: JogoService.cria(tipoJogo, tempoDeTurnoEmMilisegundos),
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
                data: JogoService.encontra(jogoId).recuperaLadoPeloId(jogo.ladoIdAtual),
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
    }
}
