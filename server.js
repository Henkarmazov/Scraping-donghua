const express = require('express');
const cors = require('cors');
const scraper = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- HALAMAN DOKUMENTASI (Docs) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DonghuaFilm API Docs</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
                :root { --primary: #6366f1; --bg: #0f172a; --card: #1e293b; --text: #f1f5f9; }
                body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; padding: 20px; margin: 0; }
                .container { max-width: 900px; margin: 0 auto; }
                header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 20px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                h1 { margin: 0; font-size: 2.5rem; }
                .endpoint { background: var(--card); padding: 25px; border-radius: 15px; margin-bottom: 20px; border-left: 5px solid var(--primary); position: relative; }
                code { background: #334155; padding: 5px 10px; border-radius: 8px; color: #38bdf8; font-size: 0.9rem; word-break: break-all; }
                .method { font-weight: bold; color: #10b981; margin-right: 10px; }
                .desc { color: #94a3b8; margin: 15px 0; }
                .param { font-size: 0.85rem; color: #fbbf24; margin-bottom: 15px; }
                .btn-try { 
                    display: inline-block; padding: 10px 20px; background: var(--primary); color: white; 
                    text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem;
                    transition: all 0.3s; cursor: pointer; border: none;
                }
                .btn-try:hover { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4); }
                .host { color: #6366f1; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>DonghuaFilm API 🚀</h1>
                    <p>Scraper API modern | <span id="current-host" class="host">Loading...</span></p>
                </header>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/home</code>
                    <p class="desc">Mengambil data halaman depan (Slider, Populer, Terbaru).</p>
                    <a href="/api/home" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/detail?slug=tales-of-herding-gods/</code>
                    <p class="desc">Mengambil detail anime & daftar episode.</p>
                    <a href="/api/detail?slug=tales-of-herding-gods/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/watch?slug=tales-of-herding-gods-episode-78-subtitle-indonesia/</code>
                    <p class="desc">Mengambil link video, mirror, dan navigasi episode.</p>
                    <a href="/api/watch?slug=tales-of-herding-gods-episode-78-subtitle-indonesia/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/search?q=martial god</code>
                    <p class="desc">Mencari donghua berdasarkan judul.</p>
                    <a href="/api/search?q=martial god" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/network?slug=bilibili/</code>
                    <p class="desc">List anime berdasarkan Network.</p>
                    <a href="/api/network?slug=bilibili/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/studio?slug=motion-magic/</code>
                    <p class="desc">List anime berdasarkan Studio.</p>
                    <a href="/api/studio?slug=motion-magic/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/genre?slug=action/</code>
                    <p class="desc">List anime berdasarkan Genre.</p>
                    <a href="/api/genre?slug=action/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/season?slug=fall-2024/</code>
                    <p class="desc">List anime berdasarkan Season.</p>
                    <a href="/api/season?slug=fall-2024/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <div class="endpoint">
                    <span class="method">GET</span> <code class="url-code">/api/country?slug=china/</code>
                    <p class="desc">List anime berdasarkan Negara.</p>
                    <a href="/api/country?slug=china/" target="_blank" class="btn-try">Try It Out</a>
                </div>

                <footer style="text-align: center; padding: 40px; color: #64748b;">
                    Dibuat dengan ❤️ untuk Scraper Community
                </footer>
            </div>

            <script>
                const host = window.location.origin;
                document.getElementById('current-host').innerText = host;
                
                // Update text di dalam code tags
                document.querySelectorAll('.url-code').forEach(el => {
                    el.innerText = host + el.innerText;
                });
            </script>
        </body>
        </html>
    `);
});

// --- API ROUTES ---
app.get('/api/:route', async (req, res) => {
    const { route } = req.params;
    let { slug, q } = req.query;

    // Normalisasi slug (lowercase dan hilangkan spasi jika ada)
    if (slug) slug = slug.toLowerCase().trim();

    try {
        let data;
        let targetUrl = '';

        // Helper untuk construct URL
        const getUrl = (prefix, param) => {
            if (!param) return null;
            return param.startsWith('http') ? param : (scraper.BASE_URL + prefix + param);
        };

        switch (route) {
            case 'home':
                data = await scraper.scrapeDonghua();
                break;

            case 'detail':
                targetUrl = getUrl('anime/', slug);
                if (!targetUrl) return res.status(400).json({ error: 'Slug is required' });
                data = await scraper.scrapeDetailsPage(targetUrl);
                break;

            case 'watch':
                if (!slug) return res.status(400).json({ error: 'Slug is required' });
                targetUrl = slug.startsWith('http') ? slug : (scraper.BASE_URL + slug);
                data = await scraper.scrapeWatchPage(targetUrl);
                break;

            case 'search':
                if (!q) return res.status(400).json({ error: 'Query (q) is required' });
                targetUrl = q.includes('page/') ? (scraper.BASE_URL + q) : `${scraper.BASE_URL}?s=${encodeURIComponent(q)}`;
                data = await scraper.scrapeSearchPage(targetUrl);
                break;

            case 'network':
                targetUrl = getUrl('network/', slug);
                if (!targetUrl) return res.status(400).json({ error: 'Slug is required' });
                data = await scraper.scrapeNetworkPage(targetUrl);
                break;

            case 'studio':
                targetUrl = getUrl('studio/', slug);
                if (!targetUrl) return res.status(400).json({ error: 'Slug is required' });
                data = await scraper.scrapeStudioPage(targetUrl);
                break;

            case 'genre':
                targetUrl = getUrl('genres/', slug);
                if (!targetUrl) return res.status(400).json({ error: 'Slug is required' });
                data = await scraper.scrapeGenrePage(targetUrl);
                break;

            case 'season':
                targetUrl = getUrl('season/', slug);
                if (!targetUrl) return res.status(400).json({ error: 'Slug is required' });
                data = await scraper.scrapeSeasonPage(targetUrl);
                break;

            case 'country':
                targetUrl = getUrl('country/', slug);
                if (!targetUrl) return res.status(400).json({ error: 'Slug is required' });
                data = await scraper.scrapeCountryPage(targetUrl);
                break;

            default:
                return res.status(404).json({ error: 'Route not found' });
        }

        if (!data) {
            return res.status(404).json({ 
                error: 'Data not found', 
                message: `Make sure the slug '${slug || q}' is correct and exists on the website.` 
            });
        }
        
        res.json(data);

    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        res.status(statusCode).json({ 
            error: statusCode === 404 ? 'Data not found' : 'Internal Server Error',
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
    console.log(`📝 Documentation: http://localhost:${PORT}\n`);
});
