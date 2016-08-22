import tcp from "net"
if (!global.streams) {
    global.streams = require("../streams/streams.js")
}

const ONE_SECOND = 1000

const listener = tcp.createServer((c) => {
    let stream

    const info = {}

    let gotRequest = false
    let gotHeaders = false
    let startedPipe = false

    let connectionTimeout = setTimeout(endConnection, 10 * ONE_SECOND, c)

    c.on("data", (data) => {
        clearTimeout(connectionTimeout)
        connectionTimeout = setTimeout(endConnection, 10 * ONE_SECOND, c)

        const input = data.toString("utf-8").split("\r\n").join("\n");
        if (!gotRequest) {
            const request = input.split(" ")
            if (request[0] === "SOURCE" || request[0] === "PUT") {
                gotRequest = true
            } else {
                let requestArray = input.split("\n")
                let url = request[1]
                let updateStream
                for (let header of requestArray) {
                    if (header.toLowerCase().includes("authorization")) {
                        let authBuffer = new Buffer(header.split(":")[1].replace("Basic", "").trim(), "base64")
                        let authArray = authBuffer.toString().split(":")
                        delete authArray[0]
                        let password = authArray.join("")
                        if (!streams.streamPasswords.hasOwnProperty(password)) {
                            c.write("HTTP/1.1 401 You need to authenticate\n\n")
                            return c.end()
                        }
                        updateStream = streams.streamPasswords[password]
                    }
                }
                if (!updateStream) {
                    c.write("HTTP/1.1 401 You need to authenticate\n\n")
                    return c.end()
                }
                let getInfo = parseGet(url.replace("/admin/metadata?", ""))
                if (getInfo.mode === "updinfo") {
                    streams.setStreamMetadata(updateStream, {
                        song: getInfo.song || "", // do some encoders send more? (looks at Liquidsoap)
                        djname: getInfo.djname, // extended API
                    })
                }
                c.write(`HTTP/1.1 200 OK\nContent-Type: text/xml; charset=utf-8\n\n<?xml version="1.0"?>\n<iceresponse><message>Metadata update successful</message><return>1</return></iceresponse>`)
                return c.end()
            }
        }

        if (!gotHeaders) {
            let request = input.split("\n")
            let indexOfAuth
            let continueNeeded = false

            for (let id of request) {
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
            if (!indexOfAuth) {
                c.write("HTTP/1.1 401 You need to authenticate\n\n")
                return c.end()
            }
            let authBuffer = new Buffer(request[indexOfAuth].split(":")[1].replace("Basic", "").trim(), "base64")
            let authArray = authBuffer.toString().split(":")
            delete authArray[0]
            let password = authArray.join("")
            if (!streams.streamPasswords.hasOwnProperty(password)) {
                c.write("HTTP/1.1 401 You need to authenticate\n\n")
                return c.end()
            }
            stream = streams.streamPasswords[password]
            if (streams.isStreamInUse(stream)) {
                c.write("HTTP/1.1 403 Mountpoint in use\n\n")
                return c.end()
            }

            if (info.contentType !== "audio/mpeg" && info.contentType !== "audio/aacp") {
                c.write("HTTP/1.1 403 Content-type not supported\n")
                return c.end()
            }

            if (continueNeeded) {
                c.write("HTTP/1.1 100 Continue\n")
            }
            c.write("HTTP/1.1 200 OK\n\n")
            gotHeaders = true
        }

        if (gotRequest && gotHeaders && !startedPipe) {
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

const parseGet = (info) => {
    const output = {}
    const arrayOfKeyValue = info.split("&")
    for (let keyValue of arrayOfKeyValue) {
        let keyValueArray = keyValue.split("=")
        output[keyValueArray[0]] = decodeURIComponent(keyValueArray[1])
    }
    return output
}


export const listenOn = (port) => {
    listener.listen(port)
}

const endConnection = (c) => {
    c.end() // sends FIN
    c.destroy() // destroys socket as other side might be gone
}
