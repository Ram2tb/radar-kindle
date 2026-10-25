import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const hoy = formatter.format(new Date()); 

    // 1. DICCIONARIO MANUAL (Mantenemos los recitales acá porque no están en Promiedos)
    const eventosManuales = {
        "2026-11-20": { titulo: "Recital: Iron Maiden", hora: "Puertas: 17:00" },
        "2026-12-05": { titulo: "Recital: Los Piojos", hora: "Puertas: 17:00" },
        "2026-12-06": { titulo: "Recital: Los Piojos", hora: "Puertas: 17:00" }
    };

    if (eventosManuales[hoy]) {
        return res.status(200).json({ hayEvento: true, titulo: eventosManuales[hoy].titulo, hora: eventosManuales[hoy].hora });
    }

    // 2. SCRAPER AVANZADO (Promiedos vía Puppeteer)
    let browser = null;
    try {
        // Configuramos Chromium para el entorno de bajos recursos de Vercel
        chromium.setGraphicsMode = false;
        
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Camuflaje para Cloudflare (Simulamos ser un Chrome normal en Windows)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Entramos a Promiedos y esperamos hasta que la página deje de cargar cosas (pasa el check de Cloudflare)
        await page.goto('https://www.promiedos.com.ar/', { waitUntil: 'networkidle2', timeout: 15000 });
        
        // Inyectamos un script en el navegador para raspar la tabla
        const partidoDeRiver = await page.evaluate(() => {
            const filas = Array.from(document.querySelectorAll('tr'));
            
            for (let fila of filas) {
                const textoFila = fila.innerText;
                if (textoFila.includes('River Plate') || textoFila.includes('River')) {
                    // Extraemos los datos basándonos en las clases CSS puras de Promiedos
                    const local = fila.querySelector('.game-t1')?.innerText.trim() || '';
                    const visitante = fila.querySelector('.game-t2')?.innerText.trim() || '';
                    const hora = fila.querySelector('.game-time')?.innerText.trim() || '';
                    
                    return { local, visitante, hora };
                }
            }
            return null;
        });

        // Verificamos si encontramos el partido y si River está escrito del lado izquierdo (Local)
        if (partidoDeRiver && partidoDeRiver.local.includes("River")) {
            return res.status(200).json({ 
                hayEvento: true, 
                titulo: `${partidoDeRiver.local} vs ${partidoDeRiver.visitante}`, 
                hora: partidoDeRiver.hora || "19:15" 
            });
        }
        
        return res.status(200).json({ hayEvento: false, debug: "No juega de local hoy o no se encontró en la tabla." });

    } catch (error) {
        return res.status(500).json({ hayEvento: false, error: "Fallo el scraper", detalle: error.message });
    } finally {
        // Vital: cerrar el navegador para que Vercel no cuelgue el servidor
        if (browser !== null) {
            await browser.close();
        }
    }
}
