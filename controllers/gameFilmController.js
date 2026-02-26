const GameFilm = require("../models/GameFilm");

exports.getFilms = async (req, res) => {
  try {
    const films = await GameFilm.find().sort({ startedAt: -1 });
    res.json(films);
  } catch (err) {
    console.error("[getFilms]", err);
    res.status(500).json({ error: "Failed to fetch films" });
  }
};
