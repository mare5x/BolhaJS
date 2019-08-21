const requests = require('request-promise-native');
const cheerio = require('cheerio');


const BOLHA_URL = 'http://www.bolha.com/';


let fetch = async function (url) {
    return await requests.get(url);
};

let main = async function () {
    let html = await fetch(BOLHA_URL);
    console.log(`${BOLHA_URL} -> ${html.length} bytes`);
};


if (require.main === module) {
    main();
}