const axios = require("axios").default;
const io = require("socket.io-client");
const { env } = require("./src/config/env");
const { logger } = require("./src/shared/logger");

const verbose = env.APP_VERBOSE;
const apiUrl = env.APP_URL;
const tempoWait = env.APP_WAIT_MS;

const api = axios.create({
    baseURL: apiUrl
});

const socket = io(apiUrl, {
    query: { jogador: "I.A." }
});

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

socket.on("uncaughtException", function (err) {
    logger.error({ err }, "Uncaught exception in AI worker");
});

socket.on("promocaoPeao", async function (args) {
    if (verbose) {
        logger.info("Promoção de peão solicitada para o lado " + args.ladoId + " do jogo " + args.jogoId + "...");
    }
    await promovePeao(args.jogoId, args.ladoId);
});

socket.on("resetProposto", async function (args) {
    if (verbose) {
        logger.info("Solicitação de responder a um reset proposto do jogo " + args.jogoId + "...");
    }
    await respondeProposta(args.jogoId, args.ladoId, "reset");
});

socket.on("empateProposto", async function (args) {
    if (verbose) {
        logger.info("Solicitação de responder a um empate proposto do jogo " + args.jogoId + "...");
    }
    await respondeProposta(args.jogoId, args.ladoId, "empate");
});

socket.on("jogoCriado", async function () {
    if (verbose) {
        logger.info("Novo jogo criado...");
    }
    await ia();
});

socket.on("adversarioEntrou", async function () {
    if (verbose) {
        logger.info("Adversário entrou...");
    }
    await ia();
});

socket.on("jogadaRealizada", async function () {
    if (verbose) {
        logger.info("Jogada realizada...");
    }
    await ia();
});

socket.on("forcaIa", async function () {
    if (verbose) {
        logger.info("Força I.A. a rodar...");
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
            logger.info(response.data);
        }
    }).catch((error) => {
        logger.error(error.response.data.message);
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
            logger.info(response.data);
        }
    }).catch((e) => {
        logger.error({ err: e }, "Promotion request failed");
    });
}

const ia = async () => {
    await sleep(tempoWait);
    api.post(
        "/jogos/ia/executa"
    ).then((response) => {
        if (verbose) {
            logger.info(response.data);
        }
    }).catch((e) => {
        logger.error({ err: e }, "Run request failed");
    });
}

// executa ia 1 unica vez ao iniciar
if (verbose) {
    logger.info("Iniciando I.A. ...");
}
ia();
