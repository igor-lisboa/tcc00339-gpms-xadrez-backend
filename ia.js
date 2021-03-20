const JogoService = require("./src/services/JogoService");

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ia = async () => {
    while (true) {
        const jogosIa = JogoService.listaIa();

        jogosIa.forEach((jogo) => {
            const ladosIa = JogoService.recuperaLadosIa(jogo.id);
            console.log(ladosIa);
        });

        await sleep(5000);
    }

}

ia();