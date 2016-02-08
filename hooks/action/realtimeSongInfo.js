global.hooks.add("metadata", (meta) => {
    global.io.emit("metadata", meta);
});

global.hooks.add("listenerTunedIn", (list) => {
    setTimeout(() => {
        global.io.emit("listenerCountChange", {
            stream: list.stream,
            count: global.streams.numberOfListerners(list.stream),
        });
    }, 100);
});

global.hooks.add("listenerTunedOut", (list) => {
    setTimeout(() => {
        global.io.emit("listenerCountChange", {
            stream: list.stream,
            count: global.streams.numberOfListerners(list.stream),
        });
    }, 100);
});
