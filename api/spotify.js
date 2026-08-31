export default async function handler(req, res) {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
    const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;

    try {
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

        const nowPlayingResponse = await fetch(NOW_PLAYING_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (nowPlayingResponse.status === 204 || nowPlayingResponse.status > 400) {
            return res.status(200).json({ isPlaying: false });
        }

        const song = await nowPlayingResponse.json();
        
        if (song.item === null || !song.is_playing) {
            return res.status(200).json({ isPlaying: false });
        }

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
