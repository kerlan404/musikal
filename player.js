class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.queue = [];
        this.currentIndex = -1;
        this.currentSong = null;
        this.isPlaying = false;
        this.isLooping = false;
        this.isLoopingQueue = true;
        this.isShuffling = false;
        this.originalQueue = [];
        this.appTitle = document.title;
        
        // Preload state
        this.preloadedUrl = null;
        this.preloadedVideoId = null;

        // DOM Elements
        this.elements = {
            playerBar: document.querySelector('footer'),
            thumbnail: document.getElementById('player-thumbnail'),
            title: document.getElementById('player-title'),
            artist: document.getElementById('player-artist'),
            btnPlay: document.getElementById('btn-play'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnShuffle: document.getElementById('btn-shuffle'),
            btnRepeat: document.getElementById('btn-repeat'),
            btnForward: document.getElementById('btn-forward'),
            btnBackward: document.getElementById('btn-backward'),
            currentTime: document.getElementById('time-current'),
            durationTime: document.getElementById('time-total'),
            progressBar: document.getElementById('player-audio'),
            progressKnob: document.getElementById('progress-knob'),
            progressContainer: document.getElementById('progress-container'),
            volumeBar: document.getElementById('volume-slider'),
            volumeContainer: document.getElementById('volume-container')
        };

        this.initEventListeners();
    }

    initEventListeners() {
        // Audio events
        this.audio.ontimeupdate = () => {
            this.updateProgressBar();
            
            // Trigger preload if remaining time < 45s
            if (this.audio.duration && (this.audio.duration - this.audio.currentTime < 45)) {
                this.preloadNext();
            }
        };
        
        this.audio.oncanplay = () => {
            this.hideLoadingState();
            this.updateUI();
            this.elements.progressBar.classList.remove('animate-pulse-slow');
        };

        this.audio.onplay = () => {
            this.isPlaying = true;
            this.updateUI();
            this.hideLoadingState();
        };

        this.audio.onpause = () => {
            this.isPlaying = false;
            this.updateUI();
        };

        this.audio.onwaiting = () => {
            this.showLoadingState();
            this.elements.progressBar.classList.add('animate-pulse-slow');
        };

        this.audio.onplaying = () => {
            this.hideLoadingState();
            this.elements.progressBar.classList.remove('animate-pulse-slow');
        };

        this.audio.onended = () => {
            if (!this.isLooping) this.next();
        };

        this.audio.onerror = () => {
            // Error handled in loadAudio catch block usually, 
            // but this is for errors during playback
            console.error("[PLAYER] Audio error during playback");
        };

        // UI Control events
        this.elements.btnPlay.onclick = () => this.isPlaying ? this.pause() : this.play();
        this.elements.btnNext.onclick = () => this.next();
        this.elements.btnPrev.onclick = () => this.prev();
        this.elements.btnShuffle.onclick = () => this.toggleShuffle();
        this.elements.btnRepeat.onclick = () => this.toggleLoop();
        this.elements.btnForward.onclick = () => this.seekForward();
        this.elements.btnBackward.onclick = () => this.seekBackward();

        this.elements.progressContainer.onclick = (e) => {
            const rect = this.elements.progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (this.audio.duration) this.audio.currentTime = pos * this.audio.duration;
        };

        this.elements.volumeContainer.onclick = (e) => {
            const rect = this.elements.volumeContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            this.setVolume(pos * 100);
        };
    }

    /**
     * REWRITE: loadAudio(videoId)
     * Dual-mode strategy for high reliability
     */
    async loadAudio(videoId) {
        // RESET audio element
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();

        // CEK PRELOAD: Jika sudah ada URL preloaded untuk videoId ini
        if (this.preloadedVideoId === videoId && this.preloadedUrl) {
            console.log('[PLAYER] Using preloaded URL ✓');
            this.audio.src = this.preloadedUrl;
            this.audio.type = 'audio/mp4';
            this.preloadedUrl = null;
            this.preloadedVideoId = null;
            return 'preload';
        }

        // STRATEGI 1: Coba /api/audio-url (direct CDN URL)
        try {
            console.log('[PLAYER] Attempting Mode: Direct CDN URL...');
            const res = await fetch(`/api/audio-url/${videoId}`);
            if (!res.ok) throw new Error('audio-url endpoint gagal');
            const data = await res.json();
            
            this.audio.src = data.url;
            this.audio.type = 'audio/mp4';
            
            // Test apakah browser bisa load
            await new Promise((resolve, reject) => {
                const onCanPlay = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    reject(new Error('Browser cannot play this stream'));
                };
                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Timeout loading direct URL'));
                }, 8000);

                const cleanup = () => {
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.audio.removeEventListener('error', onError);
                    clearTimeout(timeout);
                };

                this.audio.addEventListener('canplay', onCanPlay);
                this.audio.addEventListener('error', onError);
                this.audio.load();
            });
            
            console.log('[PLAYER] Mode: Direct CDN URL ✓');
            return 'direct';
            
        } catch (err) {
            console.warn('[PLAYER] Direct URL gagal, coba stream pipe...', err.message);
        }
        
        // STRATEGI 2: Fallback ke /api/stream (pipe yt-dlp + ffmpeg)
        try {
            console.log('[PLAYER] Attempting Mode: Stream Pipe...');
            this.audio.src = `/api/stream/${videoId}`;
            this.audio.type = 'audio/mpeg';
            
            await new Promise((resolve, reject) => {
                const onCanPlay = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    reject(new Error('Browser cannot play transcoded stream'));
                };
                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Timeout loading transcoded stream'));
                }, 15000);

                const cleanup = () => {
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.audio.removeEventListener('error', onError);
                    clearTimeout(timeout);
                };

                this.audio.addEventListener('canplay', onCanPlay);
                this.audio.addEventListener('error', onError);
                this.audio.load();
            });
            
            console.log('[PLAYER] Mode: Stream Pipe ✓');
            return 'stream';
            
        } catch (err) {
            console.error('[PLAYER] Semua metode gagal:', err.message);
            throw new Error('Audio tidak dapat dimuat');
        }
    }

    /**
     * UPDATE: playSongFromSearch(song)
     * Optimistic loading + reliable playback
     */
    async playSongFromSearch(song) {
        if (!song || !song.videoId) return;

        // Update UI bottom player dulu (optimistic UI)
        this.updatePlayerUI(song);
        this.showLoadingState();
        this.elements.progressBar.classList.add('animate-pulse-slow');
        
        // Show player bar if hidden
        this.elements.playerBar.classList.add('active');
        this.elements.playerBar.classList.remove('hidden');

        try {
            this.currentSong = song;
            this.highlightActiveCard(song.videoId);
            document.title = `${song.title} — ${song.artist} ♪`;

            await this.loadAudio(song.videoId);
            await this.audio.play();
            
            this.isPlaying = true;
            this.updateUI();
            this.hideLoadingState();
            
            // Set timeout for preloading next song (30s after start)
            setTimeout(() => this.preloadNext(), 30000);

        } catch (err) {
            this.hideLoadingState();
            this.showToast('Lagu ini tidak dapat diputar. Mencoba lagu berikutnya...', 'error');
            console.error('[PLAYER] Error:', err);
            setTimeout(() => this.next(), 2000);
        }
    }

    preloadNext() {
        if (this.queue.length === 0) return;
        const nextIndex = (this.currentIndex + 1) % this.queue.length;
        const nextSong = this.queue[nextIndex];
        if (!nextSong || this.preloadedVideoId === nextSong.videoId) return;
        
        console.log('[PLAYER] Preloading next:', nextSong.title);
        // Fetch URL di background (jangan play)
        fetch(`/api/audio-url/${nextSong.videoId}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.preloadedUrl = data.url;
                    this.preloadedVideoId = nextSong.videoId;
                    console.log('[PLAYER] Preloaded ready for:', nextSong.title);
                }
            })
            .catch(() => {}); // silent fail
    }

    updatePlayerUI(song) {
        this.elements.thumbnail.src = song.thumbnail || 'https://via.placeholder.com/160?text=No+Cover';
        this.elements.title.textContent = song.title;
        this.elements.artist.textContent = song.artist;
    }

    showLoadingState() {
        if (this.elements.btnPlay) {
            this.elements.btnPlay.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    hideLoadingState() {
        if (this.elements.btnPlay) {
            const iconName = this.isPlaying ? 'pause' : 'play';
            this.elements.btnPlay.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 fill-current"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-24 right-4 px-6 py-3 rounded-lg shadow-2xl z-[9999] transition-all duration-500 translate-y-20 opacity-0 bg-[#282828] text-white text-sm border-l-4 font-medium`;
        
        const colors = {
            success: '#1DB954',
            error: '#E53935',
            warning: '#FFD600'
        };
        
        toast.style.borderLeftColor = colors[type] || colors.success;
        toast.innerHTML = msg;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        }, 10);
        
        // Remove after 3s
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    highlightActiveCard(videoId) {
        document.querySelectorAll('.song-item, .song-card').forEach(card => {
            card.classList.remove('playing');
            if (card.dataset.videoId === videoId) {
                card.classList.add('playing');
            }
        });
    }

    play() {
        if (!this.audio.src) return;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateUI();
        }).catch(err => console.warn("Playback failed:", err));
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUI();
    }

    next() {
        if (this.queue.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        this.playSong(this.currentIndex);
    }

    prev() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
            this.playSong(this.currentIndex);
        }
    }

    playSong(index) {
        if (index < 0 || index >= this.queue.length) return;
        this.currentIndex = index;
        const song = this.queue[index];
        this.playSongFromSearch(song);
    }

    seekForward() { this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10); }
    seekBackward() { this.audio.currentTime = Math.max(0, this.audio.currentTime - 10); }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.audio.loop = this.isLooping;
        this.elements.btnRepeat.classList.toggle('text-spotify-green', this.isLooping);
    }

    toggleShuffle() {
        this.isShuffling = !this.isShuffling;
        this.elements.btnShuffle.classList.toggle('text-spotify-green', this.isShuffling);
    }

    setVolume(val) {
        this.audio.volume = Math.max(0, Math.min(100, val)) / 100;
        this.elements.volumeBar.style.width = `${val}%`;
    }

    updateProgressBar() {
        const { currentTime, duration } = this.audio;
        if (!duration) return;
        const percent = (currentTime / duration) * 100;
        this.elements.progressBar.style.width = `${percent}%`;
        this.elements.progressKnob.style.left = `${percent}%`;
        this.elements.currentTime.textContent = this.formatTime(currentTime);
        this.elements.durationTime.textContent = this.formatTime(duration);
    }

    updateUI() {
        if (this.elements.btnPlay) {
            const iconName = this.isPlaying ? 'pause' : 'play';
            this.elements.btnPlay.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 fill-current"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
}

window.player = new MusicPlayer();
