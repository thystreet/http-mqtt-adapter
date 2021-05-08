const result = require('dotenv').config();
if (result.error) {
  throw result.error
}

const { createServer } = require("http");
const { createHmac } = require('crypto')
const mqtt = require('mqtt')

// Transform your request data to your device data.
const transformData = function (data) {
  return data;
}

// Validates the request with the provided signature
const isRequestValid = function (data, signature) {
  return createHmac('sha256', process.env.SECRET_TOKEN).update(data).digest('hex') === signature;
}

const sendMqttData = (deviceTopic, data, callback) => {
  const client = mqtt.connect(process.env.MQTT_HOST, {
    port: process.env.MQTT_PORT,
    clientId: 'thystreet_dev_' + Math.random().toString(16).substr(2, 8),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  client.on('connect', function () {
    client.publish(deviceTopic, data, {qos: 2}, function (err) {
        console.log(err);
        callback(err);
        client.end(); // Close the connection when published
      });
  });
}


// Listen to all the requests from thystreet
// decrypt and send subsequent requests to your
// mqtt server
const thystreetListener = function (req, res) {
  const body = [];
  req.on('error', () => {
    res.writeHead(500);
    res.end('Invalid');
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    const data = Buffer.concat(body).toString();
    // at this point, `body` has the entire request body stored in it as a string
    const signature = req.headers['x-thystreet-signature'];
    const deviceId = req.url;
    res.setHeader("Content-Type", "text/plain");
    if (isRequestValid(data, signature)) {
      // send MQTT request
      sendMqttData(deviceId, data, (e) => {
        console.log('message sent');
        if (e) {
          res.writeHead(500);
          res.end('error');
          return;
        }
      // It is IMPORTANT to send 2XX code
      // it marks the order as complete
      // marked as complete
        res.writeHead(200);
        res.end("Ok");
        return
      });
    } else {
      res.writeHead(400);
      res.end('Invalid');
    }
  });
};

const port = Number(process.env.PORT) || 3000;
const server = createServer(thystreetListener);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});