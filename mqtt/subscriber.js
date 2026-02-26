// mqtt/subscriber.js — listens to Pi events and keeps DB in sync
const mqtt   = require('mqtt');
const Device   = require('../models/Device');
const GameFilm = require('../models/GameFilm');

const OFFLINE_TIMEOUT_MS = 15000;

const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

client.on('connect', () => {
  // Subscribe to all device topics using wildcards
  client.subscribe('pi/+/heartbeat',   { qos: 1 });
  client.subscribe('pi/+/film_status', { qos: 1 });
  console.log('[MQTT Sub] Subscribed to pi/+/heartbeat and pi/+/film_status');
});

client.on('error', (err) => {
  console.error('[MQTT Sub] Connection error:', err.message);
});

client.on('message', async (topic, rawPayload) => {
  try {
    const parts    = topic.split('/');   // ['pi', 'pi-001', 'event']
    const deviceId = parts[1];
    const event    = parts[2];

    // ── HEARTBEAT ────────────────────────────────────────────────────────────
    if (event === 'heartbeat') {
      let data = {};
      try { data = JSON.parse(rawPayload.toString()); } catch { /* plain ping */ }

      const device = await Device.findOneAndUpdate(
        { deviceId },
        {
          lastSeen: new Date(),
          // Only update status if device is not recording
          ...(data.status && { status: data.status.toUpperCase() }),
        },
        { upsert: true, new: true }
      );

      // Emit real-time update via Socket.IO if connected
      if (global.io) {
        global.io.emit('device_update', {
          deviceId,
          status:    computeStatus(device),
          recording: device.recording,
          lastSeen:  device.lastSeen,
        });
      }
    }

    // ── FILM STATUS ───────────────────────────────────────────────────────────
    if (event === 'film_status') {
      const data = JSON.parse(rawPayload.toString());
      // data = { status, recordingId, s3Url? }

      const { status, recordingId, s3Url } = data;
      if (!recordingId) {
        console.warn('[MQTT Sub] film_status received without recordingId');
        return;
      }

      const update = { status: status.toUpperCase() };
      if (s3Url)                          update.s3Url       = s3Url;
      if (status.toUpperCase() === 'COMPLETED') update.completedAt = new Date();

      const film = await GameFilm.findByIdAndUpdate(recordingId, update, { new: true });

      // If upload completed, make sure device goes back to STANDBY
      if (status.toUpperCase() === 'COMPLETED' || status.toUpperCase() === 'FAILED') {
        await Device.findOneAndUpdate(
          { deviceId },
          { recording: false, status: 'STANDBY' }
        );
      }

      // Emit real-time update for game film table
      if (global.io && film) {
        global.io.emit('film_update', film);
      }

      console.log(`[MQTT Sub] Film ${recordingId} → ${status}`);
    }
  } catch (err) {
    console.error('[MQTT Sub] Message handler error:', err);
  }
});

// ── Helper ───────────────────────────────────────────────────────────────────
function computeStatus(device) {
  if (!device.lastSeen) return 'OFF';
  const offline = Date.now() - new Date(device.lastSeen).getTime() > OFFLINE_TIMEOUT_MS;
  if (offline) return 'OFF';
  return device.status || 'STANDBY';
}

// ── Offline sweeper (runs every 5 s) ─────────────────────────────────────────
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - OFFLINE_TIMEOUT_MS);
    const result = await Device.updateMany(
      { lastSeen: { $lt: cutoff }, status: { $ne: 'OFF' } },
      { status: 'OFF', recording: false }
    );
    if (result.modifiedCount > 0 && global.io) {
      global.io.emit('devices_offline', { count: result.modifiedCount });
    }
  } catch (err) {
    console.error('[Offline Sweeper] Error:', err);
  }
}, 5000);
