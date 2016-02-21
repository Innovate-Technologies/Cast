/* global io */

var socket = io();
socket.on("metadata", function onMetadataUpdate(msg) {
    var metadataElement = document.getElementById("meta-" + msg.stream);
    if (metadataElement !== null) {
        metadataElement.textContent = decodeURIComponent(msg.song);
    }
    var djnameElement = document.getElementById("djname-" + msg.stream);
    if (msg.djname && djnameElement !== null) {
        djnameElement.textContent = decodeURIComponent(msg.djname);
    }
});

socket.on("listenerCountChange", function onListenerCountChange (msg) {
    var countElement = document.getElementById("listencount-" + msg.stream);
    if (countElement !== null) {
        if (msg.count === 1) {
            countElement.textContent = "1 person is listening right now.";
        } else {
            countElement.textContent = msg.count + " people are listening right now.";
        }
    }
});
