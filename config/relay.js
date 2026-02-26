const mqtt = require("mqtt");

const client = mqtt.connect(process.env.MQTT_BROKER || "mqtt://localhost:1883");

client.on("connect", () => console.log("[MQTT Relay] Connected"));
client.on("error",   (err) => console.error("[MQTT Relay] Error:", err.message));

exports.sendCommand = (deviceId, command, payload = {}) => {
  const topic = `pi/${deviceId}/command`;
  client.publish(topic, JSON.stringify({ command, ...payload }), { qos: 1 });
  console.log("[MQTT Relay] CMD →", topic, command);
};
