const express = require('express');
const router = express.Router();
const pool = require('../db');

// Hardcoded userId for now
const CURRENT_USER_ID = 1;

// 1. GET /api/playlists - Ambil semua playlist milik user dengan jumlah lagu
router.get('/', async (req, res, next) => {
    try {
        const sql = `
            SELECT p.id, p.name, p.created_at, COUNT(ps.id) as song_count
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

// 2. POST /api/playlists - Buat playlist baru
router.post('/', async (req, res, next) => {
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

// 3. DELETE /api/playlists/:id - Hapus playlist
router.delete('/:id', async (req, res, next) => {
    try {
        await pool.query('DELETE FROM playlists WHERE id = ? AND user_id = ?', [req.params.id, CURRENT_USER_ID]);
        res.json({ success: true, message: 'Playlist dihapus' });
    } catch (error) {
        next(error);
    }
});

// 4. GET /api/playlists/:id/songs - Ambil lagu dalam playlist
router.get('/:id/songs', async (req, res, next) => {
    try {
        const sql = `
            SELECT ps.id as playlist_song_id, ps.urutan, 
                   s.id, s.title, s.artist, s.cover_url, s.source_id, s.duration
            FROM playlist_songs ps
            JOIN songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = ?
            ORDER BY ps.urutan ASC
        `;
        const [rows] = await pool.query(sql, [req.params.id]);
        
        // Format response agar song menjadi nested object sesuai permintaan
        const formatted = rows.map(row => ({
            playlist_song_id: row.playlist_song_id,
            urutan: row.urutan,
            song: {
                id: row.id,
                title: row.title,
                artist: row.artist,
                cover_url: row.cover_url,
                source_id: row.source_id,
                duration: row.duration
            }
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
});

// 5. POST /api/playlists/:id/songs - Tambah lagu ke playlist
router.post('/:id/songs', async (req, res, next) => {
    const { source_id, title, artist, cover_url, duration } = req.body;
    const playlistId = req.params.id;

    if (!source_id || !title) return res.status(400).json({ success: false, message: 'Data lagu tidak lengkap' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Cek atau Insert ke tabel songs
        let [songRows] = await connection.query('SELECT id FROM songs WHERE source_id = ?', [source_id]);
        let songId;

        if (songRows.length === 0) {
            const [insertSong] = await connection.query(
                'INSERT INTO songs (title, artist, cover_url, source_id, duration) VALUES (?, ?, ?, ?, ?)',
                [title, artist, cover_url, source_id, duration]
            );
            songId = insertSong.insertId;
        } else {
            songId = songRows[0].id;
        }

        // 2. Ambil urutan terakhir
        const [maxUrutanRows] = await connection.query('SELECT MAX(urutan) as last_urutan FROM playlist_songs WHERE playlist_id = ?', [playlistId]);
        const nextUrutan = (maxUrutanRows[0].last_urutan || 0) + 1;

        // 3. Insert ke playlist_songs
        await connection.query(
            'INSERT INTO playlist_songs (playlist_id, song_id, urutan) VALUES (?, ?, ?)',
            [playlistId, songId, nextUrutan]
        );

        await connection.commit();
        res.json({ success: true, message: 'Lagu ditambahkan ke playlist' });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Lagu sudah ada di playlist ini' });
        }
        next(error);
    } finally {
        connection.release();
    }
});

// 6. DELETE /api/playlists/:id/songs/:songId - Hapus lagu dari playlist
router.delete('/:id/songs/:songId', async (req, res, next) => {
    try {
        await pool.query('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?', [req.params.id, req.params.songId]);
        res.json({ success: true, message: 'Lagu dihapus dari playlist' });
    } catch (error) {
        next(error);
    }
});

// 7. PATCH /api/playlists/:id/songs/reorder - Bulk reorder
router.patch('/:id/songs/reorder', async (req, res, next) => {
    const { songs } = req.body; // Expecting [{ id: playlist_song_id, urutan: 1 }, ...]
    if (!Array.isArray(songs)) return res.status(400).json({ success: false, message: 'Data songs harus berupa array' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of songs) {
            await connection.query(
                'UPDATE playlist_songs SET urutan = ? WHERE id = ? AND playlist_id = ?',
                [item.urutan, item.id, req.params.id]
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
