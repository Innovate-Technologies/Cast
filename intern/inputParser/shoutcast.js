var tcp = require("net")
if (typeof global.streams === "undefined") {
    global.streams = require("../streams/streams.js")
}

var listener = tcp.createServer(function(c) {
    var veriefiedPassword = false;
    var gotICY = true; //set true to not parse the info if the encoder refuses to wait on our response
    var icy = {}
    var startedPipe = true; //set true to not parse the info if the encoder refuses to wait on our response
    var stream;
    c.on('data', function(data) {
        if (!veriefiedPassword) {
            veriefiedPassword = true
            var input = data.toString('utf-8').replace("\r\n", "\n").split("\n");
            if (!global.streams.streamPasswords.hasOwnProperty(input[0])) {
                c.write("invalid password\n")
                c.end()
                return
            }
            stream = global.streams.streamPasswords[input[0]]
            if (global.streams.isStreamInUse(stream)) {
                c.write("Other source is connected\n")
                c.end()
                return
            }
            c.write("OK2\r\nicy-caps:11\r\n\r\n");
            
            if (input.length > 1) {
                icy = parseICY(input)
                if (typeof icy['icy-name'] === "undefined") {
                    gotICY = false
                }
            } else {
                gotICY = false
            }
            
            startedPipe = false

        } else if (!gotICY) {
            if (typeof icy['icy-name']==="undefined") {
                var input = data.toString('utf-8').replace("\r\n", "\n").split("\n");
                icy = parseICY(input)
                if (typeof icy['icy-name']==="undefined") {
                    c.end()
                    return;
                }
            }
            gotICY = true
        } else if (!startedPipe) {
            if (typeof icy["content-type"] === "undefined" || icy["content-type"].split("/").length <= 1) {
                //if your encoder is this shitty (Nicecast) it probably uses mpeg
                icy["content-type"] = "audio/mpeg"
            }
            global.streams.addStream(c, {
                name: icy["icy-name"],
                stream: stream,
                type: icy["content-type"],
                bitrate: icy["icy-br"] || 0,
                url: icy["icy-url"], //needs patch
                genre: icy["icy-genre"],
                directoryListed: icy["icy-pub"] === 1
            })
            startedPipe = true
        }

    })

    c.on('end', function() {
        global.streams.removeStream(stream)
    });
    
    c.on('error', function() {
        global.streams.removeStream(stream)
    });
    
});

var listenOn = function(port) {
    listener.listen(port)
}

var parseICY = function(input) {
    var out = {}
    for (var id in input) {
        if (input.hasOwnProperty(id) && input[id].length !== 0 && input[id].split(':').length > 1) {
            out[input[id].split(':')[0]] = input[id].replace(input[id].split(':')[0] + ":", "").replace("\r", "")
        }
    }
    return out
}

module.exports.listenOn = listenOn
