require("dotenv").config();
const express = require("express");

const cors = require("cors");
const routes = require("./src/routes");

const events = require("events").EventEmitter;

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: true });

const verbose = process.env.APP_VERBOSE || true;

let jogadoresConectados = [];

io.on("connection", (socket) => {
    jogadoresConectados.push({
        "socketId": socket.id,
        "identificador": socket.handshake.query.jogador
    });
    if (verbose) {
        console.log("O jogador " + socket.handshake.query.jogador + " se conectou...");
    }

    socket.on("disconnect", () => {
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
        if (verbose) {
            console.log("Enviando mensagem de jogoCriado para todos os jogadores conectados...");
        }
    } else {
        if (verbose) {
            console.log("O evento jogoCriado não tinha a propriedade jogo (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("jogoFinalizado", (args) => {
    if ("jogo" in args) {
        const identificadorLadoBranco = args.jogo.id + "-0";
        const identificadorLadoPreto = args.jogo.id + "-1";


        // os sockets
        const destinoEventoLadoBranco = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificadorLadoBranco);
        const destinoEventoLadoPreto = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificadorLadoPreto);

        let destinos = [];

        // se encontrar o socket do jogador do lado branco
        if (destinoEventoLadoBranco != undefined) {
            destinos.push(destinoEventoLadoBranco);
        }

        // se encontrar o socket do jogador do lado preto
        if (destinoEventoLadoPreto != undefined) {
            destinos.push(destinoEventoLadoPreto);
        }

        destinos.forEach(destino => {
            io.to(destino.socketId).emit("jogoFinalizado", { jogo: args.jogo });
            if (verbose) {
                console.log("Enviando mensagem de jogoFinalizado para o jogador " + destino.identificador + "...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento jogoFinalizado não tinha a propriedade jogo (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("forcaIa", () => {
    const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == "I.A.");
    if (destinoEvento != undefined) {
        io.to(destinoEvento.socketId).emit("forcaIa");
        if (verbose) {
            console.log("Enviando mensagem de forcaIa para " + destinoEvento.identificador + "...");
        }
    } else {
        if (verbose) {
            console.log("A I.A. não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
        }
    }
});

emitter.on("jogadorEntrou", (args) => {
    if ("jogo" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogo.id + "-" + args.ladoAdversario.id;
            }
        }

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit("adversarioEntrou", { jogo: args.jogo });
            if (verbose) {
                console.log("Enviando mensagem de adversarioEntrou para " + destinoEvento.identificador + "...");
            }
        }
    } else {
        if (verbose) {
            console.log("O evento jogadorEntrou não tinha a propriedade jogo ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("acoesSolicitadas", (args) => {
    if ("acoesSolicitadas" in args && "jogoId" in args) {
        args.acoesSolicitadas.forEach(acaoSolicitada => {
            let jogadorIdentificador = "I.A.";

            // define parametro q sera usado p buscar socket
            if (acaoSolicitada.lado.tipo != null) {
                if (acaoSolicitada.lado.tipo.id == 0) {
                    jogadorIdentificador = args.jogoId + "-" + acaoSolicitada.lado.id;
                }
            }

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket
            if (destinoEvento != undefined) {
                io.to(destinoEvento.socketId).emit(acaoSolicitada.acaoItem.acao, acaoSolicitada.acaoItem.data);
                if (verbose) {
                    console.log("Enviando mensagem de " + acaoSolicitada.acaoItem.acao + " para " + destinoEvento.identificador + "...");
                }
            }
        });
    } else {
        if (verbose) {
            console.log("O evento acoesSolicitadas não tinha a propriedade acoesSolicitadas ou a propriedade jogoId (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("jogadaRealizada", (args) => {
    if ("jogadaRealizada" in args && "jogo" in args && "ladoAdversario" in args) {
        // verifica se o adversario eh o lado atual
        if (args.ladoAdversario.id == args.jogo.ladoIdAtual) {
            let jogadorIdentificador = "I.A.";

            // define parametro q sera usado p buscar socket do adversario
            if (args.ladoAdversario.tipo != null) {
                if (args.ladoAdversario.tipo.id == 0) {
                    jogadorIdentificador = args.jogo.id + "-" + args.ladoAdversario.id;
                }
            }

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
            if (destinoEvento != undefined) {
                io.to(destinoEvento.socketId).emit("jogadaRealizada", {
                    jogadaRealizada: args.jogadaRealizada,
                    jogo: args.jogo
                });
                if (verbose) {
                    console.log("Enviando mensagem de jogadaRealizada para " + destinoEvento.identificador + "...");
                }
            } else {
                if (verbose) {
                    console.log("A mensagem de jogadaRealizada não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
                }
            }
        } else {
            if (verbose) {
                console.log("O evento jogadaRealizada não pode mandar mensagem para o jogador adversário pois ainda não está na vez do mesmo...");
            }
        }
    } else {
        if (verbose) {
            console.log("O evento jogadaRealizada não tinha a propriedade jogadaRealizada ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

global.universalEmitter = emitter;

app.use(cors());
app.use(express.json());
app.use(routes);

const port = process.env.PORT || 3333;

http.listen(port);