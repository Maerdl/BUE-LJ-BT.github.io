class BluetoothCommunication {
    constructor() {
        this.primaryService_Id = 0xFFE0;
        this.characterstics_Id = 0xFFE1;
        this._device = this.getDevice();
    }

    getDevice(){
        return navigator.bluetooth.requestDevice({ filters: [{ services: [0xFFE0] }] })
        .then(device => { this._device = device; });
    }

    connect(){
        this._device.gatt.connect();
    }

    value() {
        return this._device.getPrimaryService(primaryService_Id).getCharacteristic(characterstics_Id).readValue();
    }
}