﻿/*BEGIN---------------add to homescreen-------------------------------------------------*/
// Register the service worker if possible.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('A2HS_ServiceWorker.js').then(function (reg) {
        console.log('Successfully registered A2HS service worker', reg);
    }).catch(function (err) {
        console.warn('Error whilst registering A2HS service worker', err);
    });
}
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
//DebugButton = document.getElementById('TestDebug');

const GuiBSimple = document.getElementById('GUIButtonSimpleAccess');
const GuiButton = document.getElementById('GUIButtonFullAccess');
const TermButton = document.getElementById('TerminalButton');
const GUIContFA = document.getElementById('GUIContainerFullAccess');
const GUIContSA = document.getElementById('GUIContainerSimpleAccess');
const TermCont = document.getElementById('TerminalContainer');

let BLE = new Bluetooth_Send_Protobuf();

var bluetooth_device = null;
var ble_values;
var primaryService_Id = 0xFFE0;
var characterstics_Id = 0xFFE1;
// DebugButton.addEventListener('click', () => {
//     document.getElementById('debugText').value = "Hallo Click"
// });
 
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
    // BLEConnectB.innerHTML = 'Bluetooth Connect';
    // BLE.connect().
    //     then(() => {
    //         document.getElementById('IfConnected').hidden = false;
    //         BLEConnectB.hidden = true;
    //         BLENameLabel.innerHTML = BLE.getDeviceName() ? BLE.getDeviceName() : 'No Name';
    //         BLESendT.value = '';
    //         logToTerminal('Connected to : ' + BLENameLabel.innerHTML, 'info');
    //     })
    //     .catch(e => {
    //         console.log('Bluetooth ERROR : ' + e);
    //         BLEConnectB.innerHTML = e.toString();
    //         logToTerminal(e.toString(), 'err');
    //     });
    navigator.bluetooth.requestDevice({ filters: [{ services: [0xFFE0] }] })
    .then(device => { bluetooth_device = device;
        bluetooth_device.gatt.connect()
        .then(server => {
            console.log('Getting Battery Service...');
            return server.getPrimaryService(primaryService_Id);
          })
          .then(service => {
            console.log('Getting Battery Level Characteristic...');
            return service.getCharacteristic(characterstics_Id);
          })
            .then(characteristic => {
                ble_values = characteristic;
                characteristic.startNotifications()
                .then( () => {
                    characteristic.addEventListener('characteristicvaluechanged',
                        _bluetoothreceive);
                });
        });
    ;})
        
});

function _bluetoothreceive(data){
    console.log("recv");
    // var _receiveBuffer = event.target.value.buffer();
    var _receiveBuffer = [];//new ArrayBuffer(data.target.value.byteLength);
    for (var x = 0 ; x < data.target.value.byteLength; x++) {
		_receiveBuffer.push(data.target.value.getUint8());
	}
    // var sValue = new TextDecoder("utf-8").decode(_receiveBuffer);
    document.getElementById('debugText').value = _receiveBuffer;
}

// disconnect from device
BLEDisconnectB.addEventListener('click', () => {
    BLE.disconnect();
    document.getElementById('IfConnected').hidden = true;
    BLEConnectB.hidden = false;
    logToTerminal('Manual disconnect from : ' + BLENameLabel.innerHTML, 'info');
    BLENameLabel.innerHTML = '';
});

GuiButton.addEventListener('click', () => {
    GUIContFA.hidden = false;
    TermCont.hidden = true;
    GUIContSA.hidden = true;
    GuiButton.classList.remove("inactiveTab");
    GuiButton.classList.add("activeTab");
    GuiBSimple.classList.remove("activeTab");
    GuiBSimple.classList.add("inactiveTab");
    TermButton.classList.remove("activeTab");
    TermButton.classList.add("inactiveTab");
});

GuiBSimple.addEventListener('click', () => {
    GUIContFA.hidden = true;
    TermCont.hidden = true;
    GUIContSA.hidden = false;
    GuiButton.classList.remove("activeTab");
    GuiButton.classList.add("inactiveTab");
    GuiBSimple.classList.remove("inactiveTab");
    GuiBSimple.classList.add("activeTab");
    TermButton.classList.remove("activeTab");
    TermButton.classList.add("inactiveTab");
});

TermButton.addEventListener('click', () => {
    GUIContFA.hidden = true;
    TermCont.hidden = false;
    GUIContSA.hidden = true;
    GuiButton.classList.remove("activeTab");
    GuiButton.classList.add("inactiveTab");
    GuiBSimple.classList.remove("activeTab");
    GuiBSimple.classList.add("inactiveTab");
    TermButton.classList.remove("inactiveTab");
    TermButton.classList.add("activeTab");
});

PBMC.addEventListener('change', () => {
    for (var i = 0; i < (PBMC.length - 1); i++)document.getElementById(PBMC.options[i].text).hidden = true;
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
    //debugger;
    var a = new TextEncoder();
    var b = a.encode(BLESendT.value);
    BLE.send(b);
    BLESendT.value = '';
    BLESendT.focus();
});

// recive handler
BLE.receive = function (buffer) {
    document.getElementById('debugText').value = buffer.toString();
    try {
        if (GUIContFA.hidden == false || GUIContSA.hidden == false) { // If PB-Com is on 
            var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
            var Outermessage = MessageWrapper.decode(buffer);

            /////////////////////////////////////////////
            for (x = 0; x < GUIContFA.childElementCount; x++) {
                if (GUIContFA.children[x].nodeName == "FORM") {
                    if (Outermessage[GUIContFA.children[x].id]) {
                        var Innermessage = Outermessage[GUIContFA.children[x].id];
                        var text = "" + GUIContFA.children[x].id + "\n\n";

                        for (var key in Innermessage) {
                            if (key != "constructor" && key != "toJSON" && key != "$type") {
								text = text + key + " : " + Innermessage[key] + " ;\n";
							}
                        }

                        alert("Decoded protobuf: \n" + text);
                        break;
                    }
                }
            }
            //////////////////////////////////////////////

        } else if (document.getElementById('TerminalContainer').hidden == false) { // If Term is on
            var a = new TextDecoder("utf-8");
            var buf = new Uint8Array(buffer).buffer;
            var b = a.decode(buf);
            logToTerminal(BLENameLabel.innerHTML + " : " + b);
        }
    } catch{
        return false;
    }
    return true;
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
                payload[Formular[n].name] = Formular[n].valueAsNumber;
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

        var buffer = MessageWrapper.encode(omessage).finish();

        BLE.send(buffer);
    } catch (errMsg) {
        logToTerminal("ERROR in FormularPBFunction : " + errMsg);
    }
    return false;
}

function FormularSimpleRead(Formular) {
    try {
        var InnerMessage = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.SDO");
        var payload = new Array();
        payload['control'] = 0; 
        for (var n = 0; n < 3; n++) {
            payload[Formular[n].name] = Formular[n].valueAsNumber;
        }
        var errMsg = InnerMessage.verify(payload);

        var Outerpayload = [];
        Outerpayload["SDO"] = InnerMessage.create(payload);
        var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
        errMsg = MessageWrapper.verify(Outerpayload);

        var omessage = MessageWrapper.create(Outerpayload);
        errMsg = MessageWrapper.verify(omessage);
        var buffer = MessageWrapper.encode(omessage).finish();

        BLE.send(buffer);
    } catch (errMsg) {
        logToTerminal("ERROR in FormularSimpleRead : " + errMsg);
    }
    return false;
}

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