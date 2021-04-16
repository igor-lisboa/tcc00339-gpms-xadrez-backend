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
            const destino = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificador);
            if (destino != undefined) {
                destinos.push(destino);
            }
        });

        destinos.forEach(destino => {
            io.to(destino.socketId).emit("jogoResetado");
            if (verbose) {
                console.log("Enviando mensagem de jogoResetado para o jogador " + destino.identificador + "...");
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
            const destino = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificador);
            if (destino != undefined) {
                destinos.push(destino);
            }
        });

        destinos.forEach(destino => {
            io.to(destino.socketId).emit("jogoFinalizado", { jogoFinalizacao: args.jogoFinalizado });
            if (verbose) {
                console.log("Enviando mensagem de jogoFinalizado para o jogador " + destino.identificador + "...");
            }
        });
    } else {
        if (verbose) {
            console.log("O evento jogoFinalizado não tinha a propriedade jogoId ou a propriedade jogoFinalizado (" + JSON.stringify(args) + ")...");
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
    if ("jogoId" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit("adversarioEntrou");
            if (verbose) {
                console.log("Enviando mensagem de adversarioEntrou para " + destinoEvento.identificador + "...");
            }
        } else {
            if (verbose) {
                console.log("A mensagem de jogadorEntrou não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
            }
        }
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

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket
            if (destinoEvento != undefined) {
                io.to(destinoEvento.socketId).emit(acaoSolicitada.acaoItem.acao, acaoSolicitada.acaoItem.data);
                if (verbose) {
                    console.log("Enviando mensagem de " + acaoSolicitada.acaoItem.acao + " para " + destinoEvento.identificador + "...");
                }
            } else {
                if (verbose) {
                    console.log("A mensagem de " + acaoSolicitada.acaoItem.acao + " não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
                }
            }
        });
    } else {
        if (verbose) {
            console.log("O evento acoesSolicitadas não tinha a propriedade acoesSolicitadas ou a propriedade jogoId (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("resetPropostoResposta", (args) => {
    if ("jogoId" in args && "ladoAdversario" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            // caso o usuario receba essa resposta eh pq o reset proposto foi negado caso contrario ele receberia o evento de jogo finalizado
            io.to(destinoEvento.socketId).emit("resetPropostoResposta");
            if (verbose) {
                console.log("Enviando mensagem de resetPropostoResposta para " + destinoEvento.identificador + "...");
            }
        } else {
            if (verbose) {
                console.log("A mensagem de resetPropostoResposta não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
            }
        }
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

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit("resetProposto", {
                jogoId: args.jogoId,
                ladoId: args.ladoAdversario.id
            });
            if (verbose) {
                console.log("Enviando mensagem de resetProposto para " + destinoEvento.identificador + "...");
            }
        } else {
            if (verbose) {
                console.log("A mensagem de resetProposto não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
            }
        }
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

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            // caso o usuario receba essa resposta eh pq o empate proposto foi negado caso contrario ele receberia o evento de jogo finalizado
            io.to(destinoEvento.socketId).emit("empatePropostoResposta");
            if (verbose) {
                console.log("Enviando mensagem de empatePropostoResposta para " + destinoEvento.identificador + "...");
            }
        } else {
            if (verbose) {
                console.log("A mensagem de empatePropostoResposta não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
            }
        }
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

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit("empateProposto", {
                jogoId: args.jogoId,
                ladoId: args.ladoAdversario.id
            });
            if (verbose) {
                console.log("Enviando mensagem de empateProposto para " + destinoEvento.identificador + "...");
            }
        } else {
            if (verbose) {
                console.log("A mensagem de empateProposto não foi enviada para " + jogadorIdentificador + " pois o mesmo não está na lista de jogadores conectados (" + JSON.stringify(jogadoresConectados) + ")...");
            }
        }
    } else {
        if (verbose) {
            console.log("O evento empateProposto não tinha a propriedade jogoId ou a propriedade ladoAdversario (" + JSON.stringify(args) + ")...");
        }
    }
});

emitter.on("jogadaRealizada", (args) => {
    if ("jogadaRealizada" in args && "jogoId" in args && "ladoAdversario" in args && "pecaPromovida" in args && "chequeLadoAtual" in args) {
        let jogadorIdentificador = "I.A.";

        // define parametro q sera usado p buscar socket do adversario
        if (args.ladoAdversario.tipo != null) {
            if (args.ladoAdversario.tipo.id == 0) {
                jogadorIdentificador = args.jogoId + "-" + args.ladoAdversario.id;
            }
        }

        // procura o adversario na lista de jogadores conectados
        const destinoEvento = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

        // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
        if (destinoEvento != undefined) {
            io.to(destinoEvento.socketId).emit("jogadaRealizada", {
                jogadaRealizada: args.jogadaRealizada,
                chequeLadoAtual: args.chequeLadoAtual,
                promocaoPara: args.pecaPromovida ? args.pecaPromovida.tipo : args.pecaPromovida
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