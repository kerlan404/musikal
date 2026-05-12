/**
 * MusicFlow Premium Player Engine
 * Responsibilities: Audio state, Controls, Progress, Volume, Queue
 */

class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = -1;
        this.currentSong = null;
        
        // State
        this.isPlaying = false;
        this.repeatMode = localStorage.getItem('mf_repeat') || 'OFF'; // OFF, ALL, ONE
        this.isShuffled = localStorage.getItem('mf_shuffle') === 'true';
        this.volume = parseFloat(localStorage.getItem('mf_volume')) || 0.75;
        
        // DOM
        this.elements = {
            btnPlay: document.getElementById('btn-play'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnShuffle: document.getElementById('btn-shuffle'),
            btnRepeat: document.getElementById('btn-repeat'),
            btnLike: document.getElementById('btn-player-like'),
            thumbnail: document.getElementById('player-thumbnail'),
            title: document.getElementById('player-title'),
            artist: document.getElementById('player-artist'),
            timeCurrent: document.getElementById('time-current'),
            timeTotal: document.getElementById('time-total'),
            progressFill: document.getElementById('player-progress-fill'),
            progressContainer: document.getElementById('player-progress-container'),
            volumeFill: document.getElementById('volume-fill'),
            volumePercentage: document.getElementById('volume-percentage'),
            volumeContainer: document.getElementById('volume-slider-container'),
            volumeIcon: document.getElementById('volume-icon')
        };

        this.init();
    }

    init() {
        this.audio.volume = this.volume;
        this.bindEvents();
        this.updateVolumeUI();
        this.updateRepeatUI();
        this.updateShuffleUI();
    }

    parseTimeToSeconds(val) {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val !== 'string') return 0;
        // Handle "MM:SS" or "HH:MM:SS"
        const parts = val.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parseFloat(val) || 0;
    }

    bindEvents() {
        // Audio Listeners
        // FORCED INTERVAL SYNC (The most reliable way)
        setInterval(() => {
            if (!this.audio.paused && this.audio.src) {
                const current = this.audio.currentTime;
                const duration = this.audio.duration;
                
                // Sync Current Time
                this.elements.timeCurrent.textContent = this.formatTime(current);

                // Sync Total Duration with Fallback
                let totalSecs = duration;
                
                // If audio duration is invalid, try to get it from the song object
                if ((!totalSecs || !isFinite(totalSecs)) && this.currentSong) {
                    totalSecs = this.parseTimeToSeconds(this.currentSong.duration_seconds || this.currentSong.duration);
                }

                if (totalSecs && isFinite(totalSecs) && totalSecs > 0) {
                    const percent = (current / totalSecs) * 100;
                    this.elements.progressFill.style.width = `${percent}%`;
                    this.elements.timeTotal.textContent = this.formatTime(totalSecs);
                } else if (this.audio.readyState > 0) {
                    this.elements.timeTotal.textContent = '...';
                }
            }
        }, 500);

        this.audio.onplay = () => {
            this.isPlaying = true;
            this.updatePlayPauseUI();
        };

        this.audio.onpause = () => {
            this.isPlaying = false;
            this.updatePlayPauseUI();
        };

        this.audio.onended = () => {
            this.handleAutoNext();
        };

        // Control Buttons (Optional Bindings to prevent crashes)
        if (this.elements.btnPlay) this.elements.btnPlay.onclick = () => this.togglePlay();
        if (this.elements.btnNext) this.elements.btnNext.onclick = () => this.next();
        if (this.elements.btnPrev) this.elements.btnPrev.onclick = () => this.prev();
        if (this.elements.btnShuffle) this.elements.btnShuffle.onclick = () => this.toggleShuffle();
        if (this.elements.btnRepeat) this.elements.btnRepeat.onclick = () => this.toggleRepeat();
        if (this.elements.btnLike) this.elements.btnLike.onclick = () => this.toggleLike();

        // Seek Control
        if (this.elements.progressContainer) {
            this.elements.progressContainer.onclick = (e) => {
                const rect = this.elements.progressContainer.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (this.audio.duration) {
                    this.audio.currentTime = pos * this.audio.duration;
                }
            };
        }

        // Volume Control
        this.elements.volumeContainer.onclick = (e) => {
            const rect = this.elements.volumeContainer.getBoundingClientRect();
            const val = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            this.setVolume(val);
        };
    }

    /**
     * Helper: Format Seconds to M:SS
     */
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    async playSong(song, newQueue = null) {
        if (!song) return;

        if (newQueue) {
            this.originalQueue = [...newQueue];
            this.queue = this.isShuffled ? this.shuffle([...newQueue]) : [...newQueue];
        }

        this.currentSong = song;
        this.currentIndex = this.queue.findIndex(s => (s.videoId || s.id) === (song.videoId || song.id));

        this.updateUI();
        
        // Load and Play
        try {
            const trackId = song.videoId || song.id;
            this.audio.src = `/api/stream/${trackId}`;
            await this.audio.play();
            
            // Record History
            fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ song_id: song.id, video_id: trackId })
            }).catch(e => {});

            // Sync Like State
            this.syncLikeUI(trackId);

        } catch (err) {
            console.error('Playback failed:', err);
            if (window.showToast) window.showToast('Playback failed', 'error');
        }
    }

    updateUI() {
        const song = this.currentSong;
        if (!song) return;

        this.elements.title.textContent = song.title;
        this.elements.artist.textContent = song.artist;
        
        const thumb = this.elements.thumbnail;
        const defaultIcon = document.getElementById('player-default-icon');
        
        if (song.thumbnail) {
            thumb.src = song.thumbnail;
            thumb.classList.remove('hidden');
            if (defaultIcon) defaultIcon.classList.add('hidden');
        } else {
            thumb.classList.add('hidden');
            if (defaultIcon) defaultIcon.classList.remove('hidden');
        }
        this.updatePlayPauseUI();
    }

    togglePlay() {
        if (!this.audio.src) return;
        this.isPlaying ? this.audio.pause() : this.audio.play();
    }

    next() {
        if (this.queue.length === 0) return;
        let nextIdx = this.currentIndex + 1;
        if (nextIdx >= this.queue.length) {
            if (this.repeatMode === 'ALL') nextIdx = 0;
            else return;
        }
        this.playSong(this.queue[nextIdx]);
    }

    prev() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        if (this.queue.length === 0) return;
        let prevIdx = this.currentIndex - 1;
        if (prevIdx < 0) {
            if (this.repeatMode === 'ALL') prevIdx = this.queue.length - 1;
            else prevIdx = 0;
        }
        this.playSong(this.queue[prevIdx]);
    }

    handleAutoNext() {
        if (this.repeatMode === 'ONE') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.next();
        }
    }

    toggleRepeat() {
        const modes = ['OFF', 'ALL', 'ONE'];
        const currentIdx = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIdx + 1) % modes.length];
        localStorage.setItem('mf_repeat', this.repeatMode);
        this.updateRepeatUI();
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        localStorage.setItem('mf_shuffle', this.isShuffled);
        
        if (this.isShuffled) {
            const currentSongId = this.currentSong?.videoId;
            this.queue = this.shuffle([...this.originalQueue]);
            this.currentIndex = this.queue.findIndex(s => s.videoId === currentSongId);
        } else {
            const currentSongId = this.currentSong?.videoId;
            this.queue = [...this.originalQueue];
            this.currentIndex = this.queue.findIndex(s => s.videoId === currentSongId);
        }
        this.updateShuffleUI();
    }

    setVolume(val) {
        this.volume = val;
        this.audio.volume = val;
        localStorage.setItem('mf_volume', val);
        this.updateVolumeUI();
    }

    // --- UI HELPERS ---

    updatePlayPauseUI() {
        if (!this.elements.btnPlay) return;
        const icon = this.isPlaying ? 'pause' : 'play';
        this.elements.btnPlay.innerHTML = `<i data-lucide="${icon}" class="w-6 h-6 fill-current"></i>`;
        lucide.createIcons();
    }

    updateRepeatUI() {
        if (!this.elements.btnRepeat) return;
        const btn = this.elements.btnRepeat;
        btn.classList.toggle('text-accent-green', this.repeatMode !== 'OFF');
        if (this.repeatMode === 'ONE') {
            btn.innerHTML = '<div class="relative"><i data-lucide="repeat-1" class="w-4 h-4"></i></div>';
        } else {
            btn.innerHTML = '<i data-lucide="repeat" class="w-4 h-4"></i>';
        }
        lucide.createIcons();
    }

    updateShuffleUI() {
        this.elements.btnShuffle.classList.toggle('text-accent-green', this.isShuffled);
    }

    updateVolumeUI() {
        const percent = Math.round(this.volume * 100);
        if (this.elements.volumeFill) this.elements.volumeFill.style.width = `${percent}%`;
        if (this.elements.volumePercentage) this.elements.volumePercentage.textContent = `${percent}%`;
        
        let icon = 'volume-2';
        if (percent === 0) icon = 'volume-x';
        else if (percent < 50) icon = 'volume-1';
        if (this.elements.volumeIcon) {
            this.elements.volumeIcon.setAttribute('data-lucide', icon);
            lucide.createIcons();
        }
    }

    toggleLike() {
        if (this.currentSong && window.toggleLike) {
            window.toggleLike(this.currentSong);
        }
    }

    async syncLikeUI(videoId) {
        try {
            const res = await fetch('/api/library');
            const json = await res.json();
            const isLiked = json.data.liked.some(s => s.videoId === videoId);
            this.elements.btnLike.classList.toggle('text-red-500', isLiked);
            this.elements.btnLike.classList.toggle('fill-current', isLiked);
        } catch (e) {}
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

window.player = new MusicPlayer();
