export default async function handler(req, res) {
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "" });

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "application/json"
    };

    try {
        // Paso 1: Buscar el vuelo para obtener el ID interno de Flightradar
        const searchUrl = `https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=3`;
        const searchRes = await fetch(searchUrl, { headers });
        const searchData = await searchRes.json();

        if (!searchData.results || searchData.results.length === 0) {
            return res.status(200).json({ route: "" });
        }

        // Seleccionamos el primer vuelo que esté activo ("live")
        const flightMatch = searchData.results.find(r => r.type === 'live' || r.type === 'schedule') || searchData.results[0];
        const flightId = flightMatch.id;

        if (!flightId) return res.status(200).json({ route: "" });

        // Paso 2: Ir a la ruta secreta usando el ID interno para sacar los aeropuertos
        const detailUrl = `https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=${flightId}`;
        const detailRes = await fetch(detailUrl, { headers });
        const detailData = await detailRes.json();

        const origin = detailData.airport?.origin?.code?.iata || "???";
        const destination = detailData.airport?.destination?.code?.iata || "???";

        if (origin === "???" && destination === "???") {
            return res.status(200).json({ route: "" });
        }

        // Devolvemos la ruta armada
        return res.status(200).json({ 
            route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}` 
        });

    } catch (error) {
        return res.status(200).json({ route: "" });
    }
}
