require('dotenv').config();
const express = require("express");

const cors = require("cors");
const routes = require("./src/routes");

const events = require('events').EventEmitter;

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: true });

const verbose = process.env.APP_VERBOSE || true;

const JogoService = require('./src/services/JogoService');

let jogadoresConectados = [];

io.on("connection", (socket) => {
    jogadoresConectados.push({
        "socketId": socket.id,
        "identificador": socket.handshake.query.jogador
    });
    if (verbose) {
        console.log("O jogador " + socket.handshake.query.jogador + " se conectou...");
    }

    socket.on('disconnect', () => {
        let index = jogadoresConectados.indexOf({
            "socketId": socket.id,
            "identificador": socket.handshake.query.jogador
        });
        jogadoresConectados.splice(index, 1);
        if (verbose) {
            console.log("O jogador " + socket.handshake.query.jogador + " se desconectou...");
        }
    });
});

// instancia tratador de eventos do node
const emitter = new events();
emitter.on("jogoCriado", (args) => {
    if ("jogo" in args) {
        io.emit("jogoCriado", {
            jogo: args.jogo
        });
    }
});

emitter.on("jogoFinalizado", (args) => {
    if ("jogo" in args) {
        const jogoId = args.jogo.id;
        const identificadorLadoBranco = jogoId + "-0";
        const identificadorLadoPreto = jogoId + "-1";


        // os sockets
        const destinoEventoLadoBranco = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificadorLadoBranco);
        const destinoEventoLadoPreto = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificadorLadoPreto);


        // se encontrar o socket do jogador do lado branco
        if (destinoEventoLadoBranco != undefined) {
            if (verbose) {
                console.log("Enviando mensagem de jogoFinalizado para o jogador " + destinoEventoLadoBranco.identificador + "...");
            }
            io.to(destinoEventoLadoBranco.socketId).emit('jogoFinalizado');
        }

        // se encontrar o socket do jogador do lado preto
        if (destinoEventoLadoPreto != undefined) {
            if (verbose) {
                console.log("Enviando mensagem de jogoFinalizado para o jogador " + destinoEventoLadoPreto.identificador + "...");
            }
            io.to(destinoEventoLadoPreto.socketId).emit('jogoFinalizado');
        }
    }
});

emitter.on("forcaIa", () => {
    const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == "I.A.");
    if (destinoEvento != undefined) {
        io.to(destinoEvento.socketId).emit('forcaIa');
        if (verbose) {
            console.log("Enviando mensagem de forcaIa para " + destinoEvento.identificador + "...");
        }
    }
});

emitter.on("jogadorEntrou", (args) => {
    if ("lado" in args && "jogoId" in args) {
        // recupera lado adversario
        const ladoAdversario = JogoService.recuperaLadoTipo(args.jogoId, JogoService.recuperaIdLadoAdversarioPeloId(args.lado.id));

        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (ladoAdversario.tipoId == 0) {
            jogadorIdentificador = args.jogoId + "-" + ladoAdversario.ladoId;
        }

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit('adversarioEntrou');
            if (verbose) {
                console.log("Enviando mensagem de adversarioEntrou para " + destinoEvento.identificador + "...");
            }
        }
    }
});

emitter.on("jogadasExecutadasIa", (args) => {
    if ("jogadasExecutadas" in args) {
        // para cada jogada executada avisa o adversario caso ele esteja conectado
        args.jogadasExecutadas.forEach((jogadaRealizada) => {
            const tabuleiro = JogoService.recuperaTabuleiro(jogadaRealizada.jogoId);

            let jogadorIdentificador = "I.A.";

            // define parametro q sera usado p buscar socket do adversario
            if (jogadaRealizada.ladoAdversario.tipoId == 0) {
                jogadorIdentificador = jogadaRealizada.jogoId + "-" + jogadaRealizada.ladoAdversario.ladoId;
            }

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
            if (destinoEvento != undefined) {
                io.to(destinoEvento.socketId).emit('jogadaRealizada', {
                    jogadaRealizada: jogadaRealizada.jogada,
                    tabuleiro
                });
                if (verbose) {
                    console.log("Enviando mensagem de jogadaRealizada para " + destinoEvento.identificador + "...");
                }
            }
        });
    }
});

emitter.on("acoesSolicitadas", (args) => {
    if ("acoesSolicitadas" in args && "jogoId" in args) {
        args.acoesSolicitadas.forEach(acaoSolicitada => {
            const lado = JogoService.encontra(args.jogoId).recuperaLadoPeloId(acaoSolicitada.ladoId);

            let jogadorIdentificador = "I.A.";

            // define parametro q sera usado p buscar socket
            if (lado.tipoId == 0) {
                jogadorIdentificador = args.jogoId + "-" + lado.id;
            }

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket
            if (destinoEvento != undefined) {
                io.to(destinoEvento.socketId).emit(acaoSolicitada.acao, acaoSolicitada.data);
                if (verbose) {
                    console.log("Enviando mensagem de " + acaoSolicitada.acao + " para " + destinoEvento.identificador + "...");
                }
            }
        });

    }
});

emitter.on("jogadaRealizada", (args) => {
    if ("jogadaRealizada" in args && "jogoId" in args && "ladoId" in args) {
        // recupera lado adversario
        const jogo = JogoService.encontra(args.jogoId);

        const ladoAdversario = jogo.recuperaLadoPeloId(JogoService.recuperaIdLadoAdversarioPeloId(args.ladoId));
        const tabuleiro = jogo.recuperaTabuleiro();

        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (ladoAdversario.tipo.id == 0) {
            jogadorIdentificador = args.jogoId + "-" + ladoAdversario.id;
        }

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit('jogadaRealizada', {
                jogadaRealizada: args.jogadaRealizada,
                tabuleiro
            });
            if (verbose) {
                console.log("Enviando mensagem de jogadaRealizada para " + destinoEvento.identificador + "...");
            }
        }
    }
});

global.universalEmitter = emitter;

app.use(cors());
app.use(express.json());
app.use(routes);

const port = process.env.PORT || 3333;

http.listen(port);