export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const RIVER_ID = 435; // River Plate

    if (!API_KEY) return res.status(200).json({ error: "Falta API KEY" });

    try {
        // Pedimos los próximos 5 partidos directamente
        const url = `https://v3.football.api-sports.io/fixtures?team=${RIVER_ID}&next=5&timezone=America/Argentina/Buenos_Aires`;
        const response = await fetch(url, {
            headers: { "x-apisports-key": API_KEY }
        });
        
        const data = await response.json();
        
        return res.status(200).json({
            diagnostico: "BUSCANDO PROXIMOS 5 PARTIDOS (Sin filtro de fecha)",
            urlConsultada: url,
            partidosEncontrados: data.response.map(p => ({
                fechaAPI: p.fixture.date,
                local: p.teams.home.name,
                visitante: p.teams.away.name,
                torneo: p.league.name,
                temporada: p.league.season
            }))
        });

    } catch (e) {
        return res.status(200).json({ error: "Fallo", detalle: e.message });
    }
}
