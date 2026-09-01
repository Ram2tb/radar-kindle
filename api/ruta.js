export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "N/A", debug: "Sin patente" });

    // Toma la key de Vercel, o usa la que pegues acá abajo entre las comillas
    const API_KEY = process.env.AIRLABS_API_KEY || "TU_API_KEY_ACA"; 

    // El radar suele escupir el código ICAO militar (ej: JES3111)
    const urlIcao = `https://airlabs.co/api/v9/flight?flight_icao=${callsign}&api_key=${API_KEY}`;

    try {
        const response = await fetch(urlIcao);
        
        // Si pusiste mal la API Key, te va a avisar acá
        if (!response.ok) return res.status(200).json({ route: "N/A", debug: `AirLabs Error HTTP: ${response.status}` });
        
        const data = await response.json();
        
        // Buscamos si AirLabs nos devolvió el origen (dep_iata) y destino (arr_iata)
        if (data.response) {
            const origin = data.response.dep_iata;
            const destination = data.response.arr_iata;
            
            if (origin && destination) {
                return res.status(200).json({ 
                    route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
                    debug: "Éxito AirLabs (ICAO)"
                });
            }
        }
        
        // Plan B: Si la aerolínea lo cargó con formato comercial (IATA), probamos de nuevo
        const urlIata = `https://airlabs.co/api/v9/flight?flight_iata=${callsign}&api_key=${API_KEY}`;
        const resIata = await fetch(urlIata);
        const dataIata = await resIata.json();
        
        if (dataIata.response) {
            const origin = dataIata.response.dep_iata;
            const destination = dataIata.response.arr_iata;
            if (origin && destination) {
                return res.status(200).json({ 
                    route: `${origin} <i class="fa-solid fa-plane" style="font-size: 20px; margin: 0 10px;"></i> ${destination}`,
                    debug: "Éxito AirLabs (IATA)"
                });
            }
        }

        // Si la API no tiene la ruta (ej: vuelo privado o militar)
        return res.status(200).json({ route: "N/A", debug: "Vuelo sin ruta en base de datos" });
        
    } catch (e) {
        return res.status(200).json({ route: "N/A", debug: `Crash: ${e.message}` });
    }
}
