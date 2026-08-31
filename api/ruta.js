export default async function handler(req, res) {
    const { callsign } = req.query;
    
    // Si es un vuelo privado o no tiene patente comercial, cancelamos
    if (!callsign) {
        return res.status(200).json({ route: "" });
    }

    try {
        // Le preguntamos en secreto a la API pública de Flightradar24
        const url = `https://api.flightradar24.com/common/v1/flight/list.json?query=${callsign}&fetchBy=flight&page=1&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            }
        });
        
        const data = await response.json();

        // Navegamos por el JSON de FR24 para robar los códigos IATA
        if (data.result && data.result.response && data.result.response.data && data.result.response.data.length > 0) {
            const flight = data.result.response.data[0];
            const origin = flight.airport?.origin?.code?.iata || "???";
            const destination = flight.airport?.destination?.code?.iata || "???";

            // Si ambos están vacíos, no hay info
            if (origin === "???" && destination === "???") {
                return res.status(200).json({ route: "" });
            }

            // Devolvemos el formato lindo: "AEP ✈️ COR"
            return res.status(200).json({ route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}` });
        } else {
            return res.status(200).json({ route: "" });
        }
    } catch (error) {
        return res.status(200).json({ route: "" });
    }
}
