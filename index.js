'use strict';

const cheerio = require('cheerio');
const TB = require('node-telegram-bot-api');
const token = '1263883084:AAGc2HmKWuABLlys4S-XUj6olaHo00JOOLQ';
const bot = new TB(token, {
  polling: {
      interval: 300,
      autoStart: true,
      params:{
          timeout: 10
      }
  }});
const http = require('http');
const https = require('https');

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
    res.on('end', () => resolve(cheerio.load(buffer.join())));
  });
});


bot.on('message', msg => {
  bot.sendMessage(msg.chat.id, `Привет, ${msg.from.first_name}!`);
  bot.sendMessage(msg.chat.id, `waiting...`);
  fetch('https://apteka.ru/catalog/varfarin-nikomed-0-0025-n50-tabl_5715d4dc3aad7/')
    .then($ => bot.sendMessage(msg.chat.id, `Варфарин Никомед - 50 таблеток - ${$('.price.m--mobile_font').text}р`))
    .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так(`));
  fetch('http://samlib.ru/t/tagern/')
    .then($ => bot.sendMessage(msg.chat.id, `${$('h3').text} - Последнее обновление - 
    ${$('center').nextSibling.firstChild.firstChild.firstChild.firstChild.firstChild.text}`))
    .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`));
});