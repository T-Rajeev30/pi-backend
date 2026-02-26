const mongoose = require("mongoose");

const gameFilmSchema = new mongoose.Schema({
  deviceId:    { type: String, required: true },
  name:        { type: String, default: "Manual Recording" },
  status:      {
    type: String,
    enum: ["RECORDING", "PROCESSING", "UPLOADING", "COMPLETED", "FAILED"],
    default: "RECORDING"
  },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  s3Url:       { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("GameFilm", gameFilmSchema);
