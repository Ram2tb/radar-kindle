export default async function handler(req, res) {
    const { action } = req.query; 
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    try {
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

        let endpoint = '';
        let method = 'POST'; 

        if (action === 'play') {
            endpoint = 'https://api.spotify.com/v1/me/player/play';
            method = 'PUT'; 
        } else if (action === 'pause') {
            endpoint = 'https://api.spotify.com/v1/me/player/pause';
            method = 'PUT'; 
        } else if (action === 'next') {
            endpoint = 'https://api.spotify.com/v1/me/player/next';
        } else if (action === 'previous') {
            endpoint = 'https://api.spotify.com/v1/me/player/previous';
        } else {
            return res.status(400).json({ error: 'Acción no válida' });
        }

        const spotifyRes = await fetch(endpoint, {
            method: method,
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        // Spotify devuelve 204 No Content cuando el comando de reproducción tiene éxito
        if (spotifyRes.status === 204) {
            return res.status(200).json({ status: 'Comando ejecutado con éxito: ' + action });
        } else {
            const errorData = await spotifyRes.json().catch(() => ({}));
            return res.status(spotifyRes.status).json({
                error: 'Spotify rechazó el comando',
                spotify_status: spotifyRes.status,
                detalles: errorData
            });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
}
