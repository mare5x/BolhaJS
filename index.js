const requests = require('request-promise-native');
const cheerio = require('cheerio');


const BOLHA_URL = 'http://www.bolha.com/';

let fetch = async function (url) {
    let options = {
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    };
    return await requests.get(options);
};

let get_articles = async function (query) {
    const query_fmt = `iskanje?q=${query}&sort=1`;
    let url = BOLHA_URL + query_fmt;
    let html = await fetch(url);
    console.log(`Got ${url} -> ${html.length} bytes`);

    let articles = [];
    const $ = cheerio.load(html);
    $('section#list div.ad').each((_, element) => {        
        let el = $(element).find($('div.price')).children().last();
        if (el.length == 0) return;  // skip articles without a price (ads ...)
        let data = new Object();
        data.price = el.text();  // this can be either a float or a string (Kupim ...)
        el = $(element).find($('div.content a[href]')).first();
        data.title = el.attr('title');
        data.link = el.attr('href');
        articles.push(data);
    });
    return articles;
}

let main = async function () {
    let articles = await get_articles('lenovo');
    console.log(articles);
};


if (require.main === module) {
    main();
}