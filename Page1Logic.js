/*BEGIN---------------add to homescreen-------------------------------------------------*/
// Register the service worker if possible.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('A2HS_ServiceWorker.js').then(function (reg) {
        console.log('Successfully registered A2HS service worker', reg);
    }).catch(function (err) {
        console.warn('Error whilst registering A2HS service worker', err);
    });
}
/*END-----------------add to homescreen-------------------------------------------------*/

var jsonstring = '{ "ValueType": "PersistentData",  "name" : "enDevice_BootCounter", "index": 8196, "subindex": 13, "value": 4 }';

var jsonObject = JSON.parse(jsonstring);

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = value;
    });
    return vars;
  }

/*BEGIN-----------------bluetooth-------------------------------------------------------*/
// Get the controll Elements
const BLEConnectB = document.getElementById('Connect');
const BLEDisconnectB = document.getElementById('Disconnect');
const debugText = document.getElementById('TextContainer');
const RequestPersistentDataButton = document.getElementById("requestPersistentData");

debugText.hidden = true;
BLEDisconnectB.hidden = true;
RequestPersistentDataButton.hidden = true;
var debug = getUrlVars()["debug"];
console.log("Debug has state: ".concat(debug))
if( debug === "true" ){
    debugText.hidden = false;
}

var persistentContent = document.getElementById("showPersistentContent");
var head = "<table><tr><th>Name</th><th>Index</th><th>Subindex</th><th>Value</th></tr>";
var footer = "</table>"
var content = "<tr><th>" + jsonObject.name + "</th>" + "<th>" + jsonObject.index + "</th>" + "<th>" + jsonObject.subindex + "</th>" + "<th>" + jsonObject.value + "</th>";

persistentContent.innerHTML = head + content + footer;

let BLE = new Bluetooth_Send_Protobuf();

var bluetooth_device = null;
var _characteristic = null
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

RequestPersistentDataButton.addEventListener('click', () => {
    _characteristic.writeValue( new TextEncoder().encode("#GetPersistentData#"));
    console.log("Send: #GetPersistentData#" );
})

// connect to device
BLEConnectB.addEventListener('click', () => {
    navigator.bluetooth.requestDevice({ filters: [{ services: [0xFFE0] }] })
    .then(device => { bluetooth_device = device;
        bluetooth_device.gatt.connect()
        .then(server => {
            BLEDisconnectB.hidden = false;
            RequestPersistentDataButton.hidden = false;
            BLEConnectB.hidden = true;
            console.log('Connected to BLE Dev');
            return server.getPrimaryService(primaryService_Id);
          })
          .then(service => {
            console.log('Getting Battery Level Characteristic...');
            return service.getCharacteristic(characterstics_Id);
          })
            .then(characteristic => {
                _characteristic = characteristic;
                characteristic.startNotifications()
                .then( () => {
                    characteristic.addEventListener('characteristicvaluechanged',
                        _bluetoothreceive);
            });
        });
    ;})
    // var ble = new BluetoothCommunication();
    // var dev = ble.connect();
        
});

function _bluetoothreceive(data){
    var dataarray = new Uint8Array(data.target.value.buffer);
    var sValue = new TextDecoder("utf-8").decode(dataarray);
    console.log("Received: ".concat(sValue))
    if( sValue.includes("Debug:")){
        var oldvalue = document.getElementById('debugText').value;
        oldvalue += sValue;
        document.getElementById('debugText').value = sValue;
    } else {
        JSON.parse(sValue);
    }
}

// disconnect from device
BLEDisconnectB.addEventListener('click', () => {
    console.log("disconnect ble device");
    bluetooth_device.gatt.disconnect();
    BLEDisconnectB.hidden = true;
    RequestPersistentDataButton.hidden = true;
    BLEConnectB.hidden = false;

});


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