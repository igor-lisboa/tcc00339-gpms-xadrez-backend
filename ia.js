require("dotenv").config();
const axios = require("axios").default;

const verbose = process.env.APP_VERBOSE || true;
const apiUrl = process.env.APP_URL || "http://localhost:3333";

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

socket.on("empateProposto", async function (args) {
    if (verbose) {
        console.log("Solicitação de responder a um empate proposto do jogo " + args.jogoId + "...");
    }
    await respondePropostaEmpate(args.jogoId, args.ladoId);
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

const escolhePossivelJogada = (possiveisJogadas) => {
    let novasPossibilidadesJogadas = [];

    // capturar pecas (se possivel)
    novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
        possivelJogada.captura == true
    );
    // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
    if (novasPossibilidadesJogadas.length != 0) {
        possiveisJogadas = novasPossibilidadesJogadas;
    }

    // evitar se mover p um lugar onde possa ser capturado (se possivel)
    novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
        possivelJogada.capturavel == false
    );
    // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
    if (novasPossibilidadesJogadas.length != 0) {
        possiveisJogadas = novasPossibilidadesJogadas;
    }

    // evitar deixar pecas q podem ser capturadas nas casas onde estao
    novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
        possivelJogada.pecaAmeacadaNaPosicaoAtual == true
    );
    // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
    if (novasPossibilidadesJogadas.length != 0) {
        possiveisJogadas = novasPossibilidadesJogadas;
    }

    // escolhe item no array de possiveisJogadas aleatoriamente
    return possiveisJogadas[Math.floor(Math.random() * possiveisJogadas.length)];
}

const respondePropostaEmpate = async (jogoId, ladoId) => {
    // espera 3 segundos pra executar
    await sleep(3000);
    const respostas = [true, false];
    const respostaEscolhida = respostas[Math.floor(Math.random() * respostas.length)];
    api.post(
        "/jogos/" + jogoId + "/empate/responde",
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
    // espera 3 segundos pra executar
    await sleep(3000);
    api.get(
        "/tipos-de-peca/promocao-peao"
    ).then((response) => {

        let idsPecasParaSeremEscolhidas = [];

        // se retorno tiver sucesso
        if (response.data.success) {

            // percorre pecas
            response.data.data.forEach((peca) => {
                idsPecasParaSeremEscolhidas.push(peca.id);
            });

            const idPecaEscolhida = idsPecasParaSeremEscolhidas[Math.floor(Math.random() * idsPecasParaSeremEscolhidas.length)];

            // realiza jogadas listadas
            api.post(
                "/jogos/" + jogoId + "/promove-peao/" + idPecaEscolhida,
                {},
                {
                    headers: {
                        lado: ladoId
                    }
                }
            ).then((responsePromocao) => {
                if (verbose) {
                    console.log(responsePromocao.data);
                }
            }).catch((errorPromocao) => {
                console.log(errorPromocao.response.data.message);
            });
        } else {
            console.log(response.data.message);
        }
    }).catch((e) => {
        console.log(e);
    });
}

const ia = async () => {
    // espera 3 segundos pra executar
    await sleep(3000);
    api.get(
        "/jogos/ia"
    ).then((response) => {

        let jogadasParaSeremFeitasPelaIa = [];

        // se retorno tiver sucesso
        if (response.data.success) {

            // percorre jogos
            response.data.data.forEach((jogoIa) => {
                // recupera lado atual do jogo
                const ladoIa = jogoIa.ladosIa.find(ladoIa => ladoIa.lado.id == jogoIa.jogo.ladoIdAtual);

                // checa se o ladoIa foi encontrado
                if (ladoIa != undefined) {
                    // escolhe uma jogada para realizar
                    const jogadaEscolhida = escolhePossivelJogada(ladoIa.possiveisJogadas);

                    // se escolheu alguma jogada... adiciona na lista de jogadas p executar
                    if (jogadaEscolhida != undefined) {
                        // insere jogada escolhida no array de jogadasParaSeremFeitasPelaIa
                        jogadasParaSeremFeitasPelaIa.push({
                            "jogoId": jogoIa.jogo.id,
                            "casaOrigem": jogadaEscolhida.de,
                            "casaDestino": jogadaEscolhida.para,
                            "ladoId": ladoIa.lado.id
                        });
                    }
                }
            });

            // realiza jogadas listadas
            api.post(
                "/jogos/ia",
                {
                    "jogadas": jogadasParaSeremFeitasPelaIa
                }
            ).then((responseJogada) => {
                if (verbose) {
                    console.log(responseJogada.data);
                }
            }).catch((errorJogada) => {
                console.log(errorJogada.response.data.message);
            });
        } else {
            console.log(response.data.message);
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