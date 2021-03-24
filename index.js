require('dotenv').config();
const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let jogadoresConectados = [];

io.on("connection", (socket) => {
    jogadoresConectados.push({
        "socketId": socket.id,
        "identificador": socket.handshake.query.jogador
    });

    socket.on('disconnect', () => {
        let index = jogadoresConectados.indexOf({
            "socketId": socket.id,
            "identificador": socket.handshake.query.jogador
        });
        jogadoresConectados.splice(index, 1);
    });
});


// middleware pra registrar o socket e os jogadores conectados no request
app.use((req, res, next) => {
    req.io = io;
    req.jogadoresConectados = jogadoresConectados;

    next();
});

app.use(cors());
app.use(express.json());
app.use(routes);

const port = process.env.PORT || 3333;

http.listen(port);