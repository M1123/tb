'use strict';

const cheerio = require('cheerio');
const Agent = require('socks5-https-client/lib/Agent');
const TB = require('node-telegram-bot-api');
const TOKEN = '1263883084:AAGc2HmKWuABLlys4S-XUj6olaHo00JOOLQ';
const http = require('http');
const https = require('https');
const weather = require('weather-js');

const bot = new TB(TOKEN, {
  polling: true,
  request: {
    agentClass: Agent,
    agentOptions: {
        socksHost: '127.0.0.1',
        socksPort: '9150'
    }
  }
});

const fetch = url => new Promise((resolve, reject) => {
  const protocol = url.startsWith('https') ? https : http;
  protocol.get(url, res => {
    if (res.statusCode !== 200) {
      const { statusCode, statusMessage } = res;
      reject(new Error(`Status Code: ${statusCode} ${statusMessage}`));
    }
    res.setEncoding('utf8');
    const buffer = [];
    res.on('data', chunk => buffer.push(chunk));
    res.on('end', () => resolve(cheerio.load(JSON.stringify(buffer.join()))));
  });
});


// bot.on('message', msg => {
//   bot.sendMessage(msg.chat.id, `waiting...`);
//   //  fetch('https://apteka.ru/catalog/varfarin-nikomed-0-0025-n50-tabl_5715d4dc3aad7/')
//   //   .then($ => bot.sendMessage(msg.chat.id, `Варфарин Никомед - 50 таблеток - ${$('.price.m--mobile_font')}р`))
//   //   .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так(`));
//   fetch('http://samlib.ru/t/tagern/')
//     .then($ => bot.sendMessage(msg.chat.id, `${$('h3')} - Последнее обновление///`))
//     .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`));
// });

//https://m1123.github.io/

bot.onText(/\/(sl|сл)/, (msg, [source,match]) => {
  bot.sendMessage(msg.chat.id, `waiting...`);
  const {id} = msg.chat;
  bot.sendMessage(id,match);
  fetch('http://samlib.ru/t/tagern/')
    .then($ => {bot.sendMessage(msg.chat.id, $('h3')+' - Последнее обновление///');console.log('$(h3): ', $('h3'))})
    .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`));
})

// ------------------ПОГОДА--------------------
bot.onText(/(\/)?((П|п)огода|(W|w)eather)/, (msg, [source,match]) => {
  let date = printDate();
  let pog = null;
  let city = msg.text.match(/([A-Za-zА-Яа-яёЁ-]+)$/)[0];

  console.log( `user: ${msg.chat.first_name}, city: ${city}, date: ${date}`);
  let output = 'Ошибка'
  weather.find({search: city, degreeType: 'C'}, function(err, result) {
    console.log('result: ', result.length);
    if (result.length) {
      output = `Погода: 
      ${city.trim()}: ${result[0].current.temperature} °С
      ${translate(result[0].current.skytext)}
      Ощущается как: ${result[0].current.feelslike} °С
      Ветер: ${result[0].current.windspeed.slice(0,-5)} км/ч`;
    } else {
      output = `Город ${city} не найден.`;
    }
    bot.sendMessage(msg.chat.id, output);
    bot.sendLocation(msg.chat.id, result[0].location.lat, result[0].location.long);
  });
});
function printDate() {
  let temp = new Date();
  let dateStr = padStr(temp.getFullYear()) +'-'+
                padStr(1 + temp.getMonth()) +'-'+
                padStr(temp.getDate()) +' '+
                padStr(temp.getHours()) +':'+
                padStr(temp.getMinutes()) +':'+
                padStr(temp.getSeconds());
  return dateStr;
}

function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}
let translate = (str) => {
  let result = '';
  for (let i = 0; i < skytextru.length; i++) {
    const element = skytextru[i];
    if (element.en === str) {
      result = element.ru;
      break;
    }
  }
  return result||str;
};
const skytextru = [
  {en:'Thunderstorm', ru:'Гроза'},
  {en:'Rain Snow', ru:'Дождь со снегом'},
  {en:'Sleet', ru:'Дождь со снегом'},
  {en:'Icy', ru:'Ледяной дождь'},
  {en:'Showers', ru:'Ливень'},
  {en:'Rain', ru:'Дождь'},
  {en:'Flurries', ru:'Порывы'},
  {en:'Snow', ru:'Снег'},
  {en:'Dust', ru:'Пыль'},
  {en:'Fog', ru:'Туман'},
  {en:'Haze', ru:'Мгла'},
  {en:'Windy', ru:'Ветренно'},
  {en:'Cloudy', ru:'Облачно'},
  {en:'Mostly Cloudy', ru:'В основном облачно'},
  {en:'Partly Cloudy', ru:'Частично облачно'},
  {en:'Sunny', ru:'Солнечно'},
  {en:'Mostly Sunny', ru:'Преимущественно солнечно'},
  {en:'Partly Sunny', ru:'Частично солнечно'},
  {en:'Hot', ru:'Жарко'},
  {en:'Chance Of Tstorm', ru:'Вероятность грозы'},
  {en:'Chance Of Rain', ru:'Вероятность дождя'},
  {en:'Chance Of Snow', ru:'Вероятность снега'},
  {en:'Light Rain', ru:'Небольшой дождь'},
  {en:'Rain Showers', ru:'Дождь'},
  {en:'na', ru:'Не доступно'},
];