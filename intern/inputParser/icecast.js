import tcp from "net"
if (!global.streams) {
    global.streams = require("../streams/streams.js")
}

const listener = tcp.createServer((c) => {
    let stream

    let info = {}

    let gotRequest = false
    let gotHeaders = false
    let startedPipe = false

    c.on("data", (data) => {
        let input = data.toString("utf-8").split("\r\n").join("\n");
        if (!gotRequest) {
            let request = input.split(" ")
            if (request[0] === "SOURCE" || request[0] === "PUT") {
                gotRequest = true
                stream = request[1].replace("/live/", "").replace("/", "")
            } else {
                // handle metadata
            }
        }

        if (!gotHeaders) {
            let request = input.split("\n")
            let indexOfAuth
            let continueNeeded = false

            console.log(request);

            for (let id in request) {
                if (request.hasOwnProperty(id)) {
                    if (request[id].toLowerCase().indexOf("authorization") > -1) {
                        indexOfAuth = id
                    }
                    if (request[id].toLowerCase().indexOf("100-continue") > -1) {
                        continueNeeded = true
                    }
                    if (request[id].indexOf("ice-name") > -1) {
                        info.name = request[id].replace("ice-name:", "").trim()
                    }
                    if (request[id].indexOf("ice-bitrate") > -1) {
                        info.bitrate = request[id].replace("ice-bitrate:", "").trim()
                    }
                    if (request[id].indexOf("ice-genre") > -1) {
                        info.genre = request[id].replace("ice-genre:", "").trim()
                    }
                    if (request[id].indexOf("ice-url") > -1) {
                        info.url = request[id].replace("ice-url:", "").trim()
                    }
                    if (request[id].indexOf("ice-description") > -1) {
                        info.description = request[id].replace("ice-description:", "").trim()
                    }
                    if (request[id].indexOf("Content-Type") > -1) {
                        info.contentType = request[id].replace("Content-Type:", "").trim()
                    }
                }
            }
            console.log(info);
            if (!indexOfAuth) {
                c.write("HTTP/1.1 401 You need to authenticate\n")
                return c.end()
            }
            let authBuffer = new Buffer(request[indexOfAuth].split(":")[1].replace("Basic", "").trim(), "base64")
            let authArray = authBuffer.toString().split(":")
            delete authArray[0]
            let password = authArray.join("")
            if (!streams.streamPasswords.hasOwnProperty(password)) {
                c.write("HTTP/1.1 401 You need to authenticate\n")
                return c.end()
            }
            stream = streams.streamPasswords[password]
            if (streams.isStreamInUse(stream)) {
                c.write("HTTP/1.1 403 Mountpoint in use\n")
                return c.end()
            }

            if (info.contentType !== "audio/mpeg" && info.contentType !== "audio/aacp") {
                c.write("HTTP/1.1 403 Content-type not supported\n")
                return c.end()
            }

            if (continueNeeded) {
                c.write("HTTP/1.1 100 Continue\n")
            }
            c.write("HTTP/1.1 200 OK\n")
            gotHeaders = true
        }

        if (gotRequest && gotHeaders && !startedPipe) {
            console.log("PIPEEEE");
            console.log(info);
            console.log(stream);
            streams.addStream(c, {
                name: info.name,
                stream: stream,
                type: info.contentType,
                bitrate: info.bitrate || 0,
                url: info.url,
                genre: info.genre,
            })
            startedPipe = true
        }
    })

    c.on("end", () => {
        streams.removeStream(stream)
    })

    c.on("error", () => {
        streams.removeStream(stream)
    })

})

module.exports.listenOn = (port) => {
    listener.listen(port)
}
