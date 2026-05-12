/**
 * MusicFlow App Controller - Final Functional Version
 */

const API_BASE = '/api';
let currentView = 'home';

// DOM Elements
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.nav-link');
const trendingScroll = document.getElementById('trending-scroll');
const homePlaylistsGrid = document.getElementById('home-playlists-grid');
const libraryPlaylistsGrid = document.getElementById('library-playlists-grid');

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadHome();
    loadSidebarPlaylists();
    initPlaylistModal();
    initSearch(); // Added this
});

// --- SEARCH ---

function initSearch() {
    const searchInput = document.getElementById('search-page-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length < 2) {
                document.getElementById('search-results-grid').innerHTML = '';
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
                const json = await res.json();
                if (json.success) renderSearchResults(json.data);
            } catch (e) {}
        }, 300));
    }
}

let lastSearchResults = []; // Store results globally for safety

function renderSearchResults(songs) {
    const container = document.getElementById('search-results-grid');
    if (!container) return;
    
    lastSearchResults = songs; // Save to global
    
    container.innerHTML = songs.map((s, index) => `
        <div class="song-card group" onclick="playSearchSong(${index})">
            <div class="img-container">
                <img src="${s.thumbnail}" onerror="this.src='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'">
                <div class="play-overlay"><i data-lucide="play" class="fill-current ml-1"></i></div>
            </div>
            <h4 class="font-bold text-sm truncate mt-2 text-white">${s.title}</h4>
            <p class="text-xs text-white/50 truncate">${s.artist}</p>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

// Safer global function
window.playSearchSong = (index) => {
    const song = lastSearchResults[index];
    if (song && window.player) {
        window.player.playSong(song, lastSearchResults);
    }
};

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- NAVIGATION ---

function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const view = link.getAttribute('data-view');
            switchView(view);
        });
    });
}

async function switchView(viewName) {
    currentView = viewName;
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-view') === viewName));
    viewSections.forEach(s => s.classList.toggle('active', s.id === `${viewName}-view`));

    if (viewName === 'home') loadHome();
    if (viewName === 'library') loadLibrary();
}

// --- DATA FETCHING ---

async function loadHome() {
    try {
        const res = await fetch(`${API_BASE}/home`);
        const json = await res.json();
        if (json.success && json.data) {
            renderTrending(json.data.featured || []);
            renderHomePlaylists(json.data.popularPlaylists || []);
        }
    } catch (e) {}
}

async function loadLibrary() {
    try {
        const res = await fetch(`${API_BASE}/playlists`);
        const json = await res.json();
        if (json.success) renderLibraryPlaylists(json.data);
    } catch (e) {}
}

async function loadSidebarPlaylists() {
    try {
        const res = await fetch(`${API_BASE}/playlists`);
        const json = await res.json();
        if (json.success) {
            const container = document.getElementById('sidebar-playlists');
            if (container) {
                container.innerHTML = json.data.map(p => `
                    <button onclick="openPlaylist(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="playlist-link">
                        <i data-lucide="music-2" class="w-4 h-4"></i>
                        <span class="truncate">${p.name}</span>
                    </button>
                `).join('');
                if (window.lucide) lucide.createIcons();
            }
        }
    } catch (e) {}
}

// --- PLAYLIST DETAIL ---

window.openPlaylist = async (id, name) => {
    switchView('playlist-detail');
    
    // Inject Structure first to avoid null errors
    playlistDetailView.innerHTML = `
        <div class="flex flex-col md:flex-row items-end gap-8 mb-10">
            <div class="w-64 h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                <i data-lucide="music" class="w-24 h-24 text-white/10"></i>
            </div>
            <div class="flex-1">
                <p class="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-accent-green">Playlist</p>
                <h2 id="detail-playlist-name" class="text-7xl font-black mb-6">${name}</h2>
                <div class="flex items-center gap-4 text-sm font-medium text-white/60">
                    <span class="text-white font-bold">MusicFlow</span>
                    <span>•</span>
                    <span id="detail-playlist-count">0</span> songs
                </div>
            </div>
        </div>

        <div class="flex items-center gap-8 mb-12">
            <button class="w-16 h-16 bg-accent-green text-black rounded-full flex items-center justify-center hover:scale-110 transition shadow-xl">
                <i data-lucide="play" class="w-8 h-8 fill-current ml-1"></i>
            </button>
            <button class="text-white/40 hover:text-white transition"><i data-lucide="heart" class="w-8 h-8"></i></button>
            <button class="text-white/40 hover:text-white transition"><i data-lucide="more-horizontal" class="w-8 h-8"></i></button>
        </div>

        <div id="playlist-songs-list" class="space-y-1">
            <div class="animate-pulse flex flex-col gap-4">
                <div class="h-12 bg-white/5 rounded-xl w-full"></div>
                <div class="h-12 bg-white/5 rounded-xl w-full"></div>
                <div class="h-12 bg-white/5 rounded-xl w-full"></div>
            </div>
        </div>
    `;
    
    if (window.lucide) lucide.createIcons();

    try {
        const res = await fetch(`${API_BASE}/playlists/${id}/songs`);
        const json = await res.json();
        const songsList = document.getElementById('playlist-songs-list');
        
        if (json.success && json.data) {
            document.getElementById('detail-playlist-count').textContent = json.data.length;
            renderPlaylistSongs(json.data);
        } else {
            songsList.innerHTML = '<p class="text-white/40 py-10 px-4">No songs in this playlist yet.</p>';
        }
    } catch (e) {
        document.getElementById('playlist-songs-list').innerHTML = '<p class="text-red-500/50 py-10 px-4">Failed to load playlist songs.</p>';
    }
};

function renderPlaylistSongs(songs) {
    const container = document.getElementById('playlist-songs-list');
    container.innerHTML = songs.map((s, idx) => `
        <div class="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl group cursor-pointer transition" onclick="window.player.playSong(${JSON.stringify(s).replace(/"/g, '&quot;')}, ${JSON.stringify(songs).replace(/"/g, '&quot;')})">
            <span class="w-8 text-right text-white/40 font-mono text-sm group-hover:hidden">${idx + 1}</span>
            <i data-lucide="play" class="w-4 h-4 text-white hidden group-hover:block ml-2"></i>
            <img src="${s.thumbnail}" class="w-10 h-10 rounded-lg object-cover">
            <div class="flex-1 min-w-0">
                <h5 class="font-bold text-sm truncate">${s.title}</h5>
                <p class="text-xs text-white/40 truncate">${s.artist}</p>
            </div>
            <span class="text-xs text-white/40 font-mono">${s.duration || '--:--'}</span>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

// --- PLAYLIST MODAL ---

function initPlaylistModal() {
    const btnNew = document.getElementById('btn-create-playlist');
    const modal = document.getElementById('playlist-modal');
    const btnSave = document.getElementById('btn-save-playlist');
    const input = document.getElementById('playlist-name-input');

    if (btnNew) btnNew.onclick = () => modal.classList.add('active');
    if (btnSave) {
        btnSave.onclick = async () => {
            const name = input.value.trim();
            if (!name) return;
            try {
                const res = await fetch(`${API_BASE}/playlists`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                const json = await res.json();
                if (json.success) {
                    window.showToast('Playlist created!');
                    modal.classList.remove('active');
                    input.value = '';
                    loadSidebarPlaylists();
                    if (currentView === 'library') loadLibrary();
                }
            } catch (e) {}
        };
    }
}

// --- RENDERING ---

let lastTrendingResults = [];
function renderTrending(songs) {
    if (!trendingScroll) return;
    lastTrendingResults = songs;
    trendingScroll.innerHTML = songs.map((s, index) => `
        <div class="song-card group" onclick="playTrendingSong(${index})">
            <div class="img-container">
                <img src="${s.thumbnail}" onerror="this.src='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'">
                <div class="play-overlay"><i data-lucide="play" class="fill-current ml-1"></i></div>
            </div>
            <h4 class="font-bold text-sm truncate mt-2">${s.title}</h4>
            <p class="text-xs text-white/50 truncate">${s.artist}</p>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

window.playTrendingSong = (index) => {
    const song = lastTrendingResults[index];
    console.log('Playing trending:', song?.title);
    if (song && window.player) {
        window.player.playSong(song, lastTrendingResults);
    }
};

window.playSearchSong = (index) => {
    const song = lastSearchResults[index];
    console.log('Playing search result:', song?.title);
    if (song && window.player) {
        window.player.playSong(song, lastSearchResults);
    }
};

function renderLibraryPlaylists(playlists) {
    if (!libraryPlaylistsGrid) return;
    libraryPlaylistsGrid.innerHTML = playlists.map(p => `
        <div class="song-card" onclick="openPlaylist(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
            <div class="img-container">
                <img src="${p.thumbnail || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200&h=200&fit=crop'}">
            </div>
            <h4 class="font-bold text-sm truncate">${p.name}</h4>
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${p.songCount || 0} Tracks</p>
        </div>
    `).join('');
}

function renderHomePlaylists(playlists) {
    if (!homePlaylistsGrid) return;
    homePlaylistsGrid.innerHTML = playlists.map(p => `
        <div class="song-card" onclick="openPlaylist(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
            <div class="img-container">
                <img src="${p.thumbnail || 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=200&h=200&fit=crop'}">
            </div>
            <h4 class="font-bold text-sm truncate">${p.name}</h4>
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${p.songCount || 0} Tracks</p>
        </div>
    `).join('');
}

// GLOBAL UI
window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-premium animate-in slide-in-from-right duration-300`;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
