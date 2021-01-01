const TuyAPI = require('tuyapi');
const express = require('express');
const cors = require('cors');
const app = express();

const port = 3000;
const _app_folder = '../../../dist/tuya-test';

// Configure express
app.use(express.json());
app.use(cors());

// Express routes
app.get('*.*', express.static(_app_folder));

app.get('/status', (req, res) => {
    const deviceList = getDeviceList();
    addDeviceStatusToList(deviceList);
    
    setTimeout(() => {
        res.json(deviceList);
    }, 6000);
});

app.get('/status/:name', (req, res) => {
    const deviceList = getDeviceList();
    updateDeviceStatus(req.params.name, deviceList);
    
    setTimeout(() => {
        res.json(deviceList.find(d => d.urlname === req.params.name));
    }, 6000);
});

app.post('/update/:name', (req, res) => {
    const deviceList = getDeviceList();
    populateUrlNameAndRoom(deviceList);
    setDevice(req.params.name, req.body, deviceList);
    
    setTimeout(() => {
        res.json(deviceList.find(d => d.urlname === req.params.name));
    }, 6000);
});

app.all('*', (req, res) => {
    // res.send('Hello World!');
    res.status(200).sendFile(`/`, {root: _app_folder});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});


// ************************************************************************************
function populateUrlNameAndRoom(deviceList) {
        deviceList.forEach(device => {
            device['urlname'] = device.name.toLowerCase().replace(/ /g, '_')

            switch (device['name']) {
                case 'Kitchen Pendent Light':
                case 'Under Cabinet Lights':
                case 'Bar Lights':
                case 'Pantry Lights':
                    device['room'] = 'Kitchen';
                    break;
                case 'Stair Lights':
                case 'Foyer Light':
                case 'Foyer Wall':
                case 'Christmas Tree':
                case 'Main Fan':
                    device['room'] = 'Entryway';
                    break;
                case 'Garage Light':
                case 'Breezeway Light':
                    device['room'] = 'Garage';
                    break;
                case 'Back Flood Lights':
                case 'Back Porch Wall Light':
                case 'Back Pendent Lights':
                    device['room'] = 'Back Yard';
                    break;
                case 'Front Door Lights':
                case 'Front Flood Lights':
                    device['room'] = 'Front Yard';
                    break;
                case 'Master Light':
                case 'Master Fan':
                    device['room'] = 'Master Bedroom';
                    break;
                case 'Living Room Light':
                    device['room'] = 'Living Room';
                    break;
                case 'South Beam Light1':
                case 'South Beam Light2':
                case 'South Beam Light3':
                case 'South Beam Light4':
                    device['room'] = 'South Beam';
                    break;
                default:
                    break;
            }
        });
}

function setDevice(urlName, deviceConfig, deviceList) {
    const d = deviceList.find(devc => devc.urlname === urlName);

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
    
    device.on('connected', () => {
        if (deviceConfig.brightness || deviceConfig.color || deviceConfig.saturation) {
            const data = {
                '1': deviceConfig.on
            }
            if (deviceConfig.color) {
                data['2'] = deviceConfig.color ? 'colour' : 'white';
            }
            if (deviceConfig.brightness) {
                data['3'] = deviceConfig.brightness;
            }
            if (deviceConfig.saturation) {
                data['4'] = deviceConfig.saturation;
            }
            if (deviceConfig['5']) {
                data['5'] = deviceConfig['5'];
            }
            if (deviceConfig['6']) {
                data['6'] = deviceConfig['6'];
            }
            if (deviceConfig['7']) {
                data['7'] = deviceConfig['7'];
            }
            if (deviceConfig['8']) {
                data['8'] = deviceConfig['8'];
            }
            if (deviceConfig['9']) {
                data['9'] = deviceConfig['9'];
            }
            if (deviceConfig['10']) {
                data['10'] = deviceConfig['10'];
            }
            if (deviceConfig['101']) {
                data['101'] = deviceConfig['101'];
            }
            console.log(data);
            device.set({
                multiple: true,
                data
            }).then(res => console.log(res),(err => console.error(err)));
        } else {
            device.set({dps: 1, set: deviceConfig.on});
        }
    });
    
    // Disconnect after 5 seconds
    setTimeout(() => { device.disconnect(); }, 5000);
}

function addDeviceStatusToList(deviceList) {
    if (!deviceList) return;
                
    populateUrlNameAndRoom(deviceList)
    deviceList.forEach(d => {    
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
            d['on'] = data.dps['1'];

            if (data.dps['2']) {
                d['color'] = data.dps['2'] === 'colour';
            }
            
            if (data.dps['3']) {
                d['brightness'] = data.dps['3'];
            }
            
            if (data.dps['4']) {
                d['saturation'] = data.dps['4'];
            }

            if (data.dps['5']) {
                d['5'] = data.dps['5']
            }
            if (data.dps['6']) {
                d['6'] = data.dps['6']
            }
            if (data.dps['7']) {
                d['7'] = data.dps['7']
            }
            if (data.dps['8']) {
                d['8'] = data.dps['8']
            }
            if (data.dps['9']) {
                d['9'] = data.dps['9']
            }
            if (data.dps['10']) {
                d['10'] = data.dps['10']
            }
            if (data.dps['101'] !== undefined) {
                d['101'] = data.dps['101'];
            }
        });
        
      // Disconnect after 5 seconds
      setTimeout(() => { device.disconnect(); }, 5000);
    });
}

function updateDeviceStatus(deviceUrlName, deviceList) {
    if (!deviceList) return;
    if (!deviceUrlName) return;

    populateUrlNameAndRoom(deviceList);
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

function notAllDevicesResolved(deviceList) {
    deviceList.forEach(d => {
        if (d.on === undefined) {
            return true;
        }
    });

    return false;
}

function getDeviceList() {
    return [
        {
            name: 'Main Fan',
            id: '043641402cf432d0b3bd',
            key: '467d544c535bd616'
        },
        {
          name: 'Kitchen Pendent Light',
          id: '0502521440f520e6211f',
          key: '32eff098d45bf002'
        },
        {
          name: 'Stair Lights',
          id: '10246483c82b965c8e92',
          key: 'c7e933d8d0a75f62'
        },
        {
          name: 'Foyer Light',
          id: '043641402cf432d0c9a9',
          key: 'b00fb525ac3b4aa4'
        },
        {
          name: 'Garage Light',
          id: '4557805840f520c09128',
          key: 'cff73aaa93703a93'
        },
        {
          name: 'Under Cabinet Lights',
          id: '7361528610521cc030c7',
          key: '54a2614b33e9926d'
        },
        {
          name: 'Back Flood Lights',
          id: '736152862462ab5a928c',
          key: 'cee6951915fd89fb'
        },
        {
          name: 'Front Door Lights',
          id: '4557805840f520c0daaa',
          key: '9c19be5d09adab4a'
        },
        {
          name: 'Bar Lights',
          id: '60555702c82b96667533',
          key: '72eed691b688cee4'
        },
        {
          name: 'Master Light',
          id: '10246483c44f33caaac9',
          key: '47ffb2da4395ae1c'
        },
        {
          name: 'Christmas Tree',
          id: '043641402cf432d0b623',
          key: '5cec0622864a901b'
        },
        {
          name: 'Master Fan',
          id: '05760644d8f15bd3f63a',
          key: 'cc94720978210a1c'
        },
        {
          name: 'Breezeway Light',
          id: '0502521470039fced753',
          key: 'c304014671476759'
        },
        {
          name: 'Back Porch Wall Light',
          id: '806188072462ab5a5c7c',
          key: '16336d639d91adb8'
        },
        {
          name: 'Back Pendent Lights',
          id: '28011803c82b96e071b1',
          key: '3e8f7fd43f6e3337'
        },
        {
          name: 'Front Flood Lights',
          id: '7361528610521cc03143',
          key: '616ffacfd7edcadc'
        },
        {
          name: 'Living Room Light',
          id: '280118035002912538d7',
          key: 'ed472c4b09b50b97'
        },
        {
          name: 'Foyer Wall',
          id: '482150682cf432e1c9be',
          key: '5d2cb5173b8a3fcf'
        },
        {
          name: 'Pantry Lights',
          id: '05760644d8f15bd3f634',
          key: '65c1185796d4c326'
        },
        {
            name: 'South Beam Light1',
            id: '76650304d8bfc0f34c02',
            key: 'c6f5e60bbfdd9ccb'
        },
        {
            name: 'South Beam Light2',
            id: '15605104f4cfa2559566',
            key: '1610862c8a557191'
        },
        {
            name: 'South Beam Light3',
            id: '14716376bcddc274a7d1',
            key: 'fa6e43eca2857675'
        },
        {
            name: 'South Beam Light4',
            id: '76650304d8bfc0f353f4',
            key: 'fd6844f38cd71930'
        },
      ];

    //   [
        
    //     {
    //       name: 'Waffle4',
    //       id: '6067010898f4abf0b2c2',
    //       key: 'dba577c6229eaad1'
    //     },
    //     {
    //       name: 'Waffle2',
    //       id: '8145585798f4abe7ef5f',
    //       key: '79024e822d0ceeb5'
    //     },
    //     {
    //       name: 'Waffle1',
    //       id: '14716376bcddc2739624',
    //       key: '5cc8c571e869c455'
    //     },
    //     {
    //       name: 'Waffle3',
    //       id: '81455857a4cf12e41602',
    //       key: '3c1f2c67ced9a4f6'
    //     },
    //     {
    //       name: 'Kyler3',
    //       id: '72280710f4cfa255c45b',
    //       key: '966aef7dfc4746d8'
    //     },
    //     {
    //       name: 'Kyler2',
    //       id: '14716376c82b961befc7',
    //       key: '9b9cc3fa4e862b1d'
    //     },
    //     {
    //       name: 'Kyler4',
    //       id: '72280710f4cfa2587b59',
    //       key: 'e5db6ae729f43512'
    //     },
    //     {
    //       name: 'Kyler1',
    //       id: '14716376bcddc275199a',
    //       key: '31cf1867deab7ead'
    //     }
    //   ]
}

// function logItDude() {
//     console.log('Device List: ' + JSON.stringify(deviceList));
// }      
