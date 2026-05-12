const express = require('express');
const router = express.Router();
const pool = require('../db');

// Hardcoded userId for now
const CURRENT_USER_ID = 1;

/**
 * 1. GET /api/playlists
 * Return: Array semua playlist user (hardcode userId=1)
 * Format: [{ id, name, songCount, createdAt, thumbnail (dari lagu pertama) }]
 */
router.get('/playlists', async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                p.id, 
                p.name, 
                p.created_at as createdAt,
                COUNT(ps.id) as songCount,
                (SELECT s.cover_url FROM playlist_songs ps2 
                 JOIN songs s ON ps2.song_id = s.id 
                 WHERE ps2.playlist_id = p.id 
                 ORDER BY ps2.urutan ASC LIMIT 1) as thumbnail
            FROM playlists p
            LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await pool.query(sql, [CURRENT_USER_ID]);
        res.json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
});

/**
 * 2. POST /api/playlists
 * Body: { name }
 * Create playlist baru
 */
router.post('/playlists', async (req, res, next) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama playlist tidak boleh kosong' });

    try {
        const [result] = await pool.query('INSERT INTO playlists (name, user_id) VALUES (?, ?)', [name, CURRENT_USER_ID]);
        res.json({ 
            success: true, 
            data: { id: result.insertId, name } 
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 3. DELETE /api/playlists/:id
 * Hapus playlist
 */
router.delete('/playlists/:id', async (req, res, next) => {
    try {
        await pool.query('DELETE FROM playlists WHERE id = ? AND user_id = ?', [req.params.id, CURRENT_USER_ID]);
        res.json({ success: true, message: 'Playlist dihapus' });
    } catch (error) {
        next(error);
    }
});

/**
 * 4. GET /api/playlists/:id/songs
 * Return: Array lagu dalam playlist
 */
router.get('/playlists/:id/songs', async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                ps.id as playlist_song_id, 
                ps.urutan, 
                s.source_id as videoId, 
                s.title, 
                s.artist, 
                s.cover_url as thumbnail, 
                s.duration
            FROM playlist_songs ps
            JOIN songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = ?
            ORDER BY ps.urutan ASC
        `;
        const [rows] = await pool.query(sql, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
});

/**
 * 5. POST /api/playlists/:id/songs
 * Body: { videoId, title, artist, thumbnail, duration }
 * Tambah lagu ke playlist (check duplicate via videoId)
 */
router.post('/playlists/:id/songs', async (req, res, next) => {
    const { videoId, title, artist, thumbnail, duration } = req.body;
    const playlistId = req.params.id;

    if (!videoId || !title) return res.status(400).json({ success: false, message: 'Data lagu tidak lengkap' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Cek atau Insert ke tabel songs
        let [songRows] = await connection.query('SELECT id FROM songs WHERE source_id = ?', [videoId]);
        let songId;

        if (songRows.length === 0) {
            const [insertSong] = await connection.query(
                'INSERT INTO songs (title, artist, cover_url, source_id, duration) VALUES (?, ?, ?, ?, ?)',
                [title, artist, thumbnail, videoId, duration]
            );
            songId = insertSong.insertId;
        } else {
            songId = songRows[0].id;
        }

        // 2. Check if already in this playlist
        const [existing] = await connection.query('SELECT id FROM playlist_songs WHERE playlist_id = ? AND song_id = ?', [playlistId, songId]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Lagu sudah ada di playlist ini' });
        }

        // 3. Ambil urutan terakhir
        const [maxUrutanRows] = await connection.query('SELECT MAX(urutan) as last_urutan FROM playlist_songs WHERE playlist_id = ?', [playlistId]);
        const nextUrutan = (maxUrutanRows[0].last_urutan || 0) + 1;

        // 4. Insert ke playlist_songs
        await connection.query(
            'INSERT INTO playlist_songs (playlist_id, song_id, urutan) VALUES (?, ?, ?)',
            [playlistId, songId, nextUrutan]
        );

        await connection.commit();
        res.json({ success: true, message: 'Lagu ditambahkan' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

/**
 * 6. DELETE /api/playlists/:id/songs/:videoId
 * Hapus lagu dari playlist berdasarkan videoId
 */
router.delete('/playlists/:id/songs/:videoId', async (req, res, next) => {
    try {
        const sql = `
            DELETE ps FROM playlist_songs ps
            JOIN songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = ? AND s.source_id = ?
        `;
        await pool.query(sql, [req.params.id, req.params.videoId]);
        res.json({ success: true, message: 'Lagu dihapus' });
    } catch (error) {
        next(error);
    }
});

/**
 * 7. POST /api/playlists/:id/songs/reorder
 * Body: [{ songId, urutan }]
 */
router.post('/playlists/:id/songs/reorder', async (req, res, next) => {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'Data harus berupa array' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of items) {
            // Note: item.songId might be playlist_song_id or song_id. Based on request, it's songId.
            await connection.query(
                'UPDATE playlist_songs SET urutan = ? WHERE song_id = ? AND playlist_id = ?',
                [item.urutan, item.songId, req.params.id]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Urutan diperbarui' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

module.exports = router;
