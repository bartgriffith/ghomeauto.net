const fs = require('fs');
const TuyAPI = require('tuyapi');
const deviceListManager = require('./device-list');

const cron = require('node-cron');

// Set up cron jobs ******************
// Circulate fan
const fanOnCronSchedule = "15,45 * * * *";
const fanOffCronSchedule = "18,48 * * * *";

log('Scheduling fan turn on cron job: ' + fanOnCronSchedule);
cron.schedule(fanOnCronSchedule, function() { 
    log("Turning on the fan"); 
    const mainFan = deviceListManager.getDevice('main_fan');
    let cronConfig = getCronConfig();
    if (cronConfig.circulateMainFan) {
      setDevice(mainFan, {"on": true});
    } else {
      log('Fan not in circulate mode')
    }
}); 

log('Scheduling fan turn off cron job: ' + fanOffCronSchedule);
cron.schedule(fanOffCronSchedule, function() { 
    log("Turning off the fan"); 
    const mainFan = deviceListManager.getDevice('main_fan');
    let cronConfig = getCronConfig();
    if (cronConfig.circulateMainFan) {
      setDevice(mainFan, {"on": false});
    } else {
      log('Fan not in circulate mode')
    }
}); 

// ************************************************************************************
var awaitingTransmit = true; 
function awaitingXmit() {return awaitingTransmit}
const retry = {
  count: 0,
  max: 5,
  delaySeconds: 10,
  reset: () => {this.count = 0},
  increment: () => {this.count++}
};
function getRetry() {return retry}


function getCronConfig() {
  return JSON.parse(fs.readFileSync('./config/cron-server.json'));
}

function setDevice(device, deviceConfig) {
    awaitingTransmit = true;

    initializeClient(device, deviceConfig);

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
}

function initializeClient(device, deviceConfig) {
  log('Initializing Device: ' + device.name);
  deviceListManager.initializedDevices = deviceListManager.initializedDevices.filter(d => d.name !== device.name);

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
    log('Error!' + error);
    
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

  device.client.on('data', (data) => {      
    log('Data: ' + JSON.stringify(data));
    if (awaitingXmit() && deviceConfig.on !== undefined) {
      log('Sending set command from data event handler: ' + JSON.stringify(deviceConfig));
      awaitingTransmit = false;
  
      if (data.dps['1'] !== deviceConfig.on) {
        log('Setting ' + device.name + ' power: ' + deviceConfig.on);
        device.client.set({set: deviceConfig.on});
      } else {
        log(device.name + ' power already set to: ' + data.dps['1'])
      }
  
      if (data.dps['3'] && deviceConfig.brightness) {
        if (data.dps['3'] !== deviceConfig.brightness) {
          log('Setting ' + device.name + ' brightness: ' + deviceConfig.brightness);
          device.client.set({dps: 3, set: deviceConfig.brightness});
        } else {
          log(device.name + ' brightness already set to: ' + data.dps['3']);
        }
      }
      
  
      log('Scheduling disconnect');
      setTimeout(() => {
        log('Set complete. Disconnecting');
        device.client.disconnect();
      }, 5000);
    }
  });

  deviceListManager.initializedDevices.push(device);
}

function log(message) {
  console.log(message);
} 