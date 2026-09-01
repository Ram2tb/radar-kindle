export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const { callsign } = req.query;
    if (!callsign) return res.status(200).json({ route: "N/A" });

    const API_KEY = process.env.AIRLABS_API_KEY || "TU_API_KEY_ACA"; 
    const urlIcao = `https://airlabs.co/api/v9/flight?flight_icao=${callsign}&api_key=${API_KEY}`;

    try {
        const response = await fetch(urlIcao);
        if (!response.ok) return res.status(200).json({ route: "N/A" }); 
        
        const data = await response.json();
        
        if (data.response && data.response.dep_iata && data.response.arr_iata) {
            return res.status(200).json({ 
                // Cambiamos el fa-plane por fa-arrow-right-long
                route: `${data.response.dep_iata} <i class="fa-solid fa-arrow-right-long" style="font-size: 20px; margin: 0 10px;"></i> ${data.response.arr_iata}`
            });
        }
        
        const resIata = await fetch(`https://airlabs.co/api/v9/flight?flight_iata=${callsign}&api_key=${API_KEY}`);
        const dataIata = await resIata.json();
        
        if (dataIata.response && dataIata.response.dep_iata && dataIata.response.arr_iata) {
            return res.status(200).json({ 
                route: `${dataIata.response.dep_iata} <i class="fa-solid fa-arrow-right-long" style="font-size: 20px; margin: 0 10px;"></i> ${dataIata.response.arr_iata}`
            });
        }

        return res.status(200).json({ route: "N/A" });
    } catch (e) {
        return res.status(200).json({ route: "N/A" });
    }
}
