/**
 * MusicFlow App Logic - Vanilla JS
 */

const API_BASE = '/api';
let searchTimeout = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const songsGrid = document.getElementById('songs-grid');
const searchResultsSection = document.getElementById('search-results-section');
const homeView = document.getElementById('home-view');
const playlistView = document.getElementById('playlist-view');
const toastContainer = document.getElementById('toast-container');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Listeners
    searchBtn.addEventListener('click', () => searchSongs());
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            searchSongs();
        }
    });

    // Debounce: 300ms
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchSongs(), 300);
    });

    // Initial Load
    if (typeof loadPlaylists === 'function') loadPlaylists();
});

// --- FUNGSI searchSongs() ---
async function searchSongs() {
    const query = searchInput.value.trim();
    
    // Reset Views
    playlistView.classList.add('hidden');
    homeView.classList.remove('hidden');

    if (!query) {
        searchResultsSection.classList.add('hidden');
        songsGrid.innerHTML = `<div class="col-span-full py-10 text-center text-gray-500 italic">Ketik judul lagu atau nama artis...</div>`;
        return;
    }

    // Tampilkan UI results section
    searchResultsSection.classList.remove('hidden');
    
    // Tampilkan 6 skeleton card
    songsGrid.innerHTML = Array(6).fill(0).map(() => `
        <div class="anti-gravity-card p-4 rounded-xl">
            <div class="w-full aspect-square skeleton rounded-lg mb-4 shadow-xl"></div>
            <div class="h-4 skeleton rounded w-3/4 mb-2"></div>
            <div class="h-3 skeleton rounded w-1/2"></div>
        </div>
    `).join('');

    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        renderSongs(result.data);
    } catch (error) {
        console.error('Search error:', error);
        songsGrid.innerHTML = `<div class="col-span-full py-10 text-center text-red-500">Gagal mencari lagu: ${error.message}</div>`;
    }
}

// --- FUNGSI renderSongs(songs) ---
function renderSongs(songs) {
    songsGrid.innerHTML = "";

    if (songs.length === 0) {
        songsGrid.innerHTML = `<div class="col-span-full py-10 text-center text-gray-400">Lagu tidak ditemukan untuk pencarian ini</div>`;
        return;
    }

    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = "anti-gravity-card group p-4 rounded-xl relative song-item";
        card.dataset.sourceId = song.videoId;

        card.innerHTML = `
            <div class="relative w-full aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden shadow-xl">
                <img src="${song.thumbnail || 'https://via.placeholder.com/160?text=No+Cover'}" 
                     class="w-full h-full object-cover" 
                     onerror="this.src='https://via.placeholder.com/160?text=Error'">
                <button class="btn-play absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                    <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                </button>
            </div>
            <h3 class="font-bold text-sm truncate mb-1" title="${song.title}">${song.title}</h3>
            <p class="text-xs text-gray-400 mb-3">${song.artist}</p>
            <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-500">${song.duration}</span>
                <button class="btn-add-to-playlist text-gray-400 hover:text-white p-1" 
                    onclick='showPlaylistDropdown(event, ${JSON.stringify({source_id: song.videoId, ...song}).replace(/'/g, "&apos;")})'>
                    <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        // Event Listener Play
        card.querySelector('.btn-play').addEventListener('click', () => {
            if (window.player) {
                window.player.playSongFromSearch(song);
            }
        });

        songsGrid.appendChild(card);
    });

    lucide.createIcons();
}

// window access is now handled by player.js
