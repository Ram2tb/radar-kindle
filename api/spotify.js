export default async function handler(req, res) {
    // 1. REEMPLAZÁ ESTAS DOS LÍNEAS CON TUS CÓDIGOS
    const client_id = '45c04a5a4cf04eb2a7505d64b4a1634b';
    const client_secret = '733fe61f137d4a00bca200311bd6b892';
    
    // Tu llave maestra (no la toques)
    const refresh_token = 'AQANXbBLYgOxXxlZKh4ULpmFONbu-vl5ROlUNg3Eir43UzGzZRF244oyIqI0Uu33_05Cbz2wxoSSfIC0Yye06fGTssTU2GDpipLo5hQxXv3GEjyAmQupsoTfKLiDpQnx3SI';

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
    const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;

    try {
        // Vercel pide un pase de acceso rápido usando tu llave maestra
        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token,
            }),
        });

        const { access_token } = await response.json();

        if (!access_token) {
            return res.status(200).json({ isPlaying: false });
        }

        // Vercel le pregunta a Spotify qué está sonando ahora mismo
        const nowPlayingResponse = await fetch(NOW_PLAYING_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        // Si no hay música o la app está cerrada
        if (nowPlayingResponse.status === 204 || nowPlayingResponse.status > 400) {
            return res.status(200).json({ isPlaying: false });
        }

        const song = await nowPlayingResponse.json();
        
        if (song.item === null || !song.is_playing) {
            return res.status(200).json({ isPlaying: false });
        }

        // Armamos el paquete limpio para el Kindle
        const isPlaying = song.is_playing;
        const title = song.item.name;
        const artist = song.item.artists.map((_artist) => _artist.name).join(', ');

        return res.status(200).json({
            isPlaying,
            title,
            artist
        });
    } catch (error) {
        return res.status(500).json({ isPlaying: false });
    }
}
