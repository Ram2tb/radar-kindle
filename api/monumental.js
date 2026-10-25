export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); 
    
    try {
        // 1. RASTREADOR DE PARTIDOS (Promiedos.com.ar)
        // Usamos allorigins para evadir el bloqueo antibots (Cloudflare) de Promiedos
        const promiedosUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.promiedos.com.ar/')}`;
        const promiedosRes = await fetch(promiedosUrl);
        
        if (promiedosRes.ok) {
            const promiedosData = await promiedosRes.json();
            const html = promiedosData.contents;
            
            // Cortamos todo el HTML agrupando por filas de tablas
            const filas = html.match(/<tr[^>]*>.*?<\/tr>/gis) || [];
            
            for (let fila of filas) {
                // Filtramos rápido: si la fila no dice River, la ignoramos
                if (fila.includes("River")) {
                    
                    // Extraemos las columnas específicas de Promiedos
                    const horaMatch = fila.match(/<td[^>]*class="[^"]*game-time[^"]*"[^>]*>(.*?)<\/td>/is) || fila.match(/>(\d{2}:\d{2})</);
                    const localMatch = fila.match(/<td[^>]*class="[^"]*game-t1[^"]*"[^>]*>(.*?)<\/td>/is);
                    const visitanteMatch = fila.match(/<td[^>]*class="[^"]*game-t2[^"]*"[^>]*>(.*?)<\/td>/is);
                    
                    if (localMatch && visitanteMatch) {
                        // Limpiamos los logos y etiquetas HTML para dejar solo el texto
                        const local = localMatch[1].replace(/<[^>]+>/g, '').trim();
                        const visitante = visitanteMatch[1].replace(/<[^>]+>/g, '').trim();
                        
                        // Verificamos la localía pura
                        if (local.includes("River")) {
                            const horaStr = horaMatch ? horaMatch[1].replace(/<[^>]+>/g, '').trim() : "19:15";
                            return res.status(200).json({ 
                                hayEvento: true, 
                                titulo: `${local} vs ${visitante}`, 
                                hora: horaStr 
                            });
                        }
                    }
                }
            }
        }
        
        // 2. SCRAPER DE RECITALES (recitales.com.ar)
        // Solo llega acá si Promiedos no detectó partido hoy
        const agendaUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://recitales.com.ar/')}`;
        const agendaRes = await fetch(agendaUrl);
        
        if (agendaRes.ok) {
            const agendaData = await agendaRes.json();
            const htmlReci = agendaData.contents.toLowerCase();
            const diaHoy = hoy.split('-')[2];
            
            if (htmlReci.includes("monumental") && htmlReci.includes(diaHoy)) { 
                return res.status(200).json({ 
                    hayEvento: true, 
                    titulo: "Recital Detectado", 
                    hora: "Puertas: 17:00 (Est.)" 
                });
            }
        }
        
    } catch (e) {
        return res.status(200).json({ hayEvento: false, error: e.message });
    }

    return res.status(200).json({ hayEvento: false });
}
