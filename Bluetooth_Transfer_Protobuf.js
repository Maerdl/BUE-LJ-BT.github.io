/**
 * Bluetooth Terminal class.
 */
class Bluetooth_Send_Protobuf {
  /**
   * Create preconfigured Bluetooth Terminal instance.
   * @param {!(number|string)} [serviceUuid=0xFFE0] - Service UUID
   * @param {!(number|string)} [characteristicUuid=0xFFE1] - Characteristic UUID
   * @param {string} [receiveSeparator='\n'] - Receive separator
   * @param {string} [sendSeparator='\n'] - Send separator
   */
  constructor(serviceUuid = 0xFFE0, characteristicUuid = 0xFFE1) {
    // Used private variables.
    this._receiveBuffer = ''; // Buffer containing not separated data.
    this._maxCharacteristicValueLength = 20; // Max characteristic value length.
    this._device = null; // Device object cache.
    this._characteristic = null; // Characteristic object cache.

    // Bound functions used to add and remove appropriate event handlers.
    this._boundHandleDisconnection = this._handleDisconnection.bind(this);
    this._boundHandleCharacteristicValueChanged =
    this._handleCharacteristicValueChanged.bind(this);

    // Configure with specified parameters.
    this.setServiceUuid(serviceUuid);
    this.setCharacteristicUuid(characteristicUuid);
  }

  /**
   * Set number or string representing service UUID used.
   * @param {!(number|string)} uuid - Service UUID
   */
  setServiceUuid(uuid) {
    if (!Number.isInteger(uuid) &&
        !(typeof uuid === 'string' || uuid instanceof String)) {
      throw new Error('UUID type is neither a number nor a string');
    }

    if (!uuid) {
      throw new Error('UUID cannot be a null');
    }

    this._serviceUuid = uuid;
  }

  /**
   * Set number or string representing characteristic UUID used.
   * @param {!(number|string)} uuid - Characteristic UUID
   */
  setCharacteristicUuid(uuid) {
    if (!Number.isInteger(uuid) &&
        !(typeof uuid === 'string' || uuid instanceof String)) {
      throw new Error('UUID type is neither a number nor a string');
    }

    if (!uuid) {
      throw new Error('UUID cannot be a null');
    }

    this._characteristicUuid = uuid;
  }

  /**
   * Launch Bluetooth device chooser and connect to the selected device.
   * @return {Promise} Promise which will be fulfilled when notifications will
   *                   be started or rejected if something went wrong
   */
  connect() {
    return this._connectToDevice(this._device);
  }

  /**
   * Disconnect from the connected device.
   */
  disconnect() {
    this._disconnectFromDevice(this._device);

    if (this._characteristic) {
      this._characteristic.removeEventListener('characteristicvaluechanged',
          this._boundHandleCharacteristicValueChanged);
      this._characteristic = null;
    }

    this._device = null;
  }

  /**
   * Data receiving handler which called whenever the new data comes from
   * the connected device, override it to handle incoming data.
   * @param {string} data - Data
   * @return {bool} true => Data complete reset buffer
   */
  receive(data) {
    // Handle incoming data.
  }
 
  /**
   * Send data to the connected device.
   * @param {} data - Data
   * @return {Promise} Promise which will be fulfilled when data will be sent or
   *                   rejected if something went wrong
  */
  send(Data) {
    // Return rejected promise immediately if Data is empty.
    if (!Data) {
      return Promise.reject('Data must be not empty');
    }

    // Return rejected promise immediately if there is no connected device.
    if (!this._characteristic) {
      return Promise.reject('There is no connected device');
    }
   
    
    let chunk = Data.slice(0, this._maxCharacteristicValueLength);
    let promise = this._writeToCharacteristic(this._characteristic,  chunk);

    for (let x = this._maxCharacteristicValueLength ; x < Data.size; x += this._maxCharacteristicValueLength) {
        chunk = Data.slice(x, (x + this._maxCharacteristicValueLength));

        promise = promise.then(() => new Promise((resolve, reject) => {
            // Reject promise if the device has been disconnected.
            if (!this._characteristic) {
                reject('Device has been disconnected');
            }

            // Write chunk to the characteristic and resolve the promise.
            this._writeToCharacteristic(this._characteristic, chunk).
                then(resolve).
                catch(reject);
        }));
      }

      return promise;
  }

  /**
   * Get the connected device name.
   * @return {string} Device name or empty string if not connected
   */
  getDeviceName() {
    if (!this._device) {
      return '';
    }

    return this._device.name;
  }

  /*
   * Connect to device.
   * @param {Object} device
   * @return {Promise}
   * @private
   */
  _connectToDevice(device) {
    return (device ? Promise.resolve(device) : this._requestBluetoothDevice()).
        then((device) => this._connectDeviceAndCacheCharacteristic(device)).
        then((characteristic) => this._startNotifications(characteristic)).
        catch((error) => {
          this._log(error);
          return Promise.reject(error);
        });
  }

  /*
   * Disconnect from device.
   * @param {Object} device
   * @private
   */
  _disconnectFromDevice(device) {
    if (!device) {
      return;
    }

    this._log('Disconnecting from "' + device.name + '" bluetooth device...');

    device.removeEventListener('gattserverdisconnected',
        this._boundHandleDisconnection);

    if (!device.gatt.connected) {
      this._log('"' + device.name +
          '" bluetooth device is already disconnected');
      return;
    }

    device.gatt.disconnect();

    this._log('"' + device.name + '" bluetooth device disconnected');
  }

  /*
   * Request bluetooth device.
   * @return {Promise}
   * @private
   */
  _requestBluetoothDevice() {
    this._log('Requesting bluetooth device...');

    return navigator.bluetooth.requestDevice({
      filters: [{services: [this._serviceUuid]}],
    }).
        then((device) => {
          this._log('"' + device.name + '" bluetooth device selected');

          this._device = device; // Remember device.
          this._device.addEventListener('gattserverdisconnected',
              this._boundHandleDisconnection);

          return this._device;
        });
  }

  /*
   * Connect device and cache characteristic.
   * @param {Object} device
   * @return {Promise}
   * @private
   */
  _connectDeviceAndCacheCharacteristic(device) {
    // Check remembered characteristic.
    if (device.gatt.connected && this._characteristic) {
      return Promise.resolve(this._characteristic);
    }

    this._log('Connecting to GATT server...');

    return device.gatt.connect().
        then((server) => {
          this._log('GATT server connected', 'Getting service...');

          return server.getPrimaryService(this._serviceUuid);
        }).
        then((service) => {
          this._log('Service found', 'Getting characteristic...');

          return service.getCharacteristic(this._characteristicUuid);
        }).
        then((characteristic) => {
          this._log('Characteristic found');

          this._characteristic = characteristic; // Remember characteristic.

          return this._characteristic;
        });
  }

  /*
   * Start notifications.
   * @param {Object} characteristic
   * @return {Promise}
   * @private
   */
  _startNotifications(characteristic) {
    this._log('Starting notifications...');

    return characteristic.startNotifications().
        then(() => {
          this._log('Notifications started');

          characteristic.addEventListener('characteristicvaluechanged',
              this._boundHandleCharacteristicValueChanged);
        });
  }

  /*
   * Stop notifications.
   * @param {Object} characteristic
   * @return {Promise}
   * @private
   */
  _stopNotifications(characteristic) {
    this._log('Stopping notifications...');

    return characteristic.stopNotifications().
        then(() => {
          this._log('Notifications stopped');

          characteristic.removeEventListener('characteristicvaluechanged',
              this._boundHandleCharacteristicValueChanged);
        });
  }

  /*
   * Handle disconnection.
   * @param {Object} event
   * @private
   */
  _handleDisconnection(event) {
    let device = event.target;

    this._log('"' + device.name +
        '" bluetooth device disconnected, trying to reconnect...');

    this._connectDeviceAndCacheCharacteristic(device).
        then((characteristic) => this._startNotifications(characteristic)).
        catch((error) => this._log(error));
  }

  /*
   * Handle characteristic value changed.
   * @param {Object} event
   * @private
   */
    _handleCharacteristicValueChanged(event) {

        var x = event.target.value.getInt8(0);
        debugger;
        this._receiveBuffer += event.target.value;
        if (this.receive(this._receiveBuffer) === true) {
            this._receiveBuffer = null;
        } else {

        }




        /*this._receiveBuffer += event.target.value;
        if ((new Date() - this._timestamp) < 1000) {
            try {
                //var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
                var decodedMsg = protobuf.parse(GetProto())
                                    .root.lookupType("CanOpenBridge.MessageWrapper")
                                    .decode(this._receiveBuffer);



                //MessageWrapper.verify(this._receiveBuffer);
                //this.receive_PB(this._receiveBuffer);
            }
            catch (err) {
                
            }
        } else {
            this.receive(this._receiveBuffer);
        }
        this._timestamp = new Date();*/

      
      /*
    for (let c of value) {
      if (c === this._receiveSeparator) {
        let data = this._receiveBuffer.trim();
        this._receiveBuffer = '';

        if (data) {
          this.receive(data);
        }
      } else {
        this._receiveBuffer += c;
      }
    }*/
  }

  /*
   * Write to characteristic.
   * @param {Object} characteristic
   * @param {string} data
   * @return {Promise}
   * @private
   */
  _writeToCharacteristic(characteristic, data) {
    return characteristic.writeValue(data);
  }

  /*
   * Log.
   * @param {Array} messages
   * @private
   */
  _log(...messages) {
    console.log(...messages); // eslint-disable-line no-console
  }
}

// Export class as a module to support requiring.
/* istanbul ignore next */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = BluetoothTerminal;
}

