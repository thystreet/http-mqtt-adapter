const result = require('dotenv').config();
if (result.error) {
  throw result.error
}

const mqtt = require('mqtt');

const client = mqtt.connect(process.env.MQTT_HOST, {
  port: process.env.MQTT_PORT,
  clientId: 'thystreet_test_' + Math.random().toString(16).substr(2, 8),
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

client.on('connect', function () {
  // publish a message to a topic
  client.subscribe(process.env.MQTT_TEST_ID);
  client.on('message', function (topic, message) {
    console.log('deviceId', topic)
    console.log(message.toString());
  });
});