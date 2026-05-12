const express = require('express');
const router = express.Router();
const pool = require('../db');

const CURRENT_USER_ID = 1;

/**
 * GET /api/library
 */
router.get('/library', async (req, res, next) => {
    try {
        // 1. Liked Songs
        const [likedRows] = await pool.query(`
            SELECT s.id, s.source_id as videoId, s.title, s.artist, s.cover_url as thumbnail, s.duration
            FROM liked_songs l
            JOIN songs s ON l.song_id = s.id
            WHERE l.user_id = ?
            ORDER BY l.created_at DESC
            LIMIT 5
        `, [CURRENT_USER_ID]);

        // 2. Recently Played
        const [recentRows] = await pool.query(`
            SELECT s.id, s.source_id as videoId, s.title, s.artist, s.cover_url as thumbnail, s.duration, h.played_at
            FROM song_history h
            JOIN songs s ON h.song_id = s.id
            WHERE h.user_id = ?
            ORDER BY h.played_at DESC
            LIMIT 10
        `, [CURRENT_USER_ID]);

        // 3. Most Played
        const [mostPlayedRows] = await pool.query(`
            SELECT s.id, s.source_id as videoId, s.title, s.artist, s.cover_url as thumbnail, s.duration, h.play_count
            FROM song_history h
            JOIN songs s ON h.song_id = s.id
            WHERE h.user_id = ?
            ORDER BY h.play_count DESC
            LIMIT 5
        `, [CURRENT_USER_ID]);

        res.json({
            success: true,
            data: {
                liked: likedRows,
                recently: recentRows,
                mostPlayed: mostPlayedRows
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/library/like
 * Toggle like status
 */
router.post('/library/like', async (req, res, next) => {
    const { videoId, title, artist, thumbnail, duration } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ensure song exists
        let [songRows] = await connection.query('SELECT id FROM songs WHERE source_id = ?', [videoId]);
        let songId;
        if (songRows.length === 0) {
            const [insert] = await connection.query(
                'INSERT INTO songs (title, artist, cover_url, source_id, duration) VALUES (?, ?, ?, ?, ?)',
                [title, artist, thumbnail, videoId, duration]
            );
            songId = insert.insertId;
        } else {
            songId = songRows[0].id;
        }

        // 2. Check if already liked
        const [liked] = await connection.query('SELECT id FROM liked_songs WHERE user_id = ? AND song_id = ?', [CURRENT_USER_ID, songId]);
        
        if (liked.length > 0) {
            await connection.query('DELETE FROM liked_songs WHERE user_id = ? AND song_id = ?', [CURRENT_USER_ID, songId]);
            await connection.commit();
            res.json({ success: true, message: 'Unliked', isLiked: false });
        } else {
            await connection.query('INSERT INTO liked_songs (user_id, song_id) VALUES (?, ?)', [CURRENT_USER_ID, songId]);
            await connection.commit();
            res.json({ success: true, message: 'Liked', isLiked: true });
        }
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

/**
 * POST /api/history
 * Record song play
 */
router.post('/history', async (req, res, next) => {
    const { videoId, title, artist, thumbnail, duration } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ensure song exists
        let [songRows] = await connection.query('SELECT id FROM songs WHERE source_id = ?', [videoId]);
        let songId;
        if (songRows.length === 0) {
            const [insert] = await connection.query(
                'INSERT INTO songs (title, artist, cover_url, source_id, duration) VALUES (?, ?, ?, ?, ?)',
                [title, artist, thumbnail, videoId, duration]
            );
            songId = insert.insertId;
        } else {
            songId = songRows[0].id;
        }

        // 2. Update or Insert history
        await connection.query(`
            INSERT INTO song_history (user_id, song_id, played_at, play_count)
            VALUES (?, ?, CURRENT_TIMESTAMP, 1)
            ON DUPLICATE KEY UPDATE 
                played_at = CURRENT_TIMESTAMP,
                play_count = play_count + 1
        `, [CURRENT_USER_ID, songId]);

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

module.exports = router;
