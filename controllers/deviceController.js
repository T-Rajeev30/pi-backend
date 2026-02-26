const Device   = require("../models/Device");
const GameFilm = require("../models/GameFilm");
const relay    = require("../config/relay");

const OFFLINE_MS = 15000;

function computeStatus(device) {
  if (!device.lastSeen) return "OFF";
  return Date.now() - new Date(device.lastSeen).getTime() > OFFLINE_MS
    ? "OFF"
    : device.status || "STANDBY";
}

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: 1 });
    const list = devices.map((d) => {
      const status = computeStatus(d);
      return {
        deviceId:  d.deviceId,
        name:      d.name || d.deviceId,
        status,
        recording: status === "RECORDING",
        actions: {
          canStart: status === "STANDBY",
          canStop:  status === "RECORDING",
        },
      };
    });
    res.json(list);
  } catch (err) {
    console.error("[getDevices]", err);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};

exports.startRecording = async (req, res) => {
  const { deviceId } = req.params;
  try {
    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ error: "Device not found" });

    // Use computeStatus — not raw device.recording — so a crashed/stale
    // device that never cleared its recording flag doesn't block a new session.
    const status = computeStatus(device);
    if (status === "OFF")       return res.status(400).json({ error: "Device is offline" });
    if (status === "RECORDING") return res.json({ ok: true, message: "Already recording" });

    const film = await GameFilm.create({
      deviceId,
      name:      req.body?.name || "Manual Recording",
      status:    "RECORDING",
      startedAt: new Date(),
    });

    relay.sendCommand(deviceId, "start_recording", { recordingId: film._id.toString() });

    await Device.findOneAndUpdate(
      { deviceId },
      { recording: true, status: "RECORDING", lastSeen: new Date() }
    );

    res.json({ ok: true, recordingId: film._id });
  } catch (err) {
    console.error("[startRecording]", err);
    res.status(500).json({ error: "Failed to start recording" });
  }
};

exports.stopRecording = async (req, res) => {
  const { deviceId } = req.params;
  try {
    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ error: "Device not found" });
    if (!device.recording) return res.json({ ok: true, message: "Already stopped" });

    relay.sendCommand(deviceId, "stop_recording", {});

    await Device.findOneAndUpdate(
      { deviceId },
      { recording: false, status: "PROCESSING", lastSeen: new Date() }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[stopRecording]", err);
    res.status(500).json({ error: "Failed to stop recording" });
  }
};

exports.addDevice = async (req, res) => {
  const { deviceId, name } = req.body;
  if (!deviceId) return res.status(400).json({ error: "deviceId is required" });
  try {
    const existing = await Device.findOne({ deviceId });
    if (existing) return res.status(409).json({ error: "Device already exists" });
    const device = await Device.create({ deviceId, name: name || deviceId });
    res.status(201).json(device);
  } catch (err) {
    console.error("[addDevice]", err);
    res.status(500).json({ error: "Failed to add device" });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    await Device.findOneAndDelete({ deviceId: req.params.deviceId });
    res.json({ ok: true });
  } catch (err) {
    console.error("[deleteDevice]", err);
    res.status(500).json({ error: "Failed to delete device" });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { name: req.body.name },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  } catch (err) {
    console.error("[updateDevice]", err);
    res.status(500).json({ error: "Failed to update device" });
  }
};
