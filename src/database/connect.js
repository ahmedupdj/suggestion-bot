const config = require("../../config.js");
const mongoose = require("mongoose")

module.exports = async (client) => {
    mongoose.connect(config.bot.mongourl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoIndex: false
    }).then(() => {
    console.log("a7a");
    }).catch(a => console.log("2a7a"));
}