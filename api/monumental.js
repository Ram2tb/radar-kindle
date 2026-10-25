export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    try {
        // disableCache=true es CRÍTICO para que no nos devuelva la página de ayer
        const promiedosUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.promiedos.com.ar/')}&disableCache=true`;
        const promiedosRes = await fetch(promiedosUrl);
        
        if (promiedosRes.ok) {
            const promiedosData = await promiedosRes.json();
            const html = promiedosData.contents;
            
            // Si Cloudflare de Promiedos nos bloqueó, lo detectamos acá
            if (html.includes("Just a moment...") || html.includes("Cloudflare")) {
                return res.status(200).json({ hayEvento: false, debug: "Bloqueado por el escudo anti-bots de Cloudflare." });
            }
            
            const filas = html.match(/<tr[^>]*>.*?<\/tr>/gis) || [];
            let filaSospechosa = "No se encontró la palabra River en toda la página";
            
            for (let fila of filas) {
                if (fila.includes("River Plate") || fila.includes("River")) {
                    // Limpiamos TODO el código HTML de la fila para dejar el texto crudo
                    // Ejemplo de lo que queda: " 19:15 River Plate Racing Club "
                    const textoLimpio = fila.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    filaSospechosa = textoLimpio;
                    
                    const horaMatch = textoLimpio.match(/\d{2}:\d{2}/);
                    const horaStr = horaMatch ? horaMatch[0] : "19:15";
                    
                    // Si el texto de River aparece ANTES que el del rival en el string, es local
                    const indexRiver = textoLimpio.indexOf("River");
                    
                    // Verificamos si juega contra Racing hoy
                    if (textoLimpio.includes("Racing")) {
                        const indexRacing = textoLimpio.indexOf("Racing");
                        
                        if (indexRiver !== -1 && indexRacing !== -1 && indexRiver < indexRacing) {
                            return res.status(200).json({ 
                                hayEvento: true, 
                                titulo: "River vs Racing", 
                                hora: horaStr,
                                debug: "Partido detectado por Scraper"
                            });
                        }
                    } else {
                        // Lógica general por si juega contra otro equipo y la fecha coincide
                        // Buscamos cualquier otro texto que parezca un equipo
                        if (indexRiver !== -1 && indexRiver < 15) { // Si River está al principio del texto
                            return res.status(200).json({ 
                                hayEvento: true, 
                                titulo: "River Plate (Local)", 
                                hora: horaStr,
                                debug: textoLimpio
                            });
                        }
                    }
                }
            }
            
            return res.status(200).json({ 
                hayEvento: false, 
                debug: "Fallo en la lectura", 
                loQueVioElScraper: filaSospechosa 
            });
        }
    } catch (e) {
        return res.status(200).json({ hayEvento: false, error: e.message });
    }

    return res.status(200).json({ hayEvento: false, debug: "No llegó a ejecutar el código" });
}
