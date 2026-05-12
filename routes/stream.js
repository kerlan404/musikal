const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const ytDlp = require('yt-dlp-exec');
const { getYtDlpPath, getFfmpegPath, defaultOptions } = require('../config/ytdlp');

// In-memory cache for audio URLs
const audioCache = new Map();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// Cleanup cache every 30 minutes
setInterval(() => {
    const now = Date.now();
    for (const [videoId, data] of audioCache.entries()) {
        if (now - data.timestamp > CACHE_TTL) {
            audioCache.delete(videoId);
        }
    }
}, 30 * 60 * 1000);

/**
 * ENDPOINT 1: GET /api/stream/:videoId
 * Direct streaming with transcoding to MP3
 */
router.get('/stream/:videoId', (req, res) => {
    const { videoId } = req.params;
    
    // 1. Validasi videoId
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return res.status(400).json({ error: 'Invalid videoId' });
    }

    const ytdlpPath = getYtDlpPath();
    const ffmpegPath = getFfmpegPath();

    // 2. Set response headers BEFORE anything
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(`[STREAM] Starting stream for ${videoId}`);

    // 3. Spawn yt-dlp
    const ytdlpArgs = [
        `https://www.youtube.com/watch?v=${videoId}`,
        '-f', 'bestaudio[ext=m4a]/bestaudio/best',
        '--no-playlist',
        '--quiet',
        '-o', '-',
        '--no-warnings',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const ytdlp = spawn(ytdlpPath, ytdlpArgs);

    // 4. Pipe stdout yt-dlp ke ffmpeg
    const ffmpegArgs = [
        '-i', 'pipe:0',
        '-vn',
        '-acodec', 'libmp3lame',
        '-ab', '128k',
        '-ar', '44100',
        '-f', 'mp3',
        'pipe:1'
    ];

    const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

    // 5. Connect pipes
    ytdlp.stdout.pipe(ffmpeg.stdin);
    
    // 6. Pipe ffmpeg to response
    ffmpeg.stdout.pipe(res);

    // 7. Cleanup on close
    req.on('close', () => {
        console.log(`[STREAM] Request closed, killing processes for ${videoId}`);
        ytdlp.kill('SIGTERM');
        ffmpeg.kill('SIGTERM');
    });

    // 8 & 9. Logs stderr
    ytdlp.stderr.on('data', (data) => {
        console.log(`[yt-dlp stderr] ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        // ffmpeg logs often go to stderr even for normal operation, so we just log to console
        // console.log(`[ffmpeg stderr] ${data}`);
    });

    // 10. Error handling
    ytdlp.on('error', (err) => {
        console.error('[yt-dlp error]', err);
        if (!res.headersSent) res.status(500).end();
    });

    ffmpeg.on('error', (err) => {
        console.error('[ffmpeg error]', err);
        if (!res.headersSent) res.status(500).end();
    });
});

/**
 * ENDPOINT 2: GET /api/audio-url/:videoId
 * Get direct CDN URL
 */
router.get('/audio-url/:videoId', async (req, res) => {
    const { videoId } = req.params;

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return res.status(400).json({ error: 'Invalid videoId' });
    }

    // Check cache
    if (audioCache.has(videoId)) {
        const cached = audioCache.get(videoId);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[CACHE] Returning cached URL for ${videoId}`);
            return res.json(cached.data);
        }
    }

    try {
        console.log(`[URL] Fetching direct URL for ${videoId}`);
        const result = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noPlaylist: true,
            format: 'bestaudio[ext=m4a]/bestaudio',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const responseData = {
            success: true,
            url: result.url,
            ext: result.ext,
            acodec: result.acodec,
            filesize: result.filesize,
            mimeType: 'audio/mp4',
            expires: Date.now() + 6 * 60 * 60 * 1000
        };

        // Save to cache
        audioCache.set(videoId, {
            timestamp: Date.now(),
            data: responseData
        });

        res.json(responseData);

    } catch (error) {
        console.error('[URL error]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
