const button = document.getElementById('qr-Button');
const container = document.getElementById('qr-Container');
const video = document.getElementById('qr-video');
const result = document.getElementById('qr-result');
const camchan = document.getElementById('qr-cam-change');

let scanner = new Instascan.Scanner({ video: video });
let cameras;
var camNr = 0;

function scan(content) {
    result.textContent = content;
}


Instascan.Camera.getCameras().then((cam) => {
    if (cam.length > 0) {
        cameras = cam;
        button.addEventListener('click', () => {
            if (container.hidden) {
                try {
                    container.hidden = false;
                    scanner.addEventListener('scan', scan(content));
                    scanner.start(cameras[camNr]);
                } catch (err) {
                    console.log("Error in QR-Start: " + err);
                }
            } else {
                scanner.stop(cameras[camNr]);
                container.hidden = true;
            }
        });
        if (cameras.length > 1) {
            camchan.hidden = false;
            camchan.addEventListener('click', () => {
                scanner.stop(cameras[camNr]).then(() => {
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