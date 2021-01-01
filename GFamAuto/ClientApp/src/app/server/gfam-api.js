const TuyAPI = require('tuyapi');
const express = require('express');
const cors = require('cors');
const app = express();

const port = 3003;

const deviceListManager = require('./device-list');
const clientList = {};

// Configure express
app.use(express.json());
app.use(cors());

// Express routes
app.get('/status', (req, res) => {
    const deviceList = deviceListManager.getDeviceList();
    addAllDeviceStatusToDeviceList(deviceList);  
    
    // Might need signalR to eliminate this setTimeout
    setTimeout(() => {
        res.json(deviceList);
    }, 6000);
});

// app.get('/status/:name', (req, res) => {
//     const deviceList = deviceListManager.getDeviceList();
//     updateDeviceStatus(req.params.name, deviceList);
    
//     setTimeout(() => {
//         res.json(deviceList.find(d => d.urlname === req.params.name));
//     }, 6000);
// });

// app.post('/update/:name', (req, res) => {
//     const deviceList = deviceListManager.getDeviceList();
//     deviceListManager.populateUrlNameAndRoom(deviceList);

//     setDevice(req.params.name, req.body, deviceList);
    
//     setTimeout(() => {
//         res.json(deviceList.find(d => d.urlname === req.params.name));
//     }, 6000);
// });

app.listen(port, () => {
    console.log(`G-Fam API listening at http://localhost:${port}`)
});


// ************************************************************************************
// var awaitingTransmit = true;
// function awaitingXmit() {return awaitingTransmit}

// function setDevice(urlName, deviceConfig, deviceList) {
//     const device = deviceList.find(devc => devc.urlname === urlName);

//     if (!device.client) {
//         initializeClient(device, deviceConfig);
//     }
    
//     // Find device on network
//     device.client.find().then(() => {
//         console.log('Attempting to connect. Device already connected?: ' + device.client.isConnected());

//         if (!device.client.isConnected()) {
//             device.client.connect();
//         } else if (awaitingXmit() && deviceConfig.on !== undefined) {
//             awaitingTransmit = false;
//             console.log('Sending set command from find method: ' + JSON.stringify(deviceConfig));
//             device.client.set({set: deviceConfig.on});
//         }

//         setTimeout(() => {
//             if (device.client.isConnected()) {
//                 console.log('Disconnect fired.');
//                 device.client.disconnect();
//             }
//         }, 1000 * 15);
//     });          
// }

function addAllDeviceStatusToDeviceList(deviceList) {
    if (!deviceList) return;
                
    deviceListManager.populateUrlNameAndRoom(deviceList)
    deviceList.forEach(device => {    
        if (!clientList[device.id]) {
            initializeClient(device);
        }
        
        deviceClient = clientList[device.id];

        // Find device on network
        deviceClient.find().then(() => {
            // Connect to device
            deviceClient.connect();
        });       

        deviceClient.on('data', data => {
            deviceListManager.mapDataToDevice(data, device);
        });
        
        // Disconnect after 10 seconds
        setTimeout(() => { deviceClient.disconnect(); }, 10000);
    });
}

function initializeClient(device) {
    var client = new TuyAPI({id: device.id, key: device.key});
    clientList[device.id] = client;
  
    client.on('error', error => {
        console.log('Error!', error);
    });
  
    client.on('connected', () => {      
      console.log('Connected');
    });
  
    client.on('disonnected', () => {
      console.log('Disconnected');
    });
  
    client.on('data', (data) => {      
      console.log('Data: ' + JSON.stringify(data));
    });
}

function updateDeviceStatus(deviceUrlName, deviceList) {
    if (!deviceList) return;
    if (!deviceUrlName) return;

    deviceListManager.populateUrlNameAndRoom(deviceList);
    const d = deviceList.find(devc => devc.urlname === deviceUrlName);
    console.log(JSON.stringify(d));

    const device = new TuyAPI({
        id: d.id,
        key: d.key
        });
          
    // Find device on network
    device.find().then(() => {
        // Connect to device
        device.connect();
    });
        
    device.on('error', error => {
        console.log('Error!', error);
    });
        
    device.on('data', data => {
        console.log('Data from: ' + d.name, data);
        d['urlname'] = d.name.toLowerCase().replace(' ', '_');
        d['on'] = data.dps['1'];
        
        if (data.dps['3']) {
            d.brightness = data.dps['3'];
        }   
    });
    
    // Disconnect after 5 seconds
    setTimeout(() => { device.disconnect(); }, 5000);
}
