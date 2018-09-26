const button = document.getElementById('qr-Button');
const container = document.getElementById('qr-Container');
const video = document.getElementById('qr-video');
const Ergebnis = document.getElementById('qr-result');
const camchan = document.getElementById('qr-cam-change');

let scanner = new Instascan.Scanner({ video: video, mirror: false});
let cameras;
var camNr = 0;

// Handels Action if QR-Code is scanned
scanner.addListener('scan', function (content) {
    console.log("QR-Scan: " + content);
    Ergebnis.innerHTML = content;
    alert("Scanned OR-Code: \n" + content);
});


Instascan.Camera.getCameras().then((cam) => {
    if (true) {
        cameras = cam;
        camNr = cam.length - 1;         // ==> back camera (on smartphone)
        button.addEventListener('click', () => {
            
            var PBTitle = 'PDO';
        var InnerMessage = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge." + PBTitle);
        var n = 0;
            // Exemplary payload
    var payload = {
        nodeId: 357,
        pdoNumber: 15,
        data: '357159456852',
        timestamp: 10
    };
      

        var errMsg = InnerMessage.verify(payload);

        var Outerpayload = [];
        Outerpayload[PBTitle] = InnerMessage.create(payload);

        var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
        errMsg = MessageWrapper.verify(Outerpayload);

        var omessage = MessageWrapper.create(Outerpayload);
        //errMsg = MessageWrapper.verify(omessage);
        var buffer = MessageWrapper.encode(omessage).finish();
        alert("buffer : " + buffer);  
        /*
        var buffer = [];
        for(var x = 0; x < buf.length - 2; x++)buffer[x] = buf[x];     
        alert("buffer : "+ buffer) ;*/
        //debugger;
        var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
        var Outermessage = MessageWrapper.decode(buffer);
        BLE.receive(buffer);
            
            if (container.hidden) {
                try {
                    container.hidden = false;
                    button.innerHTML = "Close camera";
                    scanner.start(cameras[camNr]);
                } catch (err) {
                    console.log("Error in QR-Start: " + err);
                }
            } else {
                scanner.stop(cameras[camNr]);
                container.hidden = true;
                button.innerHTML = "Use QR Scanner";
            }
        });
        if (cam.length > 1) {
            camchan.hidden = false;
            camchan.addEventListener('click', () => {
                scanner.stop().then(() => {
                    camNr++;
                    if (camNr >= cameras.length) camNr = 0;
                    scanner.start(cameras[camNr]);
                });
            });
        }
    } else {
        button.innerHTML = 'No Camera found.';
    }
}).catch(function (e) {
    console.log("Error in getCameras: "+e);
});
