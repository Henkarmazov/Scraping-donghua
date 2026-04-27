const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper for donghuafilm.com
 * Designed to mimic a real browser with 100% precision headers.
 */

const BASE_URL = 'https://donghuafilm.com/';

// Header yang 10000000% mirip browser asli (Chrome on Windows)
const browserHeaders = {
    'authority': 'donghuafilm.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function scrapeDonghua() {
    try {
        console.log(`[info] Fetching data from ${BASE_URL}...`);
        
        const response = await axios.get(BASE_URL, { headers: browserHeaders });
        const $ = cheerio.load(response.data);
        
        const results = {
            slider: [],
            popularToday: [],
            latestRelease: [],
            recommendations: {}
        };

        // 1. Scrape Slider
        $('#slidertwo .swiper-slide.item').each((i, el) => {
            // Abaikan slide duplicate dari swiper
            if ($(el).hasClass('swiper-slide-duplicate')) return;

            const title = $(el).find('h2 a').text().trim();
            const link = $(el).find('h2 a').attr('href');
            
            // Mencari tag <p> yang memiliki teks (bukan <p></p> kosong)
            const desc = $(el).find('.info p')
                .filter((index, element) => $(element).text().trim().length > 0)
                .first()
                .text()
                .trim();
            
            // Extract image from background-image style
            const style = $(el).find('.backdrop').attr('style') || '';
            const imgMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
            const image = imgMatch ? imgMatch[1] : null;

            results.slider.push({ title, link, image, description: desc });
        });

        // 2. Scrape Popular Today
        $('.hothome').next('.listupd').find('article.bs').each((i, el) => {
            const title = $(el).find('.tt h2').text().trim();
            const link = $(el).find('a').attr('href');
            const episode = $(el).find('.epx').text().trim();
            const type = $(el).find('.typez').text().trim();
            const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');

            results.popularToday.push({ title, link, episode, type, image });
        });

        // 3. Scrape Latest Release
        $('.latesthome').next('.listupd').find('article.bs').each((i, el) => {
            const title = $(el).find('.tt h2').text().trim();
            const link = $(el).find('a').attr('href');
            const episode = $(el).find('.epx').text().trim();
            const type = $(el).find('.typez').text().trim();
            const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');

            results.latestRelease.push({ title, link, episode, type, image });
        });

        // 4. Scrape Recommendations (Tabs)
        $('.series-gen .tab-pane').each((i, el) => {
            const tabId = $(el).attr('id');
            const tabName = $(`.nav-tabs li a[href="#${tabId}"]`).text().trim() || tabId;
            
            results.recommendations[tabName] = [];

            $(el).find('article.bs').each((j, art) => {
                const title = $(art).find('.tt h2').text().trim();
                const link = $(art).find('a').attr('href');
                const status = $(art).find('.epx').text().trim();
                const image = $(art).find('img').attr('data-src') || $(art).find('img').attr('src');

                results.recommendations[tabName].push({ title, link, status, image });
            });
        });

        console.log('[success] Scraping complete!');
        console.log(JSON.stringify(results, null, 2));
        
        return results;

    } catch (error) {
        console.error('[error] Failed to scrape:', error.message);
        if (error.response && error.response.status === 403) {
            console.error('[hint] Cloudflare might be blocking. Consider using puppeteer-extra-plugin-stealth.');
        }
    }
}

async function scrapeWatchPage(url) {
    try {
        console.log(`[info] Fetching watch page: ${url}...`);
        const response = await axios.get(url, { headers: browserHeaders });
        const $ = cheerio.load(response.data);

        const results = {
            title: $('.entry-title').text().trim(),
            episode: $('meta[itemprop="episodeNumber"]').attr('content'),
            videoSource: $('#embed_holder video source').attr('src'),
            mirrors: [],
            navigation: {
                prev: $('.naveps a[rel="prev"]').attr('href'),
                next: $('.naveps a[rel="next"]').attr('href'),
                allEpisodes: $('.naveps .nvsc a').attr('href')
            },
            seriesInfo: {
                title: $('.infox h2').text().trim(),
                rating: $('.rating strong').text().replace('Rating ', '').trim(),
                status: $('.spe span:contains("Status")').text().replace('Status:', '').trim(),
                network: $('.spe span:contains("Network")').find('a').text().trim(),
                studio: $('.spe span:contains("Studio")').find('a').text().trim(),
                released: $('.spe span:contains("Released")').text().replace('Released:', '').trim(),
                duration: $('.spe span:contains("Duration")').text().replace('Duration:', '').trim(),
                type: $('.spe span:contains("Type")').text().replace('Type:', '').trim(),
                genres: $('.genxed a').map((i, el) => $(el).text().trim()).get(),
                synopsis: $('.desc.mindes').text().trim()
            },
            episodeList: []
        };

        // Scrape Mirror Servers (Decode Base64 if found)
        $('select.mirror option').each((i, el) => {
            const name = $(el).text().trim();
            const value = $(el).val();
            if (!value) return;

            let decodedSource = '';
            try {
                // Mencoba decode base64 untuk mengambil src video asli
                const decoded = Buffer.from(value, 'base64').toString('utf8');
                const srcMatch = decoded.match(/src="([^"]+)"/);
                decodedSource = srcMatch ? srcMatch[1] : value;
            } catch (e) {
                decodedSource = value;
            }

            results.mirrors.push({ name, source: decodedSource });
        });

        // Scrape Episode List
        $('.episodelist ul li').each((i, el) => {
            results.episodeList.push({
                title: $(el).find('h3').text().trim(),
                link: $(el).find('a').attr('href'),
                epsNum: $(el).find('.playinfo h3').text().match(/Eps (\d+)/)?.[1] || i + 1,
                date: $(el).find('.playinfo span').text().split(' - ').pop()
            });
        });

        console.log('[success] Watch page scraped!');
        return results;
    } catch (error) {
        console.error('[error] Failed to scrape watch page:', error.message);
    }
}

async function scrapeDetailsPage(url) {
    try {
        console.log(`[info] Fetching details page: ${url}...`);
        const response = await axios.get(url, { headers: browserHeaders });
        const $ = cheerio.load(response.data);

        const results = {
            title: $('.entry-title').first().text().trim(),
            thumb: $('.thumb img').attr('data-src') || $('.thumb img').attr('src'),
            bigCover: $('.bigcover img').attr('data-src') || $('.bigcover img').attr('src'),
            rating: $('.rating strong').first().text().replace('Rating ', '').trim(),
            followers: $('.bmc strong').text().trim(),
            synopsis: $('.entry-content[itemprop="description"]').text().trim(),
            details: {
                status: $('.spe span:contains("Status")').text().replace('Status:', '').trim(),
                network: $('.spe span:contains("Network")').find('a').text().trim(),
                studio: $('.spe span:contains("Studio")').find('a').text().trim(),
                released: $('.spe span:contains("Released")').first().text().replace('Released:', '').trim(),
                duration: $('.spe span:contains("Duration")').text().replace('Duration:', '').trim(),
                season: $('.spe span:contains("Season")').find('a').text().trim(),
                country: $('.spe span:contains("Country")').find('a').text().trim(),
                type: $('.spe span:contains("Type")').text().replace('Type:', '').trim(),
                fansub: $('.spe span:contains("Fansub")').text().replace('Fansub:', '').trim(),
                updatedOn: $('.spe span:contains("Updated on")').find('time').text().trim()
            },
            genres: $('.genxed a').map((i, el) => $(el).text().trim()).get(),
            episodes: []
        };

        // Scrape Episode List
        $('.eplister ul li').each((i, el) => {
            const link = $(el).find('a').attr('href');
            const num = $(el).find('.epl-num').text().trim();
            const title = $(el).find('.epl-title').text().trim();
            const sub = $(el).find('.epl-sub').text().trim();
            const date = $(el).find('.epl-date').text().trim();

            results.episodes.push({ num, title, sub, date, link });
        });

        console.log('[success] Details page scraped!');
        return results;
    } catch (error) {
        console.error('[error] Failed to scrape details page:', error.message);
    }
}

// --- HELPER UNTUK HALAMAN LIST (Network, Studio, Country, Genre, Search) ---
async function scrapeCommonListPage(url, label) {
    try {
        console.log(`[info] Fetching ${label} page: ${url}...`);
        const response = await axios.get(url, { headers: browserHeaders });
        const $ = cheerio.load(response.data);

        const results = {
            headerTitle: $('.releases h1').text().trim(),
            animeList: [],
            pagination: []
        };

        $('.listupd article.bs').each((i, el) => {
            const title = $(el).find('.tt h2').text().trim() || $(el).find('a').attr('title');
            const link = $(el).find('a').attr('href');
            const status = $(el).find('.epx').text().trim();
            const type = $(el).find('.typez').text().trim();
            const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');

            results.animeList.push({ title, link, status, type, image });
        });

        $('.pagination .page-numbers').each((i, el) => {
            const pageNum = $(el).text().trim();
            const pageLink = $(el).attr('href');
            const isCurrent = $(el).hasClass('current');
            if (pageNum) results.pagination.push({ pageNum, pageLink, isCurrent });
        });

        console.log(`[success] ${label} page scraped!`);
        return results;
    } catch (error) {
        console.error(`[error] Failed to scrape ${label} page:`, error.message);
    }
}

async function scrapeNetworkPage(url) { return await scrapeCommonListPage(url, 'Network'); }
async function scrapeStudioPage(url) { return await scrapeCommonListPage(url, 'Studio'); }
async function scrapeCountryPage(url) { return await scrapeCommonListPage(url, 'Country'); }
async function scrapeGenrePage(url) { return await scrapeCommonListPage(url, 'Genre'); }
async function scrapeSearchPage(url) { return await scrapeCommonListPage(url, 'Search'); }


async function scrapeSeasonPage(url) {
    try {
        console.log(`[info] Fetching season page: ${url}...`);
        const response = await axios.get(url, { headers: browserHeaders });
        const $ = cheerio.load(response.data);

        const results = {
            seasonName: $('h1').text().trim() || 'Season Page',
            animeList: []
        };

        // Scrape Season Cards
        $('.listseries .card').each((i, el) => {
            const title = $(el).find('.card-title h2').text().trim();
            const link = $(el).find('a').first().attr('href');
            const image = $(el).find('.card-thumb img').attr('data-src') || $(el).find('.card-thumb img').attr('src');
            const studio = $(el).find('.studio').text().trim();
            const status = $(el).find('.status').text().trim();
            const rating = $(el).find('.stats .right span').text().trim();
            const info = $(el).find('.stats .left span').first().text().trim(); // e.g. "26 episodes · Donghua"
            const synopsis = $(el).find('.desc p').text().trim();
            const genres = $(el).find('.card-info-bottom a').map((i, g) => $(g).text().trim()).get();

            results.animeList.push({
                title, link, image, studio, status, rating, info, synopsis, genres
            });
        });

        console.log('[success] Season page scraped!');
        return results;
    } catch (error) {
        console.error('[error] Failed to scrape season page:', error.message);
    }
}

// --- CLI HANDLER ---
const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

async function main() {
    switch (command) {
        case 'home':
            await scrapeDonghua();
            break;

        case 'watch':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug halaman watch.');
                process.exit(1);
            }
            const watchUrl = param.startsWith('http') ? param : (BASE_URL + param);
            const watchData = await scrapeWatchPage(watchUrl);
            if (watchData) console.log(JSON.stringify(watchData, null, 2));
            break;

        case 'detail':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug halaman detail anime.');
                process.exit(1);
            }
            let detailUrl = param;
            if (!param.startsWith('http')) {
                detailUrl = param.includes('anime/') ? (BASE_URL + param) : (BASE_URL + 'anime/' + param);
            }
            const detailData = await scrapeDetailsPage(detailUrl);
            if (detailData) console.log(JSON.stringify(detailData, null, 2));
            break;

        case 'network':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug network.');
                process.exit(1);
            }
            let netUrl = param;
            if (!param.startsWith('http')) {
                netUrl = param.includes('network/') ? (BASE_URL + param) : (BASE_URL + 'network/' + param);
            }
            const netData = await scrapeNetworkPage(netUrl);
            if (netData) console.log(JSON.stringify(netData, null, 2));
            break;

        case 'studio':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug studio.');
                process.exit(1);
            }
            let studioUrl = param;
            if (!param.startsWith('http')) {
                studioUrl = param.includes('studio/') ? (BASE_URL + param) : (BASE_URL + 'studio/' + param);
            }
            const studioData = await scrapeStudioPage(studioUrl);
            if (studioData) console.log(JSON.stringify(studioData, null, 2));
            break;

        case 'season':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug season.');
                process.exit(1);
            }
            let seasonUrl = param;
            if (!param.startsWith('http')) {
                seasonUrl = param.includes('season/') ? (BASE_URL + param) : (BASE_URL + 'season/' + param);
            }
            const seasonData = await scrapeSeasonPage(seasonUrl);
            if (seasonData) console.log(JSON.stringify(seasonData, null, 2));
            break;

        case 'country':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug country.');
                process.exit(1);
            }
            let countryUrl = param;
            if (!param.startsWith('http')) {
                countryUrl = param.includes('country/') ? (BASE_URL + param) : (BASE_URL + 'country/' + param);
            }
            const countryData = await scrapeCountryPage(countryUrl);
            if (countryData) console.log(JSON.stringify(countryData, null, 2));
            break;

        case 'genre':
            if (!param) {
                console.error('[error] Silakan masukkan URL atau slug genre.');
                process.exit(1);
            }
            let genreUrl = param;
            if (!param.startsWith('http')) {
                genreUrl = param.includes('genres/') ? (BASE_URL + param) : (BASE_URL + 'genres/' + param);
            }
            const genreData = await scrapeGenrePage(genreUrl);
            if (genreData) console.log(JSON.stringify(genreData, null, 2));
            break;

        case 'search':
            if (!param) {
                console.error('[error] Silakan masukkan query pencarian.');
                process.exit(1);
            }
            let searchUrl = param;
            if (!param.startsWith('http')) {
                if (param.includes('page/')) {
                    searchUrl = BASE_URL + param;
                } else {
                    searchUrl = `${BASE_URL}?s=${encodeURIComponent(param)}`;
                }
            }
            const searchData = await scrapeSearchPage(searchUrl);
            if (searchData) console.log(JSON.stringify(searchData, null, 2));
            break;

        default:
            console.log('\n--- DonghuaFilm Scraper CLI ---');
            console.log('Penggunaan:');
            console.log('  node scraper.js home               (Scrape halaman depan)');
            console.log('  node scraper.js watch <slug/url>   (Scrape halaman nonton)');
            console.log('  node scraper.js detail <slug/url>  (Scrape detail anime)');
            console.log('  node scraper.js network <slug/url> (Scrape daftar network)');
            console.log('  node scraper.js studio <slug/url>  (Scrape daftar studio)');
            console.log('  node scraper.js season <slug/url>  (Scrape daftar season)');
            console.log('  node scraper.js country <slug/url> (Scrape daftar country)');
            console.log('  node scraper.js genre <slug/url>   (Scrape daftar genre)');
            console.log('  node scraper.js search <query>     (Cari anime)');
            console.log('\nContoh:');
            console.log('  node scraper.js search "martial god"');
            console.log('  node scraper.js search "page/2/?s=a"');
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    BASE_URL,
    scrapeDonghua,
    scrapeWatchPage,
    scrapeDetailsPage,
    scrapeNetworkPage,
    scrapeStudioPage,
    scrapeSeasonPage,
    scrapeCountryPage,
    scrapeGenrePage,
    scrapeSearchPage
};
