export default async function handler(req, res) {
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "" });

    try {
        // Buscador web de FR24 (mucho más flexible con los códigos crudos)
        const url = `https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        });
        
        const data = await response.json();

        if (data && data.results && data.results.length > 0) {
            const flight = data.results[0];
            
            // FR24 esconde el origen y destino acá
            const origin = flight.detail?.schd_from || "???";
            const destination = flight.detail?.schd_to || "???";

            if (origin === "???" && destination === "???") {
                return res.status(200).json({ route: "" });
            }

            return res.status(200).json({ 
                route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}` 
            });
        }
        return res.status(200).json({ route: "" });
    } catch (error) {
        return res.status(200).json({ route: "" });
    }
}
