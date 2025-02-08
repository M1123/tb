const TOKEN = process.env.TOKEN;
const form = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{'text': 'test', callback_data: 'val'}]
    ]
  })
}

import TelegramBot from 'node-telegram-bot-api';
const options = {
  polling: true
};
const bot = new TelegramBot(TOKEN, options);

// const pollOption = {
//   is_anonymous: false,
//   type: 'regular',
//   allows_multiple_answers: true
// };
function init() {
  const commands = [
    {command: '/start', description: 'Start'},
    {command: '/info', description: 'Info'},
    {command: '/day', description: 'How'},
  ];
  bot.setMyCommands(commands);
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    if (msg.text === '/start') {
      return bot.sendMessage(chatId, `Hi, ${msg.from.first_name} ${msg.from.last_name}`);
    }
    if (msg.text === '/day') {
      return bot.sendMessage(chatId, `Hi, ${msg.from.first_name}`, form);
    }
    bot.sendMessage(chatId, msg.text);
    // bot.sendPoll(chatId, today, ['option', 'option1', 'option2', 'option3'], pollOption)
    //   .then(res => {
    //     console.log('res', res)
    //     bot.sendMessage(chatId, res.poll);
    //     bot.sendMessage(chatId, '111');
    //   });
    // bot.sendMessage(chatId, '222');
  });
}

init();

bot.on('callback_query', msg => {
  const chatId = msg.message.chat.id;
  console.log("🚀 ~ msg:", msg)
  bot.sendMessage(chatId, msg.data);
})
// bot.sendMessage(chatId, "Выберите канал:", {
//   reply_markup: {
//     resize_keyboard: true,
//     inline_keyboard: [
//       [{ text: "Случайно", callback_data: "random" }],
//       [
//         { text: "Спорт", callback_data: "sport" },
//         { text: "Кино", callback_data: "cinema" },
//         { text: "Музыка", callback_data: "music" },
//       ],
//     ],
//   },
// });
// После инициализации бота, задать обработчик
// bot.on("callback_query", async callbackQuery => {
//   const msg = callbackQuery.message;
//   await bot.answerCallbackQuery(callbackQuery.id);
//   const { data = "" } = callbackQuery;
// });
// removeHisKeyboard = (callbackQuery) => {
//   const messageText = callbackQuery.message.text;
//   const messageId = callbackQuery.message.message_id;
//   return bot.editMessageText(messageText, {
//       message_id: messageId,
//       chat_id: callbackQuery.from.id,
//       reply_markup: {
//         inline_keyboard: [],
//       },
//     })
// };
