export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); // Formato YYYY-MM-DD
    
    let eventoHoy = false;
    let tituloEvento = "";
    let horaEvento = "";

    // 1. RASTREADOR DE PARTIDOS (API Oculta de ESPN)
    try {
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams/16/schedule`;
        const espnRes = await fetch(espnUrl);
        if (espnRes.ok) {
            const espnData = await espnRes.json();
            const eventos = espnData.events || [];
            
            for (let i = 0; i < eventos.length; i++) {
                const partido = eventos[i];
                
                // CORRECCIÓN: Convertimos la fecha UTC de ESPN a la hora local de Buenos Aires
                const fechaUTC = new Date(partido.date);
                const fechaPartidoLocal = formatter.format(fechaUTC);
                
                if (fechaPartidoLocal === hoy) {
                    const competidores = partido.competitions[0].competitors;
                    const esLocal = competidores.find(c => c.team.id === "16")?.homeAway === "home";
                    
                    if (esLocal) {
                        eventoHoy = true;
                        tituloEvento = partido.name;
                        horaEvento = fechaUTC.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
                        return res.status(200).json({ hayEvento: true, titulo: tituloEvento, hora: horaEvento });
                    }
                }
            }
        }
    } catch (e) {
        console.log("Fallo ESPN:", e);
    }

    // 2. SCRAPER DE RECITALES
    try {
        const agendaUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://recitales.com.ar/')}`;
        const agendaRes = await fetch(agendaUrl);
        
        if (agendaRes.ok) {
            const agendaData = await agendaRes.json();
            const html = agendaData.contents.toLowerCase();
            
            // Busca el día de hoy (ej: "25") y la palabra monumental
            const diaHoy = hoy.split('-')[2];
            if (html.includes("monumental") && html.includes(diaHoy)) { 
                return res.status(200).json({ 
                    hayEvento: true, 
                    titulo: "Recital Detectado", 
                    hora: "Puertas: 17:00 (Est.)" 
                });
            }
        }
    } catch (e) {
        console.log("Fallo Scraper:", e);
    }

    return res.status(200).json({ hayEvento: false });
}
