# 🎵 MusicFlow - Premium Music Streaming Application

**MusicFlow** adalah aplikasi streaming musik modern yang dibangun dengan teknologi web terkini. Aplikasi ini memungkinkan pengguna untuk mencari, memutar, dan mengelola playlist musik dari YouTube dengan antarmuka yang elegan dan responsif.

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#tentang-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Struktur Proyek](#struktur-proyek)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Dependencies](#dependencies)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Cara Menjalankan](#cara-menjalankan)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Panduan Pengembang](#panduan-pengembang)

---

## 🎯 Tentang Aplikasi

**MusicFlow** adalah solusi streaming musik yang dirancang untuk memberikan pengalaman mendengarkan musik yang premium dan intuitif. Aplikasi ini mengintegrasikan YouTube Music API dan yt-dlp untuk mencari dan memutar musik berkualitas tinggi.

### Tujuan Utama:
- Menyediakan platform streaming musik yang user-friendly
- Memungkinkan pembuatan dan pengelolaan playlist personal
- Memberikan rekomendasi musik trending
- Pencarian musik yang cepat dan akurat dengan caching

---

## ✨ Fitur Utama

### 1. **Home Page**
   - Tampilan trending tracks terbaru
   - Rekomendasi playlist yang dikurasi khusus
   - Interface yang modern dan responsif

### 2. **Search**
   - Pencarian musik real-time dengan debouncing
   - Integrasi dengan YouTube Music API
   - Caching hasil pencarian (5 menit TTL)
   - Menampilkan cover art, artis, dan durasi lagu

### 3. **Library & Playlists**
   - Lihat semua playlist yang telah dibuat
   - Playlist detail dengan daftar lagu
   - Buat playlist baru
   - Tambah/hapus lagu dari playlist
   - Pengelolaan urutan lagu dalam playlist

### 4. **Music Player**
   - Pemutaran audio berkualitas dengan transcoding MP3
   - Kontrol playback: play, pause, next, previous
   - Shuffle dan repeat mode (OFF, ALL, ONE)
   - Volume control dengan visual indicator
   - Progress bar yang interaktif
   - Riwayat pemutaran
   - Like/unlike songs

### 5. **Streaming**
   - Direct streaming dari YouTube
   - Transcoding real-time ke format MP3 (128kbps)
   - Caching URL audio (4 jam TTL)
   - Support untuk berbagai format video

---

## 📁 Struktur Proyek

```
musikal/
├── index.html              # File HTML utama (interface frontend)
├── app.js                  # Controller aplikasi (navigasi, fetch data)
├── player.js               # Engine pemain musik (playback, kontrol)
├── server.js               # Entry point Express server
├── db.js                   # Konfigurasi koneksi MySQL
├── package.json            # Dependencies dan scripts
├── package-lock.json       # Lock file untuk dependencies
├── .env.example            # Template environment variables
├── .gitignore              # File yang diabaikan git
│
├── config/                 # Folder konfigurasi
│   └── ytdlp.js            # Setup yt-dlp & FFmpeg paths
│
├── routes/                 # API Route Handlers
│   ├── home.js             # GET /api/home - featured & popular playlists
│   ├── search.js           # GET /api/search?q={query} - pencarian musik
│   ├── playlists.js        # Manajemen playlist CRUD
│   ├── stream.js           # GET /api/stream/:videoId - streaming audio
│   └── library.js          # Library user (liked songs, etc)
│
└── schema/                 # Database schemas
    ├── schema.sql          # Schema & dummy data utama
    └── senior_backend_music_schema.sql # Alternative schema
```

### Penjelasan Struktur:

#### **Frontend Layer** (index.html, app.js, player.js)
- **index.html**: Struktur UI dengan Tailwind CSS, Lucide icons, dan layout grid responsif
- **app.js**: Mengelola navigasi, fetch data dari API, render UI dinamis
- **player.js**: Class MusicPlayer yang handle audio playback, volume, shuffle, repeat

#### **Backend Layer** (server.js, routes/*)
- **server.js**: Express server, middleware setup (CORS, logging, rate limiting)
- **routes/**: Setiap file adalah router untuk endpoint API spesifik

#### **Data Layer** (db.js, schema/)
- **db.js**: MySQL connection pool dengan error handling
- **schema/**: Database structure dan sample data

#### **Configuration** (config/, .env.example)
- Path ke binary tools (yt-dlp, FFmpeg)
- Environment variables untuk port, database credentials

---

## 🔧 Teknologi yang Digunakan

### **Frontend:**
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Icon library (29+ icons)
- **Vanilla JavaScript (ES6+)** - No framework, pure DOM manipulation
- **Local Storage** - Menyimpan preferensi user (volume, shuffle, repeat mode)

### **Backend:**
- **Node.js** - Runtime JavaScript server-side
- **Express.js 5.x** - Web framework
- **MySQL2/Promise** - Database driver dengan Promise support
- **Morgan** - HTTP request logger
- **CORS** - Cross-Origin Resource Sharing
- **Express Rate Limit** - API rate limiting

### **Music Services:**
- **YTMusic API** - Pencarian musik dari YouTube Music
- **yt-dlp** - Download audio dari YouTube
- **FFmpeg** - Audio transcoding & processing
- **play-dl** - Alternative music downloader
- **ytsr** - YouTube search

### **Utilities:**
- **dotenv** - Environment variable management
- **@distube/ytdl-core** - Alternative YouTube download
- **@ffmpeg-installer/ffmpeg** - FFmpeg binary installer

---

## 📦 Dependencies

### Production Dependencies:

```json
{
  "@distube/ytdl-core": "^4.16.12",      // YouTube downloader
  "@ffmpeg-installer/ffmpeg": "^1.1.0",  // FFmpeg binary
  "cors": "^2.8.6",                      // CORS middleware
  "dotenv": "^17.4.2",                   // Environment config
  "express": "^5.2.1",                   // Web framework
  "express-rate-limit": "^8.5.1",        // Rate limiting
  "fluent-ffmpeg": "^2.1.3",             // FFmpeg wrapper
  "morgan": "^1.10.1",                   // HTTP logging
  "mysql2": "^3.22.3",                   // MySQL driver
  "play-dl": "^1.9.7",                   // Music downloader
  "yt-dlp-exec": "^1.0.2",               // yt-dlp wrapper
  "ytdl-core": "^4.11.5",                // YouTube downloader
  "ytmusic-api": "^5.3.1",               // YouTube Music API
  "ytsr": "^3.8.4"                       // YouTube search
}
```

### Versioning:
- Menggunakan caret (^) untuk versi compatible terbaru
- Node.js minimal: v14+ (recommended v18+)
- npm: v7+

---

## 🚀 Instalasi

### Prerequisites:
- **Node.js** v14+ (recommended v18 LTS)
- **npm** v7+
- **MySQL** v5.7+ atau **MariaDB** v10.3+
- **FFmpeg** (optional, akan diinstall via npm)
- **yt-dlp** (optional, akan diinstall via npm)

### Langkah-langkah Instalasi:

#### 1. Clone Repository
```bash
git clone https://github.com/kerlan404/musikal.git
cd musikal
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Database
```bash
# Buka MySQL client
mysql -u root -p

# Buat database
CREATE DATABASE musicapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE musicapp;

# Import schema (pilih salah satu)
SOURCE schema/schema.sql;
# atau
SOURCE schema/senior_backend_music_schema.sql;
```

#### 4. Setup Environment Variables
```bash
# Copy file template
cp .env.example .env

# Edit .env dengan credentials database Anda
nano .env
```

#### 5. Jalankan Server
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

---

## ⚙️ Konfigurasi

### File `.env` Configuration:

```env
# Server Port
PORT=3000

# Database Configuration
DB_HOST=localhost          # MySQL host
DB_USER=root              # MySQL username
DB_PASS=your_password     # MySQL password
DB_NAME=musicapp          # Database name
```

### Nilai Default:
- Jika `PORT` tidak diset → `3000`
- Jika `DB_HOST` tidak diset → `localhost`
- Jika `DB_USER` tidak diset → `root`
- Jika `DB_PASS` tidak diset → (empty string)
- Jika `DB_NAME` tidak diset → `musicapp`

### Database Connection Pool:
```javascript
// Dari db.js
{
  waitForConnections: true,
  connectionLimit: 10,      // Max concurrent connections
  queueLimit: 0            // Unlimited queue
}
```

---

## 🎮 Cara Menjalankan

### Development Mode:
```bash
npm start
```

Output yang diharapkan:
```
🚀 MUSIC FLOW BACKEND RUNNING ON PORT 3000 (V4)
[DATABASE] Connecting to musicapp as root...
[DATABASE] ✅ Connection Successful
```

### Akses Aplikasi:
- **Frontend**: `http://localhost:3000`
- **API Base**: `http://localhost:3000/api`

### Test Health Check:
```bash
curl http://localhost:3000/api/health
# Response: { "status": "OK", "version": "NEW_SERVER_V4_DEBUG" }
```

### Log Output Monitoring:
Gunakan `npm start` untuk melihat log real-time:
- Database connection
- HTTP requests (Morgan logging)
- API operations
- Streaming status

---

## 📡 API Endpoints

### 1. **Health Check**
```
GET /api/health
Response: { "status": "OK", "version": "NEW_SERVER_V4_DEBUG" }
```

### 2. **Search**
```
GET /api/search?q={query}&limit={limit}

Query Parameters:
- q (required): Search query
- limit (optional): Max results (default: 20)

Response:
{
  "success": true,
  "source": "cache" | "api",
  "data": [
    {
      "videoId": "string",
      "title": "string",
      "artist": "string",
      "thumbnail": "url",
      "duration": "M:SS",
      "durationSeconds": number
    }
  ]
}
```

### 3. **Home Data**
```
GET /api/home

Response:
{
  "success": true,
  "data": {
    "featured": [...],
    "popularPlaylists": [...]
  }
}
```

### 4. **Playlists CRUD**
```
# Get all playlists
GET /api/playlists

# Create playlist
POST /api/playlists
Body: { "name": "string" }

# Get playlist songs
GET /api/playlists/:id/songs

# Add song to playlist
POST /api/playlists/:id/songs
Body: {
  "videoId": "string",
  "title": "string",
  "artist": "string",
  "thumbnail": "url",
  "duration": "M:SS"
}

# Delete playlist
DELETE /api/playlists/:id

# Remove song from playlist
DELETE /api/playlists/:id/songs/:videoId

# Reorder songs
POST /api/playlists/:id/songs/reorder
Body: [
  { "songId": number, "urutan": number },
  ...
]
```

### 5. **Streaming**
```
# Stream audio (MP3)
GET /api/stream/:videoId
Response: audio/mpeg stream

# Get direct audio URL
GET /api/audio-url/:videoId
Response:
{
  "success": true,
  "url": "string",
  "ext": "string",
  "acodec": "string",
  "filesize": number,
  "mimeType": "audio/mp4",
  "expires": timestamp
}
```

### 6. **Library**
```
GET /api/library

Response:
{
  "success": true,
  "data": {
    "liked": [...],
    "history": [...]
  }
}
```

### Rate Limiting:
- **Window**: 60 seconds
- **Max requests**: 100 per window
- **Applied to**: Semua `/api/*` endpoints

---

## 💾 Database Schema

### Tables Structure:

#### **users** (Manajemen User)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **songs** (Penyimpanan Lagu)
```sql
CREATE TABLE songs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  cover_url VARCHAR(255),
  source_id VARCHAR(50),           -- YouTube video ID
  duration VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_title (title),
  KEY idx_artist (artist)
);
```

#### **playlists** (Koleksi Lagu User)
```sql
CREATE TABLE playlists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **playlist_songs** (Many-to-Many Relationship)
```sql
CREATE TABLE playlist_songs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  urutan INT DEFAULT 0,            -- Song order in playlist
  UNIQUE (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
```

### Sample Data:
Database sudah dilengkapi dengan sample data:
- 5 sample users
- 5 sample songs (Blinding Lights, Levitating, dll)
- 5 sample playlists dengan track

---

## 👨‍💻 Panduan Pengembang

### Arsitektur Alur Data:

```
Browser UI (index.html)
    ↓
JavaScript App (app.js)
    ↓
REST API (server.js → routes/*)
    ↓
Data Processing (services)
    ↓
Database (db.js → MySQL)
    ↓
External Services (YouTube Music API, yt-dlp, FFmpeg)
```

### Request-Response Flow Contoh:

#### **Search Flow:**
1. User mengetik di search box
2. `app.js` → `initSearch()` dengan debounce 300ms
3. `fetch('/api/search?q=...')` → `routes/search.js`
4. YTMusic API search songs → transform data
5. Cache hasil (TTL 5 menit)
6. Return JSON → `app.js` render DOM

#### **Playback Flow:**
1. User klik lagu → `player.js.playSong(song, queue)`
2. Set `audio.src = '/api/stream/:videoId'`
3. `stream.js` spawn yt-dlp → FFmpeg → MP3 stream
4. Audio element play
5. Update UI: progress bar, duration, metadata

### Development Tips:

#### 1. **Debug Mode**
```javascript
// Tambahkan di browser console
localStorage.setItem('DEBUG', 'true');
console.log('Debug mode enabled');
```

#### 2. **Clear Cache**
```javascript
// Search cache
// Backend: Restart server (in-memory cache cleared)

// Local Storage
localStorage.clear();
```

#### 3. **Test API**
```bash
# Test search
curl "http://localhost:3000/api/search?q=Blinding%20Lights"

# Test playlists
curl http://localhost:3000/api/playlists

# Test stream
curl -o output.mp3 http://localhost:3000/api/stream/4NRXx6U8ABQ
```

### Common Issues & Solutions:

| Issue | Cause | Solution |
|-------|-------|----------|
| Database connection error | MySQL not running | `sudo service mysql start` |
| "FFmpeg not found" | FFmpeg not installed | `npm install` atau install FFmpeg manually |
| "yt-dlp error" | No internet / YouTube blocks | Check connection, use VPN/proxy |
| "Module not found" | Dependencies missing | `npm install` |
| Port 3000 already in use | Another process on port | `PORT=4000 npm start` atau kill existing process |

### Coding Conventions:

1. **Error Handling**: Always use try-catch di async functions
2. **Logging**: Gunakan format `[CONTEXT] message`
3. **Naming**: camelCase untuk functions/variables, kebab-case untuk files
4. **Comments**: Gunakan JSDoc untuk functions penting
5. **Database**: Selalu gunakan parameterized queries untuk prevent SQL injection

### File Tree Lengkap:
```
musikal/
├── README.md                                    ← You are here
├── package.json                                 (13 dependencies)
├── package-lock.json
├── .env.example
├── .gitignore
├── index.html                                   (215 lines, Tailwind + Lucide)
├── app.js                                       (319 lines, Controller)
├── player.js                                    (333 lines, Audio Engine)
├── server.js                                    (72 lines, Express setup)
├── db.js                                        (30 lines, MySQL pool)
├── config/
│   └── ytdlp.js                                (69 lines, Tool paths)
├── routes/
│   ├── home.js                                 (Featured & playlists)
│   ├── search.js                               (Search + caching)
│   ├── playlists.js                            (Playlist CRUD)
│   ├── stream.js                               (Audio streaming)
│   └── library.js                              (User library)
└── schema/
    ├── schema.sql                              (DB schema + samples)
    └── senior_backend_music_schema.sql
```

---

## 📊 Performance & Optimization

### Caching Strategy:
- **Search Results**: 5 menit in-memory
- **Audio URLs**: 4 jam in-memory
- **Browser Cache**: LocalStorage untuk user preferences

### Rate Limiting:
- 100 requests per 60 seconds per IP
- Protects API dari abuse

### Database Optimization:
- Connection pooling: 10 max connections
- Indexes pada `title`, `artist`, `user_id`
- Unique constraint pada `(playlist_id, song_id)`

### Frontend Optimization:
- Debounced search (300ms)
- Lazy loading images
- Responsive design (mobile-first)

---

## 📄 Lisensi

**ISC License** - Bebas digunakan untuk keperluan komersial dan non-komersial

---

## 🤝 Kontribusi

Untuk berkontribusi:
1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📞 Support

Jika menemukan bug atau ada pertanyaan:
1. Buka GitHub Issue dengan deskripsi detail
2. Sertakan:
   - OS dan Node.js version
   - Steps untuk reproduce
   - Error log/screenshot
   - Expected behavior

---

## 🔗 Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL2/Promise](https://github.com/sidorares/node-mysql2)
- [yt-dlp Repository](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Last Updated**: May 2026 | **Version**: 1.0.0

**Dibuat dengan ❤️ oleh kerlan404**
