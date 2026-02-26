// app.js
const express      = require('express');
const cors         = require('cors');
const deviceRoutes = require('./routes/deviceRoutes');
const filmRoutes   = require('./routes/gameFilmRoutes');

const app = express();

app.use(cors({
  origin: [
    'https://statcams.com',
    'https://www.statcams.com',
    'https://zpi.statcams.com',
  ],
  credentials: true,
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/devices',  deviceRoutes);
app.use('/gamefilm', filmRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }));

module.exports = app;
