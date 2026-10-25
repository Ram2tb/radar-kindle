export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); // Formato YYYY-MM-DD

    // 1. BÚSQUEDA AUTOMÁTICA DE PARTIDOS (API-Football)
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const RIVER_ID = 435; // ID oficial de River Plate

    if (API_KEY) {
        try {
            const response = await fetch(`https://v3.football.api-sports.io/fixtures?team=${RIVER_ID}&date=${hoy}&timezone=America/Argentina/Buenos_Aires`, {
                headers: {
                    "x-apisports-key": API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.response && data.response.length > 0) {
                    const partido = data.response[0];
                    
                    // Verificar si River juega de local en el Monumental
                    if (partido.teams.home.id === RIVER_ID) {
                        const fechaUTC = new Date(partido.fixture.date);
                        const horaLocal = fechaUTC.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
                        
                        return res.status(200).json({ 
                            hayEvento: true, 
                            titulo: `${partido.teams.home.name} vs ${partido.teams.away.name}`, 
                            hora: horaLocal 
                        });
                    }
                }
            }
        } catch (e) {
            console.log("Fallo API Football:", e);
        }
    }

    // 2. DICCIONARIO MANUAL DE RECITALES (Plan B)
    const recitales = {
        "2026-11-20": "Recital: Iron Maiden",
        "2026-12-05": "Recital: Los Piojos",
        "2026-12-06": "Recital: Los Piojos"
    };

    if (recitales[hoy]) {
        return res.status(200).json({ hayEvento: true, titulo: recitales[hoy], hora: "Puertas: 17:00" });
    }

    // Si no hay partido ni recital hoy, devolvemos false
    return res.status(200).json({ hayEvento: false });
}
