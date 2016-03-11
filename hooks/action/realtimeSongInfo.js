events.on("metadata", (meta) => {
    io.emit("metadata", meta);
});

events.on("listenerTunedIn", (list) => {
    setTimeout(() => {
        io.emit("listenerCountChange", {
            stream: list.stream,
            count: streams.numberOfListerners(list.stream),
        });
    }, 100);
});

events.on("listenerTunedOut", (list) => {
    setTimeout(() => {
        io.emit("listenerCountChange", {
            stream: list.stream,
            count: streams.numberOfListerners(list.stream),
        });
    }, 100);
});
