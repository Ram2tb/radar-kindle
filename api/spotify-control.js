// api/spotify-control.js
export default async function handler(req, res) {
    const { action } = req.query; // Puede ser: play, pause, next, previous
    
    // Tus mismas credenciales de entorno que usás para leer la canción
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    try {
        // 1. Pedimos un token de acceso fresco
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token
            })
        });
        
        const tokenData = await tokenResponse.json();
        const access_token = tokenData.access_token;

        // 2. Ejecutamos la acción
        let endpoint = '';
        let method = 'POST'; // Next y Previous usan POST

        if (action === 'play') {
            endpoint = 'https://api.spotify.com/v1/me/player/play';
            method = 'PUT'; // Play usa PUT
        } else if (action === 'pause') {
            endpoint = 'https://api.spotify.com/v1/me/player/pause';
            method = 'PUT'; // Pause usa PUT
        } else if (action === 'next') {
            endpoint = 'https://api.spotify.com/v1/me/player/next';
        } else if (action === 'previous') {
            endpoint = 'https://api.spotify.com/v1/me/player/previous';
        } else {
            return res.status(400).json({ error: 'Acción no válida' });
        }

        // 3. Enviamos la orden silenciosa a Spotify
        await fetch(endpoint, {
            method: method,
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        return res.status(200).json({ status: 'Comando enviado: ' + action });
    } catch (error) {
        return res.status(500).json({ error: 'Error al enviar comando' });
    }
}
