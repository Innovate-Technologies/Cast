let rest = require("restler");
let directories = config.directories.Icecast;
let dirInfo = {}; // { stream: { dirurl: info } }

let sendRequest = (host, data, callback) => {
    rest.post(host, {
        headers: {
            "User-Agent": "Icecast 2.4.1", // Lie about your identity to let you in
        },
        timeout: 10000,
        data: data,
    }).on("complete", (body, response) => {
        if (response === null) {
            return callback(new Error("Got an invalid response"));
        }
        callback(null, response.headers);
    }).on("timeout", () => {
        callback(new Error("Request timed out"));
    });
};

let addToDir = (stream) => {
    let info = streams.getStreamConf(stream);
    let hostname;

    if (config.hostname.split(":").length === 3) { // if a non standard port is used
        hostname = config.hostname;
    } else {
        hostname = config.hostname + ":" + ((config.hostname.indexOf("https://") !== -1) ? 443 : 80);
    }

    var sendRequestToDirectory = (directory) => {
        sendRequest(directory, {
            action: "add",
            sn: info.name,
            type: info.type,
            genre: info.genre,
            b: info.bitrate.toString(), // This is serious, see https://wiki.xiph.org/Icecast_Server/YP-protocol-v2
            listenurl: hostname + "/streams/" + stream,
            url: info.url,
        }, function (err, res) {
            if (err) {
                return;
            }
            if (res.ypresponse === "1") {
                if (typeof dirInfo[stream] === "undefined") {
                    dirInfo[stream] = {};
                }
                var touchfreq = parseInt(res.touchfreq, 10);
                if (isNaN(touchfreq)) {
                    return;
                }
                dirInfo[stream][directory] = {
                    sid: res.sid,
                    TouchFreq: touchfreq,
                };
                touchDir(stream, directory);
                setInterval(function () {
                    touchDir(stream, directory);
                }, touchfreq * 1000);
            }
        });
    };

    directories.forEach(sendRequestToDirectory)
};

let touchDir = (stream, dir) => {
    if (!dirInfo[stream] || !dirInfo[stream][dir]) {
        return;
    }

    sendRequest(dir, {
        action: "touch",
        sid: dirInfo[stream][dir].sid,
        st: streams.getStreamMetadata(stream).song || "",
        listeners: streams.numberOfListerners(stream),
    }, (err) => {
        if (err) {
            return console.error(err);
        }
    });
};

let touchDirForStream = (stream) => {
    if (!dirInfo[stream]) {
        return;
    }
    for (let directory of dirInfo[stream]) {
        touchDir(stream, directory);
    }
};

var removeFromDir = (stream) => {
    if (!dirInfo[stream]) {
        return;
    }

    for (var dir in dirInfo[stream]) {
        if (dirInfo[stream].hasOwnProperty(dir)) {
            sendRequest(dir, {
                action: "remove",
                sid: dirInfo[stream][dir].sid,
            }, function () {});
        }
    }
};

events.on("addStream", addToDir);
events.on("removeStream", removeFromDir);
events.on("metadata", touchDirForStream);
events.on("listenerTunedIn", touchDirForStream);
events.on("listenerTunedOut", touchDirForStream);
