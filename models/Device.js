const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true, unique: true },
  name:      { type: String, default: "" },
  status:    {
    type: String,
    enum: ["OFF", "STANDBY", "RECORDING", "PROCESSING", "UPLOADING"],
    default: "OFF"
  },
  recording: { type: Boolean, default: false },
  lastSeen:  { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);
