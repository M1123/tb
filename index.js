const TB = require('node-telegram-bot-api')

const token = '1263883084:AAGc2HmKWuABLlys4S-XUj6olaHo00JOOLQ';

const bot = new TB(token, {polling:true});

bot.on('message', msg => {
    bot.sendMessage(msg.chat.id, `Hello, ${msg.from.first_name}`);
    bot.sendMessage(msg.chat.id, `msg: ${msg}`);
});