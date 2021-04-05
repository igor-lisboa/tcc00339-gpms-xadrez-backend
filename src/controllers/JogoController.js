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
            const jogo = JogoService.cria(tipoJogo, tempoDeTurnoEmMilisegundos);
            req.io.emit('jogoCriado');
            if (req.verbose) {
                console.log("Enviando mensagem de jogoCriado para todos os sockets conectados...");
            }
            return res.json({
                message: "Jogo incluído com sucesso!",
                data: jogo,
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
            const jogo = JogoService.encontra(jogoId);
            return res.json({
                message: "Lado atual do jogo retornado com sucesso!",
                data: jogo.recuperaLadoPeloId(jogo.ladoIdAtual),
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
                message: "I.A.'s do jogo retornadas com sucesso!",
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
            universalEmitter.emit("forcaIa");
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
            const jogadasExecutadasRetorno = JogoService.executaJogadas(jogadas);

            // para cada jogada executada avisa o adversario caso ele esteja conectado
            jogadasExecutadasRetorno.jogadasExecutadas.forEach((jogadaRealizada) => {
                let jogadorIdentificador = undefined;

                // define parametro q sera usado p buscar socket do adversario
                if (jogadaRealizada.ladoAdversario.tipoId == 0) {
                    jogadorIdentificador = jogadaRealizada.jogoId + "-" + jogadaRealizada.ladoAdversario.ladoId;
                } else {
                    jogadorIdentificador = "I.A.";
                }

                // procura o adversario na lista de jogadores conectados
                const destinoEvento = req.jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

                // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
                if (destinoEvento != undefined) {
                    req.io.to(destinoEvento.socketId).emit('jogadaRealizada', jogadaRealizada.jogada);
                    if (req.verbose) {
                        console.log("Enviando mensagem de jogadaRealizada para " + destinoEvento.identificador + "...");
                    }
                }
            });

            if (jogadasExecutadasRetorno.jogadasErros.length > 0) {
                universalEmitter.emit("forcaIa");
            }

            // retorna json de sucesso
            return res.json({
                message: "Jogadas solicitadas pela I.A. executadas com sucesso!",
                data: jogadasExecutadasRetorno,
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
