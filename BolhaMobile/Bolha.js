/** 
 * Watch for changes to multiple filtered queries of articles.
 * Parse the results and generate a HTML report. 
*/

const cheerio = require('react-native-cheerio');

const BOLHA_URL = 'http://www.bolha.com';

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

let build_query_url = function (query, sort = 1) {
    const query_fmt = `/iskanje?q=${query}&sort=${sort}`;
    return BOLHA_URL + query_fmt;
}

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

export let get_articles_query = async function(query) {
    let url = build_query_url(query);
    return await get_articles(url, pages=1);
}

export let process_url = async function (url) {
    let articles = await get_articles(url, 1, false);
    console.log(`Found ${articles.length} articles`);
    return articles;
};

let create_html_report_file = async function (path) {
    let settings = await read_json_file('settings.json');
    
    let stream = fs.createWriteStream(path, { flags: 'w', encoding: 'utf8' });
    stream.write(HTML_HEAD);

    async function proc(url) {
        let articles = await process_url(url);
        for (let article of articles) {
            let html = article_to_html(article);
            stream.write(html);
        }
    }

    promises = [];
    for (let url of settings.urls) {
        promises.push(proc(url));
    }
    await Promise.all(promises);

    stream.write('</body></html>');
    stream.end()
}
