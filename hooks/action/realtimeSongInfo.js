global.events.on("metadata", (meta) => {
    global.io.emit("metadata", meta);
});

global.events.on("listenerTunedIn", (list) => {
    setTimeout(() => {
        global.io.emit("listenerCountChange", {
            stream: list.stream,
            count: global.streams.numberOfListerners(list.stream),
        });
    }, 100);
});

global.events.on("listenerTunedOut", (list) => {
    setTimeout(() => {
        global.io.emit("listenerCountChange", {
            stream: list.stream,
            count: global.streams.numberOfListerners(list.stream),
        });
    }, 100);
});
