import tcp from "net"
if (!streams) {
    global.streams = require("../streams/streams.js")
}

const listener = tcp.createServer((c) => {
    let verifiedPasword = false;
    let gotICY = true; // set true to not parse the info if the encoder refuses to wait on our response
    let icy = {}
    let startedPipe = true; // set true to not parse the info if the encoder refuses to wait on our response
    let stream;
    c.on("data", (data) => {
        if (!verifiedPasword) {
            verifiedPasword = true
            let input = data.toString("utf-8").replace("\r\n", "\n").split("\n");
            if (!streams.streamPasswords.hasOwnProperty(input[0])) {
                c.write("invalid password\n")
                c.end()
                return
            }
            stream = streams.streamPasswords[input[0]]
            if (streams.isStreamInUse(stream)) {
                c.write("Other source is connected\n")
                c.end()
                return
            }
            c.write("OK2\r\nicy-caps:11\n\n");

            if (input.length > 1) {
                icy = parseICY(input)
                if (typeof icy["icy-name"] === "undefined") {
                    gotICY = false
                }
            } else {
                gotICY = false
            }

            startedPipe = false

        } else if (!gotICY) {
            if (!icy["icy-name"]) {
                let input = data.toString("utf-8").replace("\r\n", "\n").split("\n")
                icy = parseICY(input)
                if (!icy["icy-name"]) {
                    return c.end()
                }
            }
            gotICY = true
        } else if (!startedPipe) {
            if (!icy["content-type"] || icy["content-type"].split("/").length <= 1) {
                // if your encoder is this shitty (Nicecast) it probably uses mpeg
                icy["content-type"] = "audio/mpeg"
            }
            streams.addStream(c, {
                name: icy["icy-name"],
                stream: stream,
                type: icy["content-type"],
                bitrate: icy["icy-br"] || 0,
                url: icy["icy-url"],
                genre: icy["icy-genre"],
                directoryListed: icy["icy-pub"] === 1,
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

let parseICY = (input) => {
    var out = {}
    for (let line of input) {
        let info = line.split(":")
        out[info[0]] = info.slice(1, info.length).join("").replace("\r", "")
    }
    return out
}
