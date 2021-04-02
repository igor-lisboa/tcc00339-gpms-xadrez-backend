require('dotenv').config();
const express = require("express");
const events = require('events');

const cors = require("cors");
const routes = require("./src/routes");

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
emitter.on("jogoFinalizado", (args) => {
    if ("jogoId" in args) {
        const jogoId = args.jogoId;
        const identificadorLadoBranco = jogoId + "-0";
        const identificadorLadoPreto = jogoId + "-1";


        // os sockets
        const destinoEventoLadoBranco = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificadorLadoBranco);
        const destinoEventoLadoPreto = jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == identificadorLadoPreto);


        // se encontrar o socket do jogador do lado branco
        if (destinoEventoLadoBranco != undefined) {
            io.to(destinoEventoLadoBranco.socketId).emit('jogoFinalizado');
        }

        // se encontrar o socket do jogador do lado preto
        if (destinoEventoLadoPreto != undefined) {
            io.to(destinoEventoLadoPreto.socketId).emit('jogoFinalizado');
        }
    }
});
global.universalEmitter = emitter;

// middleware pra registrar o socket e os jogadores conectados no request
app.use((req, res, next) => {
    req.io = io;
    req.jogadoresConectados = jogadoresConectados;
    req.verbose = verbose;

    next();
});

app.use(cors());
app.use(express.json());
app.use(routes);

const port = process.env.PORT || 3333;

http.listen(port);