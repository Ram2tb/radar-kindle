export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "N/A", debug: "Sin patente" });

    // API interna de la app móvil
    const url = `https://api.flightradar24.com/common/v1/flight/list.json?query=${callsign}&fetchBy=flight&page=1&limit=1`;

    try {
        // Disfrazamos a Vercel de celular Android usando la App oficial
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Flightradar24/9.3.0 (Android; 12; Mobile)",
                "Accept-Encoding": "gzip",
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) return res.status(200).json({ route: "N/A", debug: `Bloqueo Directo: ${response.status}` });
        
        const data = await response.json();
        
        if (data.result && data.result.response && data.result.response.data && data.result.response.data.length > 0) {
            const flight = data.result.response.data[0];
            const origin = flight.airport?.origin?.code?.iata;
            const destination = flight.airport?.destination?.code?.iata;
            
            if (origin && destination) {
                return res.status(200).json({ 
                    route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
                    debug: "Éxito App Android"
                });
            }
        }
        return res.status(200).json({ route: "N/A", debug: "Sin aeropuertos cargados" });
    } catch (e) {
        return res.status(200).json({ route: "N/A", debug: `Crash: ${e.message}` });
    }
}
