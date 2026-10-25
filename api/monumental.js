export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); // Formato YYYY-MM-DD
    
    let eventoHoy = false;
    let tituloEvento = "";
    let horaEvento = "";

    // 1. RASTREADOR DE PARTIDOS (API Oculta de ESPN - Sin Key)
    try {
        // ID 16 es River Plate en ESPN
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams/16/schedule`;
        const espnRes = await fetch(espnUrl);
        if (espnRes.ok) {
            const espnData = await espnRes.json();
            const eventos = espnData.events || [];
            
            for (let i = 0; i < eventos.length; i++) {
                const partido = eventos[i];
                const fechaPartido = partido.date.split('T')[0];
                
                if (fechaPartido === hoy) {
                    const competidores = partido.competitions[0].competitors;
                    const esLocal = competidores.find(c => c.team.id === "16")?.homeAway === "home";
                    
                    // Si juega hoy y es local (en el Monumental)
                    if (esLocal) {
                        eventoHoy = true;
                        tituloEvento = partido.name;
                        horaEvento = new Date(partido.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
                        return res.status(200).json({ hayEvento: true, titulo: tituloEvento, hora: horaEvento });
                    }
                }
            }
        }
    } catch (e) {
        console.log("Fallo ESPN:", e);
    }

    // 2. SCRAPER DE RECITALES (Expresiones Regulares)
    // Usamos allorigins para saltar bloqueos básicos de Vercel
    try {
        const agendaUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://recitales.com.ar/')}`;
        const agendaRes = await fetch(agendaUrl);
        
        if (agendaRes.ok) {
            const agendaData = await agendaRes.json();
            const html = agendaData.contents.toLowerCase();
            
            // Busca si existe "monumental" y la fecha de hoy cerca en el texto
            // (Esta es la versión básica del scraper, si la web cambia hay que ajustar la búsqueda)
            if (html.includes("monumental") && html.includes(hoy.split('-')[2])) { 
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
