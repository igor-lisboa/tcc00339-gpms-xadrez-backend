require("dotenv").config();
const axios = require("axios").default;

const verbose = process.env.APP_VERBOSE || true;
const apiUrl = process.env.APP_URL || "http://localhost:3333";
// espera 3 segundos
const tempoWait = 3000;

const api = axios.create({
    baseURL: apiUrl
});
const io = require("socket.io-client");

const socket = io(apiUrl, {
    query: { jogador: "I.A." }
});

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

socket.on("uncaughtException", function (err) {
    console.log(err);
});

socket.on("promocaoPeao", async function (args) {
    if (verbose) {
        console.log("Promoção de peão solicitada para o lado " + args.ladoId + " do jogo " + args.jogoId + "...");
    }
    await promovePeao(args.jogoId, args.ladoId);
});

socket.on("resetProposto", async function (args) {
    if (verbose) {
        console.log("Solicitação de responder a um reset proposto do jogo " + args.jogoId + "...");
    }
    await respondeProposta(args.jogoId, args.ladoId, "reset");
});

socket.on("empateProposto", async function (args) {
    if (verbose) {
        console.log("Solicitação de responder a um empate proposto do jogo " + args.jogoId + "...");
    }
    await respondeProposta(args.jogoId, args.ladoId, "empate");
});

socket.on("jogoCriado", async function () {
    if (verbose) {
        console.log("Novo jogo criado...");
    }
    await ia();
});

socket.on("adversarioEntrou", async function () {
    if (verbose) {
        console.log("Adversário entrou...");
    }
    await ia();
});

socket.on("jogadaRealizada", async function () {
    if (verbose) {
        console.log("Jogada realizada...");
    }
    await ia();
});

socket.on("forcaIa", async function () {
    if (verbose) {
        console.log("Força I.A. a rodar...");
    }
    await ia();
});

const respondeProposta = async (jogoId, ladoId, tipo) => {
    await sleep(tempoWait);
    const respostas = [true, false];
    const respostaEscolhida = respostas[Math.floor(Math.random() * respostas.length)];
    api.post(
        "/jogos/" + jogoId + "/" + tipo + "/responde",
        {
            resposta: respostaEscolhida
        },
        {
            headers: {
                lado: ladoId
            }
        }
    ).then((response) => {
        if (verbose) {
            console.log(response.data);
        }
    }).catch((error) => {
        console.log(error.response.data.message);
    });
}

const promovePeao = async (jogoId, ladoId) => {
    await sleep(tempoWait);
    api.post(
        "/jogos/" + jogoId + "/ia/promove-peao",
        {},
        {
            headers: {
                lado: ladoId
            }
        }
    ).then((response) => {
        if (verbose) {
            console.log(response.data);
        }
    }).catch((e) => {
        console.log(e);
    });
}

const ia = async () => {
    // espera 3 segundos pra executar
    await sleep(tempoWait);
    api.post(
        "/jogos/ia/executa"
    ).then((response) => {
        if (verbose) {
            console.log(response.data);
        }
    }).catch((e) => {
        console.log(e);
    });
}

// executa ia 1 unica vez ao iniciar
if (verbose) {
    console.log("Iniciando I.A. ...");
}
ia();