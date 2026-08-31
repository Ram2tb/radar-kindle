export default async function handler(req, res) {
    // Escudos Anti-Caché: Obligamos a pedir datos en tiempo real
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { callsign } = req.query;
    if (!callsign) {
        return res.status(200).json({ route: "N/A", debug: "Paso 0: Sin callsign" });
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "application/json"
    };

    try {
        // Paso 1: Buscar en FR24
        const searchUrl = `https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=3`;
        const searchRes = await fetch(searchUrl, { headers });
        
        if (!searchRes.ok) {
            return res.status(200).json({ route: "N/A", debug: `Paso 1 Falló: HTTP ${searchRes.status}` });
        }
        
        const searchData = await searchRes.json();

        if (!searchData.results || searchData.results.length === 0) {
            return res.status(200).json({ route: "N/A", debug: "Paso 1 Falló: FR24 no encontró el callsign" });
        }

        const flightMatch = searchData.results.find(r => r.type === 'live' || r.type === 'schedule') || searchData.results[0];
        const flightId = flightMatch.id;

        if (!flightId) {
            return res.status(200).json({ route: "N/A", debug: "Paso 1 Falló: Sin ID interno" });
        }

        // Paso 2: Extraer detalles
        const detailUrl = `https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=${flightId}`;
        const detailRes = await fetch(detailUrl, { headers });
        
        if (!detailRes.ok) {
            return res.status(200).json({ route: "N/A", debug: `Paso 2 Falló: HTTP ${detailRes.status}` });
        }

        const detailData = await detailRes.json();

        const origin = detailData.airport?.origin?.code?.iata || "???";
        const destination = detailData.airport?.destination?.code?.iata || "???";

        if (origin === "???" && destination === "???") {
            return res.status(200).json({ route: "N/A", debug: "Paso 2 Falló: JSON sin aeropuertos" });
        }

        // Éxito
        return res.status(200).json({ 
            route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
            debug: "Éxito"
        });

    } catch (error) {
        return res.status(200).json({ route: "N/A", debug: `Error Crash: ${error.message}` });
    }
}
