/*BEGIN---------------add to homescreen-------------------------------------------------*/
//const A2HButton = document.getElementById('Add_to_Homescreen_Button');
// Register the service worker if possible.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('A2H_ServiceWorker.js').then(function (reg) {
        console.log('Successfully registered A2H service worker', reg);
    }).catch(function (err) {
        console.warn('Error whilst registering A2H service worker', err);
    });
}
/*
A2HButton.addEventListener('click', (e) => {
    A2HButton.hidden = true;
    deferredPrompt.prompt();
    deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
});*/
/*END-----------------add to homescreen-------------------------------------------------*/

/*BEGIN-----------------bluetooth-------------------------------------------------------*/
// Get the controll Elements
const BLEConnectB = document.getElementById('Connect');
const BLEDisconnectB = document.getElementById('Disconnect');
const BLESendT = document.getElementById('SendData');
const BLESendB = document.getElementById('SendButton');
const BLENameLabel = document.getElementById('DevName');
const BLETerminal = document.getElementById('Terminal');
const PBMC = document.getElementById('PBList');



const GuiButton = document.getElementById('GUIButton');
const TermButton = document.getElementById('TerminalButton');
let BLE = new BluetoothTerminal();

// Scroll the Terminal down
const scrollElement = (element) => {
    const scrollTop = element.scrollHeight - element.offsetHeight;
    if (scrollTop > 0) element.scrollTop = scrollTop;
};

// log data to terminal
const logToTerminal = (message, type = '') => {
    BLETerminal.insertAdjacentHTML('beforeend', `<div${type && ` class="${type}"`}>${message}</div>`);
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

GuiButton.addEventListener('click', () => {
    document.getElementById('GUIContainer').hidden = false;
    document.getElementById('TerminalContainer').hidden = true;
});

TermButton.addEventListener('click', () => {
    document.getElementById('GUIContainer').hidden = true;
    document.getElementById('TerminalContainer').hidden = false;
});

PBMC.addEventListener('change', () => {
    var i;
    for (i = 0; i < (PBMC.length - 1); i++)document.getElementById(PBMC.options[i].text).hidden = true;
    document.getElementById(PBMC.options[PBMC.selectedIndex].text).hidden = false;
});

// send data to device by pressing enter (Terminal)
BLESendT.addEventListener('keyup', e => {
    e.preventDefault();
    if (e.keyCode === 13) { //  13^=\n 
        BLESendB.click();
    }
});

// send data to device  (Terminal)
BLESendB.addEventListener('click', () => {
    logToTerminal(('OUT :&emsp;' + BLESendT.value), 'out');
    BLE.send(BLESendT.value);
    BLESendT.value = '';
    BLESendT.focus();

    /*
    var root = protobuf.parse(GetProto()).root;
    var AddNode = root.lookupType("CanOpenBridge.AddNode");

    // Exemplary payload
    var payload = {
        nodeId: 18,
        deviceStatus: 12
    };
    var errMsg = AddNode.verify(payload);
    if (errMsg)
        throw Error(errMsg);
    var message = AddNode.create(payload);
    var buffer = AddNode.encode(message).finish();


    // Decode Again (For Test)
    var message2 = AddNode.decode(buffer);





    logToTerminal(('Buffer :&emsp;' + buffer), 'out');
    //BLE.send(buffer);
    BLE.sendByte(buffer);
    logToTerminal(JSON.stringify(message2), 'out');
    BLESendT.value = '';*/
});

// recive handler (Terminal)
BLE.receive = function (data) {
    if (document.getElementById('GUIContainer').hidden == false) {
        var x = 0;
        var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
        var buffer = data.split(',');
        try {
            var Outermessage = MessageWrapper.decode(buffer);
        } catch{
            alert("Incoming message can't be decoded");
            throw Error("Incoming message can't be decoded");
        }
        var GUICont = document.getElementById('GUIContainer');
        for (x = 0; x < GUICont.childElementCount; x++) {
            if (GUICont.children[x].nodeName == "FORM") {
                if (Outermessage[GUICont.children[x].id]) {
                    var Innermessage = Outermessage[GUICont.children[x].id];
                    var text = "" + Innermessage.name + "\n\n";

                    for (var key in Innermessage) {
                        if (key != "constructor" && key != "toJSON" && key != "$type") text = text + key + " : " + Innermessage[key] + " ;\n";
                    }

                    alert("Decoded protobuf: \n" + text);
                    break;
                }
            }
        }
    } else if (document.getElementById('TerminalContainer').hidden == false) {
        logToTerminal(BLENameLabel.innerHTML + ' :&emsp;' + data, 'in');
        var buffer = data.split(',');

        var root = protobuf.parse(GetProto()).root;
        var AddNode = root.lookupType("CanOpenBridge.AddNode");

        try {
            var message2 = AddNode.decode(buffer);
            logToTerminal(BLENameLabel.innerHTML + 'Protobuf Decoded');
        } catch{
            logToTerminal(BLENameLabel.innerHTML + 'No Valid Protobuf');
            console.log('Not a valide protobuf message');
        }
    }
};

/*END-----------------Bluetooth-------------------------------------------------------*/

function FormularPBFunction(Formular) {
    try {
        var PBTitle = '' + Formular.id;
        var InnerMessage = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge." + PBTitle);
        var n = 0;
        var payload = [];

        for (n = 0; n < Formular.length; n++) {
            if (Formular[n].value == null || Formular[n].value == "") {
                // Do nothing
            } else if (Formular[n].type == "number") {
                payload[Formular[n].name] = Formular[n].valueAsNumber
            } else if (Formular[n].type == "text") {
                payload[Formular[n].name] = Formular[n].value;
            } else if (Formular[n].type == "select-one") {
                payload[Formular[n].name] = parseInt(Formular[n].value);
            } else if (Formular[n].type == "checkbox") {
                if (Formular[n].value == 'on') payload[Formular[n].name] = true;
                else payload[Formular[n].name] = false;
            }
        }

        var errMsg = InnerMessage.verify(payload);

        var Outerpayload = [];
        Outerpayload[PBTitle] = InnerMessage.create(payload);

        var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
        errMsg = MessageWrapper.verify(Outerpayload);

        var omessage = MessageWrapper.create(Outerpayload);
        var Er = MessageWrapper.verify(omessage);
        var buffer = MessageWrapper.encode(omessage).finish();
        //alert("buffer" + buffer);        
        //debugger;
        BLE.send(buffer);
    } catch (errMsg) {
        //alert("ERROR/n" + errMsg);
        debugger;
    }
    return false;
}

/*
function unpack(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        //bytes.push(char >>> 8);
        bytes.push(char & 0xFF);
    }
    /*for (var i = 0; i < str.length; i += 2) {
        var char1 = str.charCodeAt(i);
        var char2 = str.charCodeAt(i + 1);
        var val1 = (char1 > 47 && char1 < 58) * (char1 - 48) + (char1 > 96 && char1 < 103) * (char1 - 87);
        var val2 = (char2 > 47 && char2 < 58) * (char2 - 48) + (char2 > 96 && char2 < 103) * (char2 - 87);
        bytes.push(val1 * 16 + val2);
    }+/
    return bytes;
}*/

// file wont be installd to homescreen but function does
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