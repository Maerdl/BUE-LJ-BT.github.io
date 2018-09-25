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
});


Instascan.Camera.getCameras().then((cam) => {
    if (cam.length > 0) {
        cameras = cam;
        camNr = cam.length - 1;         // ==> back camera (on smartphone)
        button.addEventListener('click', () => {
            if (container.hidden) {
                try {
                    container.hidden = false;
                    scanner.start(cameras[camNr]);
                } catch (err) {
                    console.log("Error in QR-Start: " + err);
                }
            } else {
                scanner.stop(cameras[camNr]);
                container.hidden = true;
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