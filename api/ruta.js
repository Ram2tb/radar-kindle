export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "N/A", debug: "Sin patente" });

    // Buscador web en un solo paso
    const targetUrl = `https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=1`;
    
    // El proxy definitivo para saltar Cloudflare
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(proxyUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) return res.status(200).json({ route: "N/A", debug: `Muro final: ${response.status}` });
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const origin = data.results[0].detail?.schd_from;
            const destination = data.results[0].detail?.schd_to;
            
            if (origin && destination) {
                return res.status(200).json({ 
                    route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
                    debug: "Éxito CorsProxy"
                });
            }
        }
        return res.status(200).json({ route: "N/A", debug: "Vuelo sin ruta pública" });
    } catch (e) {
        return res.status(200).json({ route: "N/A", debug: `Crash: ${e.message}` });
    }
}
