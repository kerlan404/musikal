const express = require('express');
const router = express.Router();
const pool = require('../db');
const YTMusic = require('ytmusic-api');

const ytmusic = new YTMusic();
let isInitialized = false;

const CURRENT_USER_ID = 1;

async function ensureInitialized() {
    if (!isInitialized) {
        await ytmusic.initialize();
        isInitialized = true;
    }
}

/**
 * GET /api/home
 */
router.get('/home', async (req, res, next) => {
    try {
        await ensureInitialized();

        // 1. Featured (Trending Now) - Using search as fallback or specific trending if available
        // For simplicity, search for 'trending hits'
        const featuredResults = await ytmusic.searchSongs('trending hits');
        const featured = featuredResults.slice(0, 5).map(song => ({
            videoId: song.videoId,
            title: song.name,
            artist: song.artist?.name || 'Unknown',
            thumbnail: song.thumbnails?.sort((a, b) => b.width - a.width)[0]?.url || '',
            category: "Trending Now"
        }));

        // 2. Recently Played from DB
        let recentRows = [];
        try {
            const [rows] = await pool.query(`
                SELECT s.source_id as videoId, s.title, s.artist, s.cover_url as thumbnail
                FROM song_history h
                JOIN songs s ON h.song_id = s.id
                WHERE h.user_id = ?
                ORDER BY h.played_at DESC
                LIMIT 5
            `, [CURRENT_USER_ID]);
            recentRows = rows;
        } catch (dbErr) {
            console.warn('[HOME API] Could not fetch history (table might be missing):', dbErr.message);
        }

        // 3. Popular Playlists from DB
        let playlistRows = [];
        try {
            const [rows] = await pool.query(`
                SELECT p.id, p.name, COUNT(ps.id) as songCount,
                       (SELECT s.cover_url FROM playlist_songs ps2 
                        JOIN songs s ON ps2.song_id = s.id 
                        WHERE ps2.playlist_id = p.id 
                        ORDER BY ps2.urutan ASC LIMIT 1) as thumbnail
                FROM playlists p
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                GROUP BY p.id
                ORDER BY songCount DESC
                LIMIT 5
            `);
            playlistRows = rows;
        } catch (dbErr) {
            console.warn('[HOME API] Could not fetch playlists:', dbErr.message);
        }

        res.json({
            success: true,
            data: {
                featured,
                recentlyPlayed: recentRows,
                popularPlaylists: playlistRows
            }
        });

    } catch (error) {
        console.error('Home API Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
