const db = require('../database.json');
const Jogo = require('../models/Jogo');

module.exports = {
    index() {
        return db.jogos;
    }, find(index) {
        return db.jogos[index];
    }, create() {
        db.jogos.push(new Jogo());
        return this.index();
    }
};