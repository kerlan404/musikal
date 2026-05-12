const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Mendapatkan path ke binary yt-dlp
 * Mendukung manual binary di ./bin/ atau via yt-dlp-exec
 */
function getYtDlpPath() {
    const isWindows = process.platform === 'win32';
    const binFolder = path.resolve(__dirname, '..', 'bin');
    const manualPath = path.join(binFolder, isWindows ? 'yt-dlp.exe' : 'yt-dlp');

    if (fs.existsSync(manualPath)) {
        return manualPath;
    }

    // Fallback ke yt-dlp-exec binary
    try {
        const moduleMain = require.resolve('yt-dlp-exec');
        const moduleDir = path.dirname(moduleMain);
        
        // Cek beberapa kemungkinan lokasi bin (tergantung versi yt-dlp-exec)
        const possiblePaths = [
            path.join(moduleDir, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp'),
            path.join(moduleDir, '..', 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp')
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
    } catch (e) {
        console.warn('yt-dlp-exec not found or binary missing');
    }

    return isWindows ? 'yt-dlp.exe' : 'yt-dlp';
}

/**
 * Mendapatkan path ke binary ffmpeg
 */
function getFfmpegPath() {
    try {
        const ffmpeg = require('@ffmpeg-installer/ffmpeg');
        return ffmpeg.path;
    } catch (e) {
        console.warn('@ffmpeg-installer/ffmpeg not found, using global command');
        return 'ffmpeg';
    }
}

const defaultOptions = [
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    '--no-check-certificate',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '--add-header', 'Accept-Language:en-US,en;q=0.9',
    '--ffmpeg-location', getFfmpegPath()
];

module.exports = {
    getYtDlpPath,
    getFfmpegPath,
    defaultOptions
};
