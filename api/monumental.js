export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); 

    const API_KEY = process.env.FOOTBALL_API_KEY;
    const RIVER_ID = 435; 

    if (!API_KEY) {
        return res.status(200).json({ error: "FALTA_API_KEY", detalle: "Vercel no está leyendo la variable de entorno. Hacé un Redeploy." });
    }

    try {
        const url = `https://v3.football.api-sports.io/fixtures?team=${RIVER_ID}&date=${hoy}&timezone=America/Argentina/Buenos_Aires`;
        const response = await fetch(url, {
            headers: { "x-apisports-key": API_KEY }
        });
        
        const data = await response.json();
        
        // Devolvemos absolutamente todo lo que responde la API para leerlo
        return res.status(200).json({
            diagnostico: "MODO FORENSE ACTIVO",
            fechaBuscada: hoy,
            urlConsultada: url,
            respuestaDeLaAPI: data
        });

    } catch (e) {
        return res.status(200).json({ error: "Fallo de conexión", detalle: e.message });
    }
}
