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
        nodeId: 18,
        pdoNumber: 12,
        data: "Dataset",
        timestamp: 958753
    };
      

        var errMsg = InnerMessage.verify(payload);

        var Outerpayload = [];
        Outerpayload[PBTitle] = InnerMessage.create(payload);

        var MessageWrapper = protobuf.parse(GetProto()).root.lookupType("CanOpenBridge.MessageWrapper");
        errMsg = MessageWrapper.verify(Outerpayload);

        var omessage = MessageWrapper.create(Outerpayload);
        //errMsg = MessageWrapper.verify(omessage);
        var buffer = MessageWrapper.encode(omessage).finish();
        //alert("buffer" + buffer);        
        //debugger;
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
