# pi-backend

Backend server for StatCams — a Raspberry Pi based game film recording and monitoring system.

## Stack

- **Node.js** + **Express** — REST API
- **MongoDB** + **Mongoose** — Database
- **MQTT** — Real-time communication with Pi devices
- **Socket.IO** — Real-time updates to the frontend

## Project Structure
```
server/
├── app.js                  # Express app setup
├── server.js               # Entry point, DB + Socket.IO init
├── config/
│   └── relay.js            # MQTT command publisher
├── controllers/
│   ├── deviceController.js # Device CRUD + recording control
│   └── gameFilmController.js
├── models/
│   ├── Device.js           # Device schema
│   └── GameFilm.js         # Game film schema
├── mqtt/
│   └── subscriber.js       # MQTT event listener
├── routes/
│   ├── deviceRoutes.js
│   └── gameFilmRoutes.js
└── runtime/
    └── deviceState.js      # (unused - legacy)
```

## API Endpoints

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/devices` | List all devices |
| POST | `/devices` | Add a device |
| PUT | `/devices/:deviceId` | Update device name |
| DELETE | `/devices/:deviceId` | Delete a device |
| POST | `/devices/:deviceId/start` | Start recording |
| POST | `/devices/:deviceId/stop` | Stop recording |

### Game Films
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gamefilm` | List all game films |

## MQTT Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `pi/{deviceId}/heartbeat` | Pi → Server | Device keepalive + status |
| `pi/{deviceId}/film_status` | Pi → Server | Recording/upload progress |
| `pi/{deviceId}/command` | Server → Pi | Start/stop recording commands |

## Device Status Flow
```
OFF → STANDBY → RECORDING → PROCESSING → UPLOADING → STANDBY
```

## Environment Variables

Create a `.env` file in the root:
```
MONGO_URI=mongodb+srv://...
MQTT_BROKER=mqtt://localhost:1883
PORT=5001
```

## Setup
```bash
npm install
node server.js
```

## Production
```bash
pm2 start server.js --name pi-backend
```
