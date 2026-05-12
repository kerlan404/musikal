const express = require('express');
const router = express.Router();
const YTMusic = require('ytmusic-api');

// Singleton instance
const ytmusic = new YTMusic();
let isInitialized = false;

// In-memory Cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes in ms

/**
 * Helper: Initialize YTMusic if not already done
 */
async function ensureInitialized() {
    if (!isInitialized) {
        await ytmusic.initialize();
        isInitialized = true;
        console.log('[INFO] YTMusic API Initialized');
    }
}

/**
 * GET /api/search?q={query}
 * Professional YouTube Music Search with Caching
 */
router.get('/search', async (req, res) => {
    const query = req.query.q;

    // 1. Validation
    if (!query || query.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Query tidak boleh kosong"
        });
    }

    // 2. Check Cache
    if (cache.has(query)) {
        const cachedItem = cache.get(query);
        if (Date.now() < cachedItem.expiry) {
            console.log(`[CACHE] Hit for query: "${query}"`);
            return res.json({
                success: true,
                source: 'cache',
                data: cachedItem.data
            });
        } else {
            cache.delete(query); // Expired
        }
    }

    try {
        await ensureInitialized();

        // 3. Perform Search (Category: SONG)
        const results = await ytmusic.searchSongs(query);
        
        // 4. Transform & Clean Data
        const transformedData = results.slice(0, 20).map(song => {
            // Find highest resolution thumbnail
            const highestResThumb = song.thumbnails && song.thumbnails.length > 0 
                ? song.thumbnails.sort((a, b) => b.width - a.width)[0].url 
                : "";

            return {
                videoId: song.videoId,
                title: song.name,
                artist: song.artist && song.artist.name ? song.artist.name : "Unknown Artist",
                thumbnail: highestResThumb,
                duration: song.duration ? formatDuration(song.duration) : "0:00",
                durationSeconds: song.duration || 0
            };
        });

        // 5. Store in Cache
        cache.set(query, {
            data: transformedData,
            expiry: Date.now() + CACHE_TTL
        });

        res.json({
            success: true,
            source: 'api',
            data: transformedData
        });

    } catch (error) {
        console.error('[ERROR] YTMusic Search Failed:', error);
        res.status(503).json({
            success: false,
            message: "Layanan pencarian tidak tersedia"
        });
    }
});

/**
 * Helper: Format seconds to M:SS
 */
function formatDuration(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

module.exports = router;
