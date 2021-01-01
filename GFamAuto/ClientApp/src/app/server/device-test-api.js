const port = 3007;
const wsPort = 3008;

const TuyAPI = require('tuyapi');
const express = require('express');
const cors = require('cors');
const app = express();

// Todo: look into fetching this list in code maybe via the tuya-cli
const deviceListManager = require('./device-list');
var initializedDevices = [];

// Configure web socket
log('Configuring websocket');
const WebSocket = require('ws');
const wss = new WebSocket.Server({port:wsPort});
wss.on('connection', function connection(ws) {
    log('Websocket connection event.');
    
    const devices = getAllDevices();
    ws.send(JSON.stringify(devices));
});

// Configure express
app.use(express.json());
app.use(cors());

app.get('/init/:name', (req, res) => {
    const device = getDevice(req.params.name);

    initializeClient(device);

    const response = {
        "message": 'Ok',
        "device": device
    };

    res.json(response);
});

app.get('/init_all', (req, res) => {
    const devices = getAllDevices();
    const response = [];

    devices.forEach(device => {
        initializeClient(device);

        response.push(device);
    });

    res.json(response);
});

app.get('/fetch/:name', (req, res) => {
    var device = getDevice(req.params.name);

    const response = {
        "message": 'Ok',
        "device": device
    };

    res.json(response);
});

app.get('/fetch_all', (req, res) => {
    const devices = getAllDevices();
    const response = [];

    devices.forEach(device => {
        initializeClient(device, (data) => {
            log(`Data received for ${device.name}: ${JSON.stringify(data)}`);
            response.push(deviceListManager.mapDataToDevice(data, device));
            log(`Scheduling disconnect for ${device.name}`);
            setTimeout(() => {
                log(`Disconnecting ${device.name}`);
                device.client.disconnect();
            });
        });

        device.client.find().then(
            () => device.client.connect(),
            (err) => {log(err)}
        );
    });

    setTimeout(() => {
        res.json(response);
    }, 6000);
});

app.post('/set/:name', (req, res) => {
    awaitingTransmit = true;
    const device = getDevice(req.params.name);
    const deviceConfig = req.body;
    initializeClient(device, (data) => {
        log(`Data received for ${device.name}: ${JSON.stringify(data)}`);
        if (awaitingXmit() && deviceConfig.on !== undefined) {
            log('Sending set command from data event handler: ' + JSON.stringify(deviceConfig));
            awaitingTransmit = false;
      
            if (data.dps['1'] !== deviceConfig.on) {
              log('Setting ' + device.name + ' power: ' + deviceConfig.on);
              device.client.set({set: deviceConfig.on});
            }
      
            if (data.dps['3'] && deviceConfig.brightness && data.dps['3'] !== deviceConfig.brightness) {
              log('Setting ' + device.name + ' brightness: ' + deviceConfig.brightness);
              device.client.set({dps: 3, set: deviceConfig.brightness});
            }
      
            log('Scheduling disconnect');
            setTimeout(() => {
              log('Set complete. Disconnecting');
              device.client.disconnect();
            }, 5000);
          }
    });
});

app.get('/connect/:name', (req, res) => {
    const device = getDevice(req.params.name);

    device.client.find().then(() => {
        // Connect to device
        log('Attempting to connect. Device already connected?: ' + device.client.isConnected());
        device.client.connect().then((result) => {
            log('Connect promise completed with result: ' + result);
        });
    });

    const response = {
        "message": 'Ok'
    };

    res.json(response);
});

app.get('/disconnect/:name', (req, res) => {
    const device = getDevice(req.params.name);

    device.client.disconnect();

    const response = {
        "message": 'Ok'
    };

    res.json(response);
});

app.listen(port, () => {
    log(`Device Test API listening at http://localhost:${port}`)
});

// ************************************************************************************
var awaitingTransmit = false;
function awaitingXmit() {return awaitingTransmit}

function getDevice(deviceName) {
    var device = initializedDevices.find(d => d.name.toLowerCase().replace(/ /g, '_') === deviceName);
    if (!device) {
        device = deviceListManager.getDeviceList().find(d => d.name.toLowerCase().replace(/ /g, '_') === deviceName);
    }

    return device;
}

function getAllDevices() {
    const deviceList = deviceListManager.getDeviceList();
    deviceList.forEach((device) => {
        device = getDevice(deviceListManager.getUrlFriendlyName(device.name));
    });
    return deviceList;
}

function initializeClient(device, dataFunc = null) {
    initializedDevices = initializedDevices.filter(d => d.name !== device.name);

    const version = 3.3;
    device['client'] = new TuyAPI({id: device.id, key: device.key, version});

    device.retry = {
        count: 0,
        max: 5,
        delaySeconds: 10,
        reset: () => {this.count = 0},
        increment: () => {this.count++}
    };

    device.client.on('error', error => {
        log('Error!', error);
        if (device.retry.count < device.retry.max) {
            device.retry.increment();
      
            // Schedule a retry
            const retryDelaySeconds = 10;
            const retryDelay = 1000 * retryDelaySeconds;
            log(`Scheduling a retry from error handler in ${retryDelaySeconds} seconds.`);
            setTimeout(() => {
              log('Initiating retry from error handler.');
              // Find device on network
              device.client.find().then(() => {
                // Connect to device
                log('Attempting to connect. Device already connected?: ' + device.client.isConnected());
      
                if (!device.client.isConnected()) {
                  device.client.connect();
                } else if (awaitingXmit() && deviceConfig.on !== undefined) {
                  log('Sending data get command');
                  device.client.get();
                }
              });
            }, retryDelay);
          } else {
            log('Retries have reached the maximum. No further attempts will be made.');
            device.retry.reset();
          }      
    });

    device.client.on('connected', () => {      
        log('Connected');
    });

    device.client.on('disconnected', () => {
        log('Disconnected');
    });

    dataFunc = dataFunc ? dataFunc : (data) => {log('Data: ' + JSON.stringify(data))};
    device.client.on('data', dataFunc);

    initializedDevices.push(device);

    log('Client initialized: ' + JSON.stringify(device.client));
}

function log(message) {
    console.log(message);
}