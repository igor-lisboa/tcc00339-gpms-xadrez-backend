const axios = require("axios").default;
const appUrl = process.env.APP_URL || "http://localhost:3333";
const api = axios.create({
    baseURL: appUrl
});

const sleep = async (s) => {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

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

const tempoSleepSegundos = 5;

const ia = async () => {
    while (true) {
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

                    // escolhe uma jogada para realizar
                    const jogadaEscolhida = escolhePossivelJogada(ladoIa.possiveisJogadas);

                    // insere jogada escolhida no array de jogadasParaSeremFeitasPelaIa
                    jogadasParaSeremFeitasPelaIa.push({
                        "jogoId": jogoIa.jogo.id,
                        "casaDe": jogadaEscolhida.de,
                        "casaPara": jogadaEscolhida.para
                    });
                });

                // realiza jogadas listadas
                console.log(jogadasParaSeremFeitasPelaIa);
            } else {
                console.log(response.data.message);
            }
        }).catch((error) => {
            console.log(error.response.data.message);
        });

        await sleep(tempoSleepSegundos);
    }
}

ia();