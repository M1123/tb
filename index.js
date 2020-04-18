'use strict';

const HTMLParser = require('node-html-parser');
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
    res.on('end', () => resolve(HTMLParser.parse(JSON.stringify(buffer.join()))));
  });
});

// Usage
bot.on('message', msg => {
  bot.sendMessage(msg.chat.id, `Hello, ${msg.from.first_name}`);
  bot.sendMessage(msg.chat.id, `waiting...`);
  fetch('http://samlib.ru/t/tagern/')
    .then(body => bot.sendMessage(msg.chat.id, `res: ${body.querySelector('h3')}, как-то так`))
    .catch(err => bot.sendMessage(msg.chat.id, `res: ${err}, как-то так`));
});