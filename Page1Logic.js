/*BEGIN---------------add to homescreen-------------------------------------------------*/
// Register the service worker if possible.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('A2H_ServiceWorker.js').then(function (reg) {
        console.log('Successfully registered A2H service worker', reg);
    }).catch(function (err) {
        console.warn('Error whilst registering A2H service worker', err);
    });
}
/*END-----------------add to homescreen-------------------------------------------------*/

/*BEGIN-----------------bluetooth-------------------------------------------------------*/
// Get the controll Elements
const BLEConnectB   = document.getElementById('Connect');
const BLEDisconnectB = document.getElementById('Disconnect');
const BLESendT      = document.getElementById('SendData');
const BLESendB      = document.getElementById('SendButton');
const BLENameLabel  = document.getElementById('DevName');
const BLETerminal   = document.getElementById('Terminal');

let BLE = new BluetoothTerminal();

// Scroll the Terminal down
const scrollElement = (element) => {
    const scrollTop = element.scrollHeight - element.offsetHeight;
    if (scrollTop > 0) element.scrollTop = scrollTop;
};

// log data to terminal
const logToTerminal = (message, type = '') => {
    BLETerminal.insertAdjacentHTML('beforeend',`<div${type && ` class="${type}"`}>${message}</div>`);
    scrollElement(BLETerminal);
};

// connect to device
BLEConnectB.addEventListener('click', () => {
    BLEConnectB.innerHTML = 'Connect';
    BLE.connect().
        then(() => {
            document.getElementById('IfConnected').hidden = false;
            BLEConnectB.hidden = true;
            BLENameLabel.innerHTML = BLE.getDeviceName() ? BLE.getDeviceName() : 'No Name';
            BLESendT.value = '';
            logToTerminal('Connected to : ' + BLENameLabel.innerHTML, 'info');
        })
        .catch(e => {
            console.log('Bluetooth ERROR : ' + e);
            BLEConnectB.innerHTML = e.toString();
            logToTerminal(e.toString(), 'err');
        });
});

// disconnect from device
BLEDisconnectB.addEventListener('click', () => {
    BLE.disconnect();
    document.getElementById('IfConnected').hidden = true;
    BLEConnectB.hidden = false;
    logToTerminal('Manual disconnect from : ' + BLENameLabel.innerHTML, 'info');
    BLENameLabel.innerHTML = '';
});

// send data to device by pressing enter
BLESendT.addEventListener('keyup', e => {
    e.preventDefault();
    if (e.keyCode === 13) { //  13^=\n 
        BLESendB.click();
    }
});

// send data to device
BLESendB.addEventListener('click', () => {
    logToTerminal(('OUT :&emsp;' + BLESendT.value), 'out');
    BLE.send(BLESendT.value);
    BLESendT.value = '';
    //    BLESendT.focus();



    var proto = GetProto();
    var root = protobuf.parse(proto).root;

    // Obtain a message type
    var AddNode = root.lookupType("CanOpenBridge.AddNode");

    // Exemplary payload
    var payload = {
        nodeId: 18,
        deviceStatus: 12
    };

    // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
    var errMsg = AddNode.verify(payload);
    if (errMsg)
        throw Error(errMsg);

    // Create a new message
    var message = AddNode.create(payload); // or use .fromObject if conversion is necessary

    // Encode a message to an Uint8Array (browser) or Buffer (node)
    var buffer = AddNode.encode(message).finish();
    // ... do something with buffer

    // Decode an Uint8Array (browser) or Buffer (node) to a message
    var message2 = AddNode.decode(buffer);
    // ... do something with message

    // If the application uses length-delimited buffers, there is also encodeDelimited and decodeDelimited.

    // Maybe convert the message back to a plain object
    /*var object = PDO.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        // see ConversionOptions
    });*/




    logToTerminal(('Buffer :&emsp;' + buffer), 'out');
    BLE.send(buffer);
    BLE.sendByte(buffer);
    BLESendT.value = '';
});

// recive handler
BLE.receive = function (data) {
    logToTerminal(BLENameLabel.innerHTML + ' :&emsp;' + data, 'in');
    var buffer = data.split(',');

    var root = protobuf.parse(proto).root;
    var AddNode = root.lookupType("CanOpenBridge.AddNode");

    var message2 = AddNode.decode(buffer);
    logToTerminal(BLENameLabel.innerHTML + ' decode :&emsp;' + message2, 'in');
};


// file wont be installd to homescreen but variable does
function GetProto() {
    return `
        // See README.txt for information and build instructions.

        package CanOpenBridge;

        //option java_package = "com.burkert.cop";
        //option java_outer_classname = "CanOpenBridge";

        // put an optional field here for every new classtype
        message MessageWrapper {
          optional SDO SDO = 1;
          optional PDO PDO = 2;
          optional Event Event = 3;
          optional AddNode AddNode = 4;
          optional RemoveNode RemoveNode = 5;
          optional Commands Commands = 6;
          optional SYNC SYNC = 7;
          optional SdoProgress SdoProgress = 8;
          optional Request Request = 9;
          optional RequestProgress RequestProgress = 10;
          optional RawData RawData = 11;
          optional CanMeasure CanMeasure = 12;
        }

        message SDO {
          required int32 nodeId = 1;
          required int32 index = 2;
          required int32 subIndex = 3;
          enum Control {
            READ = 0;
            WRITE = 1;
	        RESPONSE = 2;
	        ABORT = 3;
	        READ_BLOCK = 4;
	        WRITE_BLOCK = 5;
          }
          required Control control = 4;
          optional bytes data = 5;
          optional int32 totalBlockLen = 6;
          optional uint64 timestamp = 7;
        }

        message PDO {
          required int32 nodeId = 6;
          required int32 pdoNumber = 7;
          required bytes data = 8;
          required uint64 timestamp = 9;
        }

        message Event {
          required int32 nodeId = 10;
          required bytes data = 11;
          required uint64 timestamp = 12;
          enum EventType {
            EMERGENCY = 0;
            BDO = 1;	
            SERVERINFO = 2;
	        SERVERERROR = 3;
	        NMT = 4;
          }
          required EventType eventType = 16;
        }

        message AddNode {
          required int32 nodeId = 13;
          optional int32 deviceStatus = 14;
        }

        message RemoveNode {
          required int32 nodeId = 14;
        }

        message Commands {
          enum Command {
            SHUTDOWN = 0;
            RESTART_SOCKET = 1;
          }
          required Command command = 15;
        }

        message SYNC {
          required uint32 flags = 17;
        }

        message SdoProgress {
          required int32 nodeId = 1;
          required int32 index = 2;
          required int32 subIndex = 3;
          required int32 value = 4;
        }

        message Request {
	        enum RequestType {
		        Complete = 0;
		        SearchCANopenDevices = 1;
		        GetLSS_Slave = 2;
		        CnfLSS_Slave = 3;
		        CanRawData = 4;
		        CanMeasure = 5;
	        }
	        required RequestType requestType = 1;
	        optional int32 nodeID = 2;
	        optional int32 baudrate = 3;
	        optional int32 result = 4;
	        optional int32 vendorID = 5;
	        optional int32 productCode = 6;
	        optional int32 revisionNumber = 7;
	        optional int32 serialNumber = 8;
	        optional int32 rawDataActive = 9;
	        optional int32 canMeasureActive = 10;
        }

        message RequestProgress {
	        required int32 value = 1;
        }
        message RawData {
          required uint32 cobId = 1;
          required bytes data = 2;
          required uint64 timeStamp = 3;
          required bool direction = 4; 
        }

        message CanMeasure{
        required int32 errorFlags = 1;
        required int32 canHRise = 2;
        required int32 canHFall = 3;
        required int32 canLRise = 4;
        required int32 canLFall = 5;
        }
		`;
}
/*END-----------------Bluetooth-------------------------------------------------------*/