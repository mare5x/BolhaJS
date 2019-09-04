const cheerio = require('react-native-cheerio');

const BOLHA_URL = 'http://www.bolha.com';

const _QUERY_KEY = "iskanje?q";
const _PRICE_SORT_KEY = "priceSortField";
const _SORT_KEY = "sort";
const _AGE_KEY = "datePlaced";

export const SORT_OPTIONS = {
    RELEVANT: 0,
    RECENT_FIRST: 1,
    DUE_FOR_EXPIRATION: 2,
    PRICE_LOWEST_FIRST: 3,
    PRICE_HIGHEST_FIRST: 4
};

export const AGE_OPTIONS = {
    LAST_8_HOURS: "V+zadnjih+8+urah",
    TODAY: "Danes",
    YESTERDAY: "V%C4%8Deraj",
    LAST_WEEK: "Zadnji+teden",
    LAST_MONTH: "Zadnji+mesec",
    OLDER: "Starej%C5%A1i+oglasi"
};

export function sort_option_to_string(option) {
    switch (option) {
        case "RELEVANT": return "Most relevant";
        case "RECENT_FIRST": return "Recent first";
        case "DUE_FOR_EXPIRATION": return "Due for expiration";
        case "PRICE_LOWEST_FIRST": return "Price: lowest first";
        case "PRICE_HIGHEST_FIRST": return "Price: highest first";
    }
}

export function age_option_to_string(option) {
    switch (option) {
        case "LAST_8_HOURS": return "Last 8 hours";
        case "TODAY": return "Today";
        case "YESTERDAY": return "Yesterday";
        case "LAST_WEEK": return "Last week";
        case "LAST_MONTH": return "Last month";
        case "OLDER": return "Older";
    }
}

export class QueryInfo {
    constructor(info) {
        this.query = info.query || '';
        this.price_min = info.price_min || -1;
        this.price_max = info.price_max || -1;
        this.sort = info.sort || SORT_OPTIONS.RECENT_FIRST;
        this.age = info.age || null;
        this.pages = info.pages || 1;
    }

    build_url = () => {
        let q = `/${_QUERY_KEY}=${this.query}`;
        q += `&${_SORT_KEY}=${this.sort}`;
        if (this.price_min >= 0 && this.price_max >= 0) {
            q += `&${_PRICE_SORT_KEY}=${this.price_min}|${this.price_max}`;
        }
        if (this.age) {
            q += `&${_AGE_KEY}=${this.age}`;
        }
        return BOLHA_URL + q;
    }
}

let agent_fetch = async function (url) {
    let resp = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });
    return resp.text();
};

let fetch_page = async function (url, page) {
    let full_url = url + `&page=${page}`;
    let html = await agent_fetch(full_url);
    return cheerio.load(html);
};

let get_page_count = function ($) {
    let el = $('div.pager a.last');
    return el.length > 0 ? parseInt(el.first().text()) : 1;
};

let get_articles_on_page = function ($, raw=false) {
    function parse_href(href) {
        if (href.startsWith("http")) return href;
        return BOLHA_URL + href;
    }

    let articles = [];
    $('section#list div.ad').each((_, element) => {
        let el = $(element).find($('div.price')).children().last();
        if (el.length == 0) return;  // skip articles without a price (ads ...)
        
        if (raw) {
            articles.push(cheerio.html(element));
        } else {
            let data = new Object();
            data.price = el.text();  // this can be either a float or a string (Kupim ...)
            let content = $(element).find($('div.content')).first();
            el = $(content).find($('a[href]')).first();
            data.title = el.attr('title');
            data.link = parse_href(el.attr('href'));
            
            // Skip h3 tag which contains the above link ...
            data.summary = content.contents().filter( (_, el) => {
                return el.name != "h3";
            }).text();

            // Bolha uses lazy image loading ...
            el = $(element).find($('div.image img')).first();
            let img_link = el.attr("data-original");
            if (img_link) {
                data.image = img_link;
            } else {
                data.image = el.attr("src");
            }

            articles.push(data);
        }
    });
    return articles;
};

export let get_articles = async function (url, pages=-1, raw=false) {
    // If `pages` is -1, get all pages otherwise, up to `pages`

    console.log('Fetching page 1 ...');
    const $ = await fetch_page(url, 1);
    let page_count = get_page_count($);
    let page_end = pages <= 0 ? page_count : Math.min(page_count, pages)

    let articles = get_articles_on_page($, raw);

    console.log(articles);

    async function fetch_and_parse_page(page) {
        console.log(`Fetching page ${page} ...`);
        let page$ = await fetch_page(url, page);
        for (let article of get_articles_on_page(page$, raw)) {
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

export let get_articles_query = async function(query_info) {
    let url = query_info.build_url();
    return await get_articles(url, pages=query_info.pages);
}