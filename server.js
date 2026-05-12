const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Route Imports
const playlistRouter = require('./routes/playlists');
const searchRouter = require('./routes/search');
const streamRouter = require('./routes/stream');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Logging Middleware
app.use(morgan('dev'));

// 2. Standard Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'] }));
app.use(express.json());

// 3. Rate Limiting (Applied to all API)
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100, // Sufficient for many search/stream requests
    message: { success: false, message: 'Too many requests' }
});
app.use('/api', limiter);

// 4. API ROUTES
app.get('/api/health', (req, res) => res.json({ status: 'OK', version: 'NEW_SERVER_V4_DEBUG' }));

// Mount routers under /api base
app.use('/api', searchRouter);
app.use('/api', playlistRouter);
app.use('/api', streamRouter);
app.use('/api', require('./routes/home'));
app.use('/api', require('./routes/library'));

// 5. STATIC FILES
app.use(express.static(__dirname));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 6. 404 CATCH-ALL for API (After all specific API routes)
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `API Endpoint ${req.path} not found` });
});

// 7. GLOBAL 404 for HTML
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// 8. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 MUSIC FLOW BACKEND RUNNING ON PORT ${PORT} (V4)`);
});
