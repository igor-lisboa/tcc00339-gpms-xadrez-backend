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
emitter.on("jogoCriado", () => {
    io.emit("jogoCriado");
    if (verbose) {
        console.log("Enviando mensagem de jogoCriado para todos os jogadores conectados...");
    }
});

emitter.on("jogoResetado", (args) => {
    if ("jogoId" in args) {
        const identificadores = [args.jogoId + "-0", args.jogoId + "-1", "I.A."];

        let destinos = [];

        identificadores.forEach(identificador => {
            destinos = destinos.concat(jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == identificador));
        });

        destinos.forEach(destino => {
            io.to(destino.socketId).emit("jogoResetado");
            if (verbose) {
                console.log("Enviando mensagem de jogoResetado para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento jogoResetado não tinha a propriedade jogoId (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("jogoFinalizado", (args) => {
    if ("jogoId" in args && "jogoFinalizado" in args) {
        const identificadores = [args.jogoId + "-0", args.jogoId + "-1"];

        let destinos = [];

        identificadores.forEach(identificador => {
            destinos = destinos.concat(jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == identificador));
        });

        destinos.forEach(destino => {
            io.to(destino.socketId).emit("jogoFinalizado", { jogoFinalizacao: args.jogoFinalizado });
            if (verbose) {
                console.log("Enviando mensagem de jogoFinalizado para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento jogoFinalizado não tinha a propriedade jogoId ou a propriedade jogoFinalizado (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("forcaIa", () => {
    jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == "I.A.").forEach(destino => {
        io.to(destino.socketId).emit("forcaIa");
        if (verbose) {
            console.log("Enviando mensagem de forcaIa para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
        }
    });
});

emitter.on("jogadorEntrou", (args) => {
    if ("jogoId" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador).forEach(destino => {
            io.to(destino.socketId).emit("adversarioEntrou");
            if (verbose) {
                console.log("Enviando mensagem de adversarioEntrou para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento jogadorEntrou não tinha a propriedade jogoId ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
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

            jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador).forEach(destino => {
                io.to(destino.socketId).emit(acaoSolicitada.acaoItem.acao, acaoSolicitada.acaoItem.data);
                if (verbose) {
                    console.log("Enviando mensagem de " + acaoSolicitada.acaoItem.acao + " para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
                }
            });
        });
    } else {
        if (verbose) {
            console.log("O evento acoesSolicitadas não tinha a propriedade acoesSolicitadas ou a propriedade jogoId (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("resetPropostoResposta", (args) => {
    if ("jogoId" in args && "ladoAdversario" in args && "resposta" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador).forEach(destino => {
            io.to(destino.socketId).emit("resetPropostoResposta", args.resposta);
            if (verbose) {
                console.log("Enviando mensagem de resetPropostoResposta para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento resetPropostoResposta não tinha a propriedade jogoId ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("resetProposto", (args) => {
    if ("jogoId" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador).forEach(destino => {
            io.to(destino.socketId).emit("resetProposto", {
                jogoId: args.jogoId,
                ladoId: args.ladoAdversario.id
            });
            if (verbose) {
                console.log("Enviando mensagem de resetProposto para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento resetProposto não tinha a propriedade jogoId ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("empatePropostoResposta", (args) => {
    if ("jogoId" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador).forEach(destino => {
            io.to(destino.socketId).emit("empatePropostoResposta");
            if (verbose) {
                console.log("Enviando mensagem de empatePropostoResposta para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento empatePropostoResposta não tinha a propriedade jogoId ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("empateProposto", (args) => {
    if ("jogoId" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador).forEach(destino => {
            io.to(destino.socketId).emit("empateProposto", {
                jogoId: args.jogoId,
                ladoId: args.ladoAdversario.id
            });
            if (verbose) {
                console.log("Enviando mensagem de empateProposto para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento empateProposto não tinha a propriedade jogoId ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("jogadaRealizada", (args) => {
    if ("jogadaRealizada" in args && "jogoId" in args && "ladoAdversario" in args && "pecaPromovida" in args && "chequeLadoAtual" in args) {
        let identificadores = ["I.A.", args.jogoId + "-" + args.ladoAdversario.id];

        let destinos = [];

        identificadores.forEach(identificador => {
            destinos = destinos.concat(jogadoresConectados.filter(jogadorConectado => jogadorConectado.identificador == identificador));
        });

        destinos.forEach(destino => {
            io.to(destino.socketId).emit("jogadaRealizada", {
                jogadaRealizada: args.jogadaRealizada,
                chequeLadoAtual: args.chequeLadoAtual,
                promocaoPara: args.pecaPromovida ? args.pecaPromovida.tipo : args.pecaPromovida
            });
            if (verbose) {
                console.log("Enviando mensagem de jogadaRealizada para o jogador " + destino.identificador + "(" + destino.socketId + ")...");
            }
        });
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