export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "N/A", debug: "Sin patente" });

    // Puerta trasera: Atacamos la API de la app móvil de FR24 en lugar de su web
    const targetUrl = `https://api.flightradar24.com/common/v1/flight/list.json?query=${callsign}&fetchBy=flight&page=1&limit=1`;
    
    // Máscara nueva: Usamos CodeTabs en lugar de AllOrigins
    const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(proxyUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        
        if (!response.ok) return res.status(200).json({ route: "N/A", debug: `Proxy Bloqueado: ${response.status}` });
        
        const data = await response.json();
        
        if (data.result && data.result.response && data.result.response.data && data.result.response.data.length > 0) {
            const flight = data.result.response.data[0];
            const origin = flight.airport?.origin?.code?.iata;
            const destination = flight.airport?.destination?.code?.iata;
            
            if (origin && destination) {
                return res.status(200).json({ 
                    route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
                    debug: "Éxito CodeTabs"
                });
            }
        }
        return res.status(200).json({ route: "N/A", debug: "Vuelo sin aeropuertos cargados" });
    } catch (e) {
        return res.status(200).json({ route: "N/A", debug: `Crash: ${e.message}` });
    }
}
