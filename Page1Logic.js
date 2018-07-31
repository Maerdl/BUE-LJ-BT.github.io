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
const BLEDisconnectB= document.getElementById('Disconnect'); 
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
    BLE.connect().
        then(() => {
            document.getElementById('IfConnected').hidden = false;
            BLEConnectB.hidden = true;
            BLENameLabel.innerHTML = BLE.getDeviceName() ? BLE.getDeviceName() : 'No Name';
            BLESendT.value = '';
        })
        .catch(e => {
            console.log('Bluetooth ERROR : ' + e);
            BLEConnectB.innerHTML = e.toString();
        });
});

// disconnect from device
BLEDisconnectB.addEventListener('click', () => {
    BLE.disconnect();
    document.getElementById('IfConnected').hidden = true;
    BLEConnectB.hidden = false;
    BLENameLabel.innerHTML = '';
});

// send data to device
BLESendB.addEventListener('click', () => {
    logToTerminal(('OUT :&emsp;' + BLESendT.value), 'out');
    BLE.send(BLESendT.value);
    BLESendT.value = '';
    BLESendT.focus();
}); 

// recive handler
BLE.receive = function (data) {
    logToTerminal(BLENameLabel.innerHTML + ' :&emsp;' + data, 'in');
};

/*END-----------------Bluetooth-------------------------------------------------------*/