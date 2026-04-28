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
    <title>Hex-Donghua API Docs</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            /* Warna Tema Gelap */
            --bg-body: #0a0a0a;
            --bg-sidebar: #111111;
            --border: #222222;
            --text-main: #ededed;
            --text-muted: #a0a0a0;
            --accent: #ffffff; /* Putih bersih untuk aksen di mode gelap */
            --code-bg: #1a1a1a;
            --method-get: #ffffff;
            --card-bg: #141414;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { box-sizing: border-box; }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-body);
            color: var(--text-main);
            margin: 0;
            display: flex;
            min-height: 100vh;
            scroll-behavior: smooth;
        }

        /* --- Sidebar Navigation --- */
        aside {
            width: 280px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            padding: 40px 24px;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }

        .brand { 
            font-weight: 600; 
            font-size: 1.2rem; 
            margin-bottom: 40px; 
            letter-spacing: -0.5px;
            color: var(--text-main);
        }
        
        nav ul { list-style: none; padding: 0; }
        nav li { margin-bottom: 12px; }
        nav a {
            text-decoration: none;
            color: var(--text-muted);
            font-size: 0.9rem;
            transition: var(--transition);
        }
        nav a:hover { color: var(--accent); padding-left: 5px; }

        /* --- Main Content --- */
        main {
            margin-left: 280px;
            padding: 60px 80px;
            max-width: 1000px;
            width: 100%;
            animation: fadeIn 0.8s ease-out;
        }

        header { margin-bottom: 60px; }
        header h1 { font-size: 2.5rem; font-weight: 600; margin: 0 0 10px 0; letter-spacing: -1px; }
        header p { color: var(--text-muted); font-size: 1.1rem; }
        .host { 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 0.85rem; 
            color: #00ff88; /* Warna hijau mint lembut untuk host di mode gelap */
            background: var(--code-bg); 
            padding: 4px 10px; 
            border-radius: 4px; 
        }

        /* --- Endpoint Cards --- */
        .endpoint {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 32px;
            margin-bottom: 40px;
            transition: var(--transition);
            opacity: 0;
            transform: translateY(20px);
        }
        
        .endpoint.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .endpoint:hover {
            border-color: #444;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .badge-container { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        
        .method {
            background: var(--accent);
            color: #000; /* Hitam pada background putih di mode gelap */
            font-size: 0.7rem;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
        }

        code {
            font-family: 'JetBrains Mono', monospace;
            background: var(--code-bg);
            padding: 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            color: #d1d1d1;
            display: block;
            margin-top: 10px;
            border: 1px solid var(--border);
            transition: var(--transition);
        }

        .endpoint:hover code { border-color: #555; background: #222; }

        .desc { color: var(--text-muted); margin: 20px 0; font-size: 0.95rem; }

        .btn-try {
            display: inline-flex;
            align-items: center;
            text-decoration: none;
            background: #222;
            color: var(--text-main);
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid var(--border);
            transition: var(--transition);
        }

        .btn-try:hover {
            background: var(--accent);
            color: #000;
            transform: scale(1.02);
            box-shadow: 0 4px 15px rgba(255,255,255,0.1);
        }

        footer {
            margin-top: 80px;
            border-top: 1px solid var(--border);
            padding-top: 40px;
            color: var(--text-muted);
            font-size: 0.85rem;
            text-align: center;
        }

        /* --- Animations --- */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @media (max-width: 768px) {
            aside { display: none; }
            main { margin-left: 0; padding: 40px 20px; }
        }
    </style>
</head>
<body>

    <aside>
        <div class="brand">HEX DOCS</div>
        <nav>
            <ul>
                <li><a href="#">Introduction</a></li>
                <li><a href="#api-home">Home Data</a></li>
                <li><a href="#api-detail">Anime Detail</a></li>
                <li><a href="#api-watch">Watch Stream</a></li>
                <li><a href="#api-search">Search</a></li>
                <li><a href="#api-others">Categories</a></li>
            </ul>
        </nav>
    </aside>

    <main>
        <header>
            <h1>Hex-Donghua</h1>
            <p>Rest API | <span id="current-host" class="host">Loading...</span></p>
        </header>

        <div class="endpoint" id="api-home">
            <div class="badge-container">
                <span class="method">GET</span>
            </div>
            <code class="url-code">/api/home</code>
            <p class="desc">Mengambil data halaman depan (Slider, Populer, Terbaru).</p>
            <a href="/api/home" target="_blank" class="btn-try">Try It Out</a>
        </div>

        <div class="endpoint" id="api-detail">
            <div class="badge-container">
                <span class="method">GET</span>
            </div>
            <code class="url-code">/api/detail?slug=tales-of-herding-gods/</code>
            <p class="desc">Mengambil detail anime & daftar episode.</p>
            <a href="/api/detail?slug=tales-of-herding-gods/" target="_blank" class="btn-try">Try It Out</a>
        </div>

        <div class="endpoint" id="api-watch">
            <div class="badge-container">
                <span class="method">GET</span>
            </div>
            <code class="url-code">/api/watch?slug=tales-of-herding-gods-episode-78-subtitle-indonesia/</code>
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

        <footer>
            © 2026 Henkaramazov. All rights reserved.
        </footer>
    </main>

    <script>
        const host = window.location.origin;
        document.getElementById('current-host').innerText = host;
        
        document.querySelectorAll('.url-code').forEach(el => {
            el.innerText = host + el.innerText;
        });

        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.endpoint').forEach(el => {
            observer.observe(el);
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
