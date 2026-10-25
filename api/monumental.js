export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); 

    // 1. DICCIONARIO MANUAL (Prioridad Máxima - Funciona perfecto)
    const eventosManuales = {
        "2026-10-25": { titulo: "River vs Racing", hora: "19:15" },
        "2026-11-20": { titulo: "Recital: Iron Maiden", hora: "Puertas: 17:00" },
        "2026-12-05": { titulo: "Recital: Los Piojos", hora: "Puertas: 17:00" },
        "2026-12-06": { titulo: "Recital: Los Piojos", hora: "Puertas: 17:00" }
    };

    if (eventosManuales[hoy]) {
        return res.status(200).json({ hayEvento: true, titulo: eventosManuales[hoy].titulo, hora: eventosManuales[hoy].hora });
    }

    // 2. RED DE SEGURIDAD (API-Football)
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const RIVER_ID = 435; 

    if (API_KEY) {
        try {
            const anioActual = hoy.substring(0, 4);
            const url = `https://v3.football.api-sports.io/fixtures?team=${RIVER_ID}&date=${hoy}&season=${anioActual}&timezone=America/Argentina/Buenos_Aires`;
            const response = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
            
            if (response.ok) {
                const data = await response.json();
                if (data.response && data.response.length > 0) {
                    const partido = data.response[0];
                    if (partido.teams.home.id === RIVER_ID) {
                        const fechaUTC = new Date(partido.fixture.date);
                        const horaLocal = fechaUTC.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
                        return res.status(200).json({ hayEvento: true, titulo: `${partido.teams.home.name} vs ${partido.teams.away.name}`, hora: horaLocal });
                    }
                }
            }
        } catch (e) {
            console.log("Fallo API Football:", e);
        }
    }

    return res.status(200).json({ hayEvento: false });
}
