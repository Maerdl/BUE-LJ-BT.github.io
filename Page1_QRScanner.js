const QREnableButton = document.getElementById('qr-Button');
const QRAll = document.getElementById('qr-Container');


import QrScanner from "./qr-scanner.min.js";

const video = document.getElementById('qr-video');
const camQrResult = document.getElementById('cam-qr-result');

function setResult(label, result) {
    label.textContent = result;
    label.style.color = 'teal';
    clearTimeout(label.highlightTimeout);
    label.highlightTimeout = setTimeout(() => label.style.color = 'inherit', 100);
}


// ####### Web Cam Scanning #######

const scanner = new QrScanner(video, result => setResult(camQrResult, result));
scanner.start();