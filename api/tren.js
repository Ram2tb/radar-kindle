export default async function handler(req, res) {
    try {
        // Vercel entra a la web oficial como si fuera un humano
        const response = await fetch("https://www.argentina.gob.ar/transporte/trenes-argentinos/horarios-tarifas-y-recorridos/servicios-amba/linea-mitre");
        const html = await response.text();
        
        let estadoTren = "A HORARIO"; 
        
        // Raspamos el texto oficial buscando problemas en el servicio
        const htmlMinuscula = html.toLowerCase();
        if (htmlMinuscula.includes("interrumpido") || htmlMinuscula.includes("cancelado")) {
            estadoTren = "CANCELADO";
        } else if (htmlMinuscula.includes("demora") || htmlMinuscula.includes("reducido") || htmlMinuscula.includes("limitado")) {
            estadoTren = "DEMORADO";
        }

        // Le respondemos al Kindle con el estado limpio
        res.status(200).json({ status: estadoTren });
    } catch (error) {
        res.status(500).json({ status: "SIN SEÑAL" });
    }
}
