const router = require("express").Router();
const ctrl   = require("../controllers/deviceController");

router.get("/",                 ctrl.getDevices);
router.post("/",                ctrl.addDevice);
router.put("/:deviceId",        ctrl.updateDevice);
router.delete("/:deviceId",     ctrl.deleteDevice);
router.post("/:deviceId/start", ctrl.startRecording);
router.post("/:deviceId/stop",  ctrl.stopRecording);

module.exports = router;
