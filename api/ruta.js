export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "N/A", debug: "Sin callsign" });

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
    };

    try {
        // Paso 1: Enmascaramos la búsqueda a través de un Proxy
        const url1 = `https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=3`;
        const proxy1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url1)}`;
        const searchRes = await fetch(proxy1, { headers });
        
        if (!searchRes.ok) return res.status(200).json({ route: "N/A", debug: `Proxy 1 Falló: ${searchRes.status}` });
        
        const searchData = await searchRes.json();
        if (!searchData.results || searchData.results.length === 0) {
            return res.status(200).json({ route: "N/A", debug: "Sin resultados en FR24" });
        }

        const flightMatch = searchData.results.find(r => r.type === 'live' || r.type === 'schedule') || searchData.results[0];
        const flightId = flightMatch.id;
        if (!flightId) return res.status(200).json({ route: "N/A", debug: "Sin ID interno" });

        // Paso 2: Usamos el Proxy para la ruta secreta de aeropuertos
        const url2 = `https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=${flightId}`;
        const proxy2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url2)}`;
        const detailRes = await fetch(proxy2, { headers });
        
        if (!detailRes.ok) return res.status(200).json({ route: "N/A", debug: `Proxy 2 Falló: ${detailRes.status}` });
        
        const detailData = await detailRes.json();
        const origin = detailData.airport?.origin?.code?.iata || "N/A";
        const destination = detailData.airport?.destination?.code?.iata || "N/A";

        if (origin === "N/A" && destination === "N/A") {
            return res.status(200).json({ route: "N/A", debug: "Sin aeropuertos en JSON" });
        }

        return res.status(200).json({ 
            route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
            debug: "Éxito con Proxy"
        });

    } catch (error) {
        return res.status(200).json({ route: "N/A", debug: `Crash: ${error.message}` });
    }
}
