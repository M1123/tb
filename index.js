'use strict';

// ---------------------import----------------------
const fs = require('fs');
const cheerio = require('cheerio');
const Agent = require('socks5-https-client/lib/Agent');
const TB = require('node-telegram-bot-api');
const http = require('http');
const https = require('https');
const weather = require('weather-js');
const FeedParser = require('feedparser');
const nodefetch = require('node-fetch');
const osmosis = require('osmosis');
// ----------------------local----------------------
const config = require('./resources/config.json');
const myJSON = require("./resources/rss.json");
const sk = require("./resources/skytexts.json");
const { url } = require('inspector');
// const users = require('./resources/users.json')
// ----------------------const----------------------
const TOKEN = config.tokenTelegramBot;
const skytextru = sk.skytext;
// -------------------------------------------

const bot = new TB(TOKEN, {
  polling: true,
  // request: {
  //   agentClass: Agent,
  //   agentOptions: config.agentOptions,
  // }
});

const fetchHtml = url => new Promise((resolve, reject) => {
  const protocol = url.startsWith('https') ? https : http;
  protocol.get(url, res => {
    if (res.statusCode !== 200) {
      const { statusCode, statusMessage } = res;
      reject(new Error(`Status Code: ${statusCode} ${statusMessage}`));
    }
    res.setEncoding('utf8');
    const buffer = [];
    // res.on('data', chunk => buffer.push(chunk));
    res.on('end', () => resolve(buffer.join()));
    // res.on('end', () => resolve(cheerio.load(JSON.stringify(buffer.join()))));
  });
});


// bot.on('message', msg => {
//   bot.sendMessage(msg.chat.id, `waiting...`);
    // fetchHtml('https://apteka.ru/catalog/varfarin-nikomed-0-0025-n50-tabl_5715d4dc3aad7/')
    //   .then($ => bot.sendMessage(msg.chat.id, `Варфарин Никомед - 50 таблеток - ${$('.price.m--mobile_font')}р`))
    //   .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так(`));
//   fetchHtml('http://samlib.ru/t/tagern/')
//     .then($ => bot.sendMessage(msg.chat.id, `${$('h3')} - Последнее обновление///`))
//     .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`));
// });

// https://m1123.github.io/

bot.onText(/\/(sl|сл)/, (msg, [source,match]) => {
  bot.sendMessage(msg.chat.id, `waiting...`);
  const {id} = msg.chat;
  // fetchHtml('http://samlib.ru/t/tagern/')
  //   .then($ => {bot.sendMessage(msg.chat.id, $('h3')+' - Последнее обновление///');console.log('$(h3): ', $('h3'))})
  //   .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`));
  osmosis
    .get('http://samlib.ru/t/tagern/')
    .set({
      'name': 'h3',
      'upd': 'body table li[2]',
    })
    .data((data)=>{bot.sendMessage(id,`${data.name} - ${data.upd}`)})
})


bot.onText(/(\/)?(test|тест)/, (msg, [source,match]) => {
  bot.sendMessage(msg.chat.id, `waiting...`);
  const {id} = msg.chat;
  bot.sendMessage(id,match);
  fetchHtml('https://m1123.github.io/')
    .then($ => {bot.sendMessage(msg.chat.id, $('footer')+' - sth');console.log('$(footer): ', $('footer'))})
    .catch(err => bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`));
})

// -----------------train---------------------
const ROUTES = [
  {name:'Водники -> Москва:', url:'https://napoezde.net/raspisanie-poezdov-po-marshrutu/vodniki--moskva-savelovskiy-vokzal/'},
  {name:'Москва -> Водники:', url:'https://napoezde.net/raspisanie-poezdov-po-marshrutu/moskva-savelovskiy-vokzal--vodniki/'},
]
bot.onText(/(\/)?(мцд|d1)/, (msg, [source,match]) => {
  bot.sendMessage(msg.chat.id, `waiting...`);
  let text = msg.text.match(/\ (.+)$/);
  let flag = (!!text) ? true : false
  let url = (flag) ? ROUTES[0].url : ROUTES[1].url;
  let title = (flag) ? ROUTES[0].name : ROUTES[1].name;
  let result = 'Ошибка';
  osmosis
    .get(url)
    .set({
      'departure': ['tr th[3]'],
      'arrival': ['tr th[4]'],
    })
    .data((obj)=>{
      let i = findNext(obj.departure)
      let l = obj.departure.length-1
      let start = formatStr(obj.departure[i])
      let finish = formatStr(obj.arrival[i])
      let nextstart = formatStr(obj.departure[i+1])
      let nextfinish = formatStr(obj.arrival[i+1])
      let laststart = formatStr(obj.departure[l-1])
      let lastfinish = formatStr(obj.arrival[l-1])
      result = `<pre>${title}
| ${start} | ${finish} |
| ${nextstart} | ${nextfinish} |
|-------|-------|
| ${laststart} | ${lastfinish} |
</pre>`;
      bot.sendMessage(msg.chat.id,result,{ parse_mode: 'HTML' })
    }) 

    
})

function findNext(array) {
  let result;
  let now = new Date();
  let num2 = Number(now.getHours())*100 + Number(now.getMinutes());
  for (let i = 0; i < array.length; i++) {
    let str = array[i];
    str = str.split(/\D/g).join('');
    if (str==''||str==null||Number(str)==NaN) continue;
    let num = Number(str);
    if (num2<num){result = i; break};
  }
  return result;
};

function formatStr(str) {
  let result = str.split(' ')[0]
  return result
}

// ------------------ПОГОДА--------------------
bot.onText(/(\/)?((П|п)огода|(W|w)eather)/, (msg, [source,match]) => {
  // console.log('msg: ', msg);
  let date = printDate();
  let city = msg.text.match(/\ (.+)$/)[1];
  console.log( `user: ${msg.chat.first_name}, city: ${city}, date: ${date}`);
  let output = 'Ошибка'
  weather.find({search: city, degreeType: 'C'}, function(err, result) {
    try {  
      output = `Погода: 
      ${city.trim()}: ${result[0].current.temperature} °С
      ${translate(result[0].current.skytext)}
      Ощущается как: ${result[0].current.feelslike} °С
      Ветер: ${convertWind(result[0].current.windspeed.match(/\d+/))} м/с`;
    } catch {
      output = `Город ${city} не найден.`;
    }
    bot.sendMessage(msg.chat.id, output);
    if(result[0] && result[0].location) bot.sendLocation(msg.chat.id, result[0].location.lat, result[0].location.long);
    // bot.sendLocation()
  });
});

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
let convertWind = (str) => { 
  return Math.round(Number(str) / 0.36)/10||str;
};

// --------------------ДАТА-----------------------
function printDate(str) {
  let temp = (str) ? str : new Date();
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

// ---------------------RSS------------------------------
bot.onText(/(\/)?(rss) (.+)/, (msg, [source,match]) => {
  let site = msg.text.match(/\ (.+)$/)[1];
    bot.sendMessage(msg.chat.id, 'Посмотрим какие новости...');
  let feedparser = new FeedParser();
  let myJson = myJSON;
  let req = nodefetch(myJson[site].link)
  myJson[site].date = {date: Date.now()};
  fs.writeFile('./resources/rss.json', JSON.stringify( myJson ), (err) => {if (err) {console.error(err);return}})

  req.then(function (res) {
    if (res.status !== 200) {throw new Error('Bad status code')}
    else {res.body.pipe(feedparser)}
  }, function (err) {
    console.log('err: ', err);
    bot.sendMessage(msg.chat.id, 'Я ничего не нашла(');
  });
  feedparser.on('error', function (error) {
    console.log('error: ', error);
    bot.sendMessage(msg.chat.id, 'Я ничего не нашла(');
  });
  let i = 0;
  let output = 'Новости:';
  feedparser.on('readable', function () {
    let stream = this;
    let meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
    let item;
    let temp = new Date();

    while (item = stream.read()) {
      i ++;
      let date = new Date(item.pubDate)||new Date();
      if (date > myJson[site].date||i<6) {
        output += `
       [${date.getHours()}:${date.getMinutes()}] [${item.title}](${item.link})
        `;
      }
    }
  })
  setTimeout(() => {
    bot.sendMessage(msg.chat.id, output, { parse_mode: 'Markdown', disable_web_page_preview: true });
    console.log('output: ', output);
  }, 1000);
});
// ---------------------BASH-RSS-------------------------
bot.onText(/(\/)?(bash|баш)/, (msg, [source,match]) => {
  // console.log('msg: ', msg);
  // let feedparser = new FeedParser();
  // let req = nodefetch('https://bash.im/rss/')
  // req.then(function (res) {
  //   if (res.status !== 200) {throw new Error('Bad status code')}
  //   else {res.body.pipe(feedparser)}
  // }, function (err) {
  //   console.log('err: ', err);
  //   bot.sendMessage(msg.chat.id, 'Я ничего не нашла(');
  // });
  // feedparser.on('error', function (error) {
  //   console.log('error: ', error);
  //   bot.sendMessage(msg.chat.id, 'Я ничего не нашла(');
  // });
  // let i = 0;
  // let output = 'Новости:';
  // feedparser.on('readable', function () {
  //   let stream = this;
  //   let item;
  //   // while (item = stream.read()) {
  //     i ++;
  //     // let date = new Date(item.pubDate)||new Date();
  //     if (i===1) {
  //       output = item.description.split('<br>').join('\n');
  //       bot.sendMessage(msg.chat.id, output);
  //     }
  //   // }
  // });

  //quote__body
  console.log('bash');
  let link = 'https://bash.im/random';
  fetch(link)
    .then(response => {
      console.log('response: ', response);
      if (response.status !== 200) return;
      return response.json();
    })
    .then(res => {
      console.log('res:', res); 
      bot.sendMessage(msg.chat.id, res);
    })
    .catch(err => {
      console.error('Err:', err);
      bot.sendMessage(msg.chat.id, `ошибка: ${err}, как-то так`);
    })
});

// ---------------------TRANSLATE------------------------
bot.onText(/\/((T|t)|(П|п))/, (msg, [source,match]) => {
  let text = msg.text.match(/\ (.+)$/)[1];
  let link = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t&dt=bd&dj=1&text=${text}&tl=en`
  const {id} = msg.chat;
  fetch(link)
    .then(response => {
      console.log('response: ', response);
      if (response.status !== 200) return;
      return response.json();
    })
    .then(res => {console.log('res:', res); bot.sendMessage(id, res.sentences.trans)})
    .catch(err => {
      console.error('Err:', err);
      bot.sendMessage(id, `ошибка: ${err}, как-то так`)
    })
})
