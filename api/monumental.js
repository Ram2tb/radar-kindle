export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); 
    
    let debugEventos = [];

    try {
        // Usamos 'all' en lugar de 'arg.1' por si es partido de copa
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/16/schedule`;
        const espnRes = await fetch(espnUrl);
        
        if (espnRes.ok) {
            const espnData = await espnRes.json();
            const eventos = espnData.events || [];
            
            for (let i = 0; i < eventos.length; i++) {
                const partido = eventos[i];
                const fechaUTC = new Date(partido.date);
                const fechaPartidoLocal = formatter.format(fechaUTC);
                
                const competidores = partido.competitions[0].competitors;
                const equipoLocal = competidores.find(c => c.homeAway === "home")?.team?.name || "Desconocido";
                
                // Guardamos la info cruda para ver qué está leyendo Vercel
                debugEventos.push({
                    nombre: partido.name,
                    fechaCrudaESPN: partido.date,
                    fechaConvertida: fechaPartidoLocal,
                    local: equipoLocal
                });
                
                if (fechaPartidoLocal === hoy) {
                    const esLocal = competidores.find(c => c.team.id === "16")?.homeAway === "home";
                    
                    if (esLocal) {
                        const horaEvento = fechaUTC.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
                        return res.status(200).json({ 
                            hayEvento: true, 
                            titulo: partido.name, 
                            hora: horaEvento 
                        });
                    }
                }
            }
        }
    } catch (e) {
        debugEventos.push("Fallo conexión ESPN");
    }

    // Si llega hasta acá, es porque no hay evento en el Monumental hoy.
    // Devolvemos todo el diagnóstico para leerlo en el navegador.
    return res.status(200).json({ 
        hayEvento: false, 
        diagnostico: {
            fechaBuscadaVercel: hoy,
            partidosEncontrados: debugEventos
        }
    });
}
