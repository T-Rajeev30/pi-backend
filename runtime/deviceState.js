const devices = new Map();

function updateHeartbeat(id) {
  const d = devices.get(id) || {};
  d.lastSeen = Date.now();

  if (!d.recording) d.status = "STANDBY";

  devices.set(id, d);
}

function startRecording(id) {
  const d = devices.get(id) || {};
  d.recording = true;
  d.status = "RECORDING";
  devices.set(id, d);
}

function stopRecording(id) {
  const d = devices.get(id) || {};
  d.recording = false;
  d.status = "STANDBY";
  devices.set(id, d);
}

function getStatus(id) {
  const d = devices.get(id);
  if (!d) return "OFF";

  if (Date.now() - d.lastSeen > 15000) return "OFF";
  return d.status || "STANDBY";
}

function getAll() {
  const result = [];
  devices.forEach((v, id) => {
    result.push({
      deviceId: id,
      status: getStatus(id),
      recording: v.recording || false
    });
  });
  return result;
}

module.exports = {
  updateHeartbeat,
  startRecording,
  stopRecording,
  getAll
};
