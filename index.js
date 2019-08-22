/** 
 * Watch for changes to multiple filtered queries of articles.
 * Parse the results and generate a HTML report. 
*/

const fs = require('fs').promises;
const requests = require('request-promise-native');
const cheerio = require('cheerio');


const BOLHA_URL = 'http://www.bolha.com';


let fetch = async function (url) {
    let options = {
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    };
    return await requests.get(options);
};

let fetch_page = async function (url, page) {
    let full_url = url + `&page=${page}`;
    let html = await fetch(full_url);
    return cheerio.load(html);
};

let build_query_url = function (query, sort = 1) {
    const query_fmt = `/iskanje?q=${query}&sort=${sort}`;
    return BOLHA_URL + query_fmt;
}

let get_page_count = function ($) {
    let el = $('div.pager a.last');
    return el.length > 0 ? parseInt(el.first().text()) : 1;
};

let get_articles_on_page = function ($) {
    let articles = [];
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
};

let get_articles = async function (url, pages=-1) {
    // If `pages` is -1, get all pages otherwise, up to `pages`

    console.log('Fetching page 1 ...');
    const $ = await fetch_page(url, 1);
    let page_count = get_page_count($);
    let page_end = pages <= 0 ? page_count : Math.min(page_count, pages)

    let articles = get_articles_on_page($);

    async function fetch_and_parse_page(page) {
        console.log(`Fetching page ${page} ...`);
        let page$ = await fetch_page(url, page);
        for (let article of get_articles_on_page(page$)) {
            articles.push(article);
        }
    }
    let promises = [];
    for (let page = 2; page <= page_end; ++page) {
        promises.push(fetch_and_parse_page(page));
    }
    await Promise.all(promises);

    return articles;
}

let process_url = async function (url) {
    let articles = await get_articles(url, 1);
    console.log(`Found ${articles.length} articles`);
};

let read_json_file = async function (path) {
    let raw = await fs.readFile(path, { encoding: 'utf8', flag: 'r' });
    return JSON.parse(raw);
};

let main = async function () {
    let settings = await read_json_file('settings.json');
    console.log(settings);

    promises = [];
    for (let url of settings.urls) {
        promises.push(process_url(url));
    }
    await Promise.all(promises);
};


if (require.main === module) {
    main();
}