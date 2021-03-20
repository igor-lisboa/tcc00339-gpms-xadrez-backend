const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ia = async () => {
    while (true) {
        const db = require("./src/database.json");

        console.log(db);
        await sleep(5000);
    }

}

ia();