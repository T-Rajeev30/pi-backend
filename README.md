# 🎥 StatCams — Pi Backend

> Real-time game film recording infrastructure powered by Raspberry Pi, MQTT, and Node.js.

StatCams lets coaches and athletes **remotely trigger, monitor, and retrieve game footage** from Raspberry Pi cameras deployed across a facility — all from a single dashboard at [statcams.com](https://statcams.com).

---

## ⚡ How It Works
```
[Raspberry Pi Camera]
        │
        │  MQTT (heartbeat / film_status)
        ▼
[MQTT Broker (Mosquitto)]
        │
        ▼
[Node.js Backend] ◄──► [MongoDB]
        │
        │  Socket.IO (real-time events)
        ▼
[React Dashboard @ statcams.com]
```

1. Pi devices send a **heartbeat** every few seconds to stay marked as online
2. Coaches hit **Start Recording** from the dashboard
3. Backend publishes a command over MQTT to the Pi
4. Pi records, uploads to S3, and reports progress back via MQTT
5. Dashboard updates in real-time via **Socket.IO**

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB + Mongoose |
| Messaging | MQTT (Mosquitto) |
| Real-time | Socket.IO |
| Hosting | AWS EC2 |
| Storage | AWS S3 |

---

## 📁 Project Structure
```
server/
├── app.js                    # Express app, CORS, routes
├── server.js                 # Entry point — DB, Socket.IO, MQTT boot
│
├── config/
│   └── relay.js              # MQTT command publisher (Pi ← Server)
│
├── controllers/
│   ├── deviceController.js   # Device management + recording control
│   └── gameFilmController.js # Film retrieval
│
├── models/
│   ├── Device.js             # Device schema (status, recording, lastSeen)
│   └── GameFilm.js           # Film schema (status, s3Url, timestamps)
│
├── mqtt/
│   └── subscriber.js         # Listens to Pi events, syncs DB, emits Socket.IO
│
└── routes/
    ├── deviceRoutes.js
    └── gameFilmRoutes.js
```

---

## 🔌 API Reference

### Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/devices` | List all devices with live status |
| `POST` | `/devices` | Register a new device |
| `PUT` | `/devices/:deviceId` | Rename a device |
| `DELETE` | `/devices/:deviceId` | Remove a device |
| `POST` | `/devices/:deviceId/start` | 🔴 Start recording |
| `POST` | `/devices/:deviceId/stop` | ⏹ Stop recording |

### Game Films

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/gamefilm` | List all recorded films |

---

## 📡 MQTT Topics

| Topic | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `pi/{deviceId}/heartbeat` | Pi → Server | `{ status }` | Keepalive ping |
| `pi/{deviceId}/film_status` | Pi → Server | `{ status, recordingId, s3Url }` | Upload progress |
| `pi/{deviceId}/command` | Server → Pi | `{ command, recordingId }` | Start/stop trigger |

---

## 🔄 Device Lifecycle
```
OFF ──► STANDBY ──► RECORDING ──► PROCESSING ──► UPLOADING ──► STANDBY
 ▲                                                                  │
 └──────────────── offline (no heartbeat > 15s) ───────────────────┘
```

- Devices are marked **OFF** automatically if no heartbeat is received within **15 seconds**
- A background sweeper runs every **5 seconds** to catch stale devices

---

## 🔴 Real-time Socket.IO Events

| Event | Payload | Description |
|-------|---------|-------------|
| `device_update` | `{ deviceId, status, recording, lastSeen }` | Device state changed |
| `film_update` | `{ film object }` | Film status updated |
| `devices_offline` | `{ count }` | Devices went offline |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pimonitor
MQTT_BROKER=mqtt://localhost:1883
PORT=5001
```

---

## 🚀 Getting Started
```bash
# Install dependencies
npm install

# Start in development
node server.js

# Start in production with PM2
pm2 start server.js --name pi-backend
pm2 save
```

---

## 🌐 CORS Allowed Origins

- `https://statcams.com`
- `https://www.statcams.com`
- `https://zpi.statcams.com`

---

## 📦 Device Schema
```js
{
  deviceId:  String,   // unique identifier e.g. "pi-001"
  name:      String,   // display name
  status:    String,   // OFF | STANDBY | RECORDING | PROCESSING | UPLOADING
  recording: Boolean,
  lastSeen:  Date
}
```

## 🎬 GameFilm Schema
```js
{
  deviceId:    String,
  name:        String,  // e.g. "Varsity Game - Friday"
  status:      String,  // RECORDING | PROCESSING | UPLOADING | COMPLETED | FAILED
  startedAt:   Date,
  completedAt: Date,
  s3Url:       String   // populated after upload
}
```

---

## 👤 Author

Built by [@T-Rajeev30](https://github.com/T-Rajeev30)

---

> *StatCams — Because every play matters.*
