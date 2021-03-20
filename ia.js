const JogoService = require("./src/services/JogoService");

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ia = async () => {
    while (true) {
        const jogosIa = JogoService.listaIa();

        JogoService.recuperaLadosIa(jogoId)

        console.log('teste' + new Date().getTime());
        await sleep(5000);
    }

}

ia();