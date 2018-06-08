import icy from "./icy"
import * as geolock from "../geolock/geolock.js"

export default (app) => {
    if (!app) {
        return
    }

    if (!global.streams) {
        global.streams = require("./streams.js")
    }

    app.head("/streams/:stream", (req, res) => {
        if (!geolock.isAllowed(req.ip)) {
            return res.status(401).send()
        }
        if (!req.params.stream) {
            return res.status(404).send()
        }
        if (req.params.stream.split(".").length > 1) {
            if (req.params.stream.split(".")[1] === "pls") {
                res.setHeader("Content-Type", "audio/x-scpls")
                return res.send()
            }
            if (req.params.stream.split(".")[1] === "m3u") {
                res.setHeader("Content-Type", "audio/x-mpegurl")
                return res.send()
            }
        }

        if (!global.streams.streamExists(req.params.stream)) {
            return res.status(404).send()
        }

        const streamConf = global.streams.getStreamConf(req.params.stream)

        const headers = {
            "Content-Type": streamConf.type || "audio/mpeg",
            "Connection": "close",
            "icy-name": streamConf.name || "Unknown stream",
            "icy-genre": streamConf.genre || "unknown",
            "icy-br": streamConf.bitrate || 0,
            "Access-Control-Allow-Origin": "*",
            "X-Begin": "Thu, 30 Jan 2014 17:20:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT",
        }

        if (req.headers["user-agent"] && req.headers["user-agent"].indexOf("RealMedia") > -1) {
            // RealMedia players can't read the ICY metadata properly
            req.headers["icy-metadata"] = 0
        }

        // send icy header
        if (req.headers["icy-metadata"] === "1") {
            headers["icy-metaint"] = 8192;
        }

        res.writeHead(200, headers);
        res.send()

    })

    app.get("/hls/:stream/:segment", (req, res) => {
        if (!geolock.isAllowed(req.ip)) {
            return res.status(401).send("Your country is not allowed to tune in to the stream")
        }
        if (!global.streams.streamExists(req.params.stream)) {
            res.status(404).send("Stream not found")
            return
        }
        if (!req.query.id || !global.streams.listenerIdExists(req.params.stream, req.query.id, req.ip, req.headers["user-agent"])) {
            return res.status(401).send("Invalid id")
        }

        if (!global.streams.hlsLastHit[req.params.stream]) {
            global.streams.hlsLastHit[req.params.stream] = {}
        }

        global.streams.hlsLastHit[req.params.stream][req.query.id] = Math.round((new Date()).getTime() / 1000)

        var streamConf = global.streams.getStreamConf(req.params.stream)

        // generate response header
        const headers = {
            "Content-Type": streamConf.type || "audio/mpeg",
            "Connection": "close",
            "Access-Control-Allow-Origin": "*",
            "X-Begin": "Thu, 30 Jan 2014 17:20:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT",
        }
        if (!global.streams.hlsPool[req.params.stream][req.params.segment]) {
            return res.status(404).send("Segment not found")
        }
        res.writeHead(200, headers);
        res.write(global.streams.hlsPool[req.params.stream][req.params.segment])
        res.end()
    })

    app.get("/streams/:stream", (req, res) => {

        if (!geolock.isAllowed(req.ip)) {
            return res.status(401).send("Your country is not allowed to tune in to the stream")
        }

        if (!req.params.stream) {
            res.status(404).send("Stream not found")
            return
        }

        if (req.params.stream.split(".").length > 1) {
            if (req.params.stream.split(".")[1] === "pls") {
                servePLS(req, res)
                return
            }
            if (req.params.stream.split(".")[1] === "m3u") {
                serveM3U(req, res)
                return
            }
            if (req.params.stream.split(".")[1] === "m3u8" && global.config.hls) {
                serveM3U8(req, res)
                return
            }
        }

        if (!global.streams.streamExists(req.params.stream)) {
            res.status(404).send("Stream not found")
            return
        }

        // get stream

        let stream = global.streams.getStream(req.params.stream)
        let streamConf = global.streams.getStreamConf(req.params.stream)
        let streamMeta = global.streams.getStreamMetadata

        let prevMetadata = "";

        // generate response header
        const headers = {
            "Content-Type": streamConf.type || "audio/mpeg",
            "Connection": "close",
            "icy-name": streamConf.name || "Unknown stream",
            "icy-genre": streamConf.genre || "unknown",
            "icy-br": streamConf.bitrate || 0,
            "Access-Control-Allow-Origin": "*",
            "X-Begin": "Thu, 30 Jan 2014 17:20:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT",
        }

        if (req.headers["user-agent"] && req.headers["user-agent"].indexOf("RealMedia") > -1) {
            // RealMedia players can't read the ICY metadata properly
            req.headers["icy-metadata"] = 0
        }

        // send icy header
        if (req.headers["icy-metadata"] === "1") {
            headers["icy-metaint"] = 8192;
        }

        var listenerID = global.streams.listenerTunedIn(req.params.stream, req.ip, req.headers["user-agent"], Math.round((new Date()).getTime() / 1000))
        res.writeHead(200, headers);

        // setup icy

        if (req.headers["icy-metadata"] === "1") {
            res = new icy.IcecastWriteStack(res, 8192); // DISCLAIMER: ICY is not Icecast
            let meta = streamMeta(req.params.stream)
            res.queueMetadata({
                StreamTitle: meta.song || streamConf.name || streamConf.name,
                StreamUrl: "",
            });
        }


        const gotChunk = (chunk) => {
            let meta = streamMeta(req.params.stream)
            if (req.headers["icy-metadata"] === "1" && meta && meta.song && prevMetadata !== meta.song) {
                res.queueMetadata({
                    StreamTitle: meta.song || streamConf.name,
                    StreamUrl: "",
                });
                prevMetadata = meta.song;
            }
            res.write(chunk);
        };
        for (let buffer of global.streams.getPreBuffer(req.params.stream)) {
            res.write(buffer)
        }


        stream.on("data", gotChunk);

        stream.on("end", () => {
            if (res) {
                res.end()
                stream.removeListener("data", gotChunk);
                global.streams.listenerTunedOut(req.params.stream, listenerID)
                stream = null
                streamConf = null
                streamMeta = null
                req = null
                res = null
            }
        })

        stream.on("error", () => {
            // leave it unhandled for now
        })

        req.connection.on("close", () => {
            if (req) {
                global.streams.listenerTunedOut(req.params.stream, listenerID)
                stream.removeListener("data", gotChunk);
                stream = null
                streamConf = null
                streamMeta = null
                req = null
                res = null
            }
        });

    })

    var servePLS = (req, res) => {
        var stream = req.params.stream.split(".")[0]
        if (!stream || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }
        var pls = "[playlist]\n"
        pls += "numberofentries=1\n"
        pls += "File1=" + global.config.hostname + "/streams/" + stream + "\n"
        pls += "Title1=" + global.streams.getStreamConf(stream).name + "\n"
        pls += "Length1=-1" + "\n"
        pls += "version=2"

        res.setHeader("Content-Type", "audio/x-scpls")
        res.send(pls)
    }

    var serveM3U = (req, res) => {
        var stream = req.params.stream.split(".")[0]
        if (!stream || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }

        res.setHeader("Content-Type", "audio/x-mpegurl")
        res.send(global.config.hostname + "/streams/" + stream)
    }

    const serveM3U8 = (req, res) => {
        let stream = req.params.stream.split(".")[0]
        if (!stream || !global.streams.streamExists(stream)) {
            return res.status(404).send("Stream not found")
        }

        if (!req.query.id || !global.streams.listenerIdExists(stream, req.query.id, req.ip, req.headers["user-agent"])) {
            var listenerID = global.streams.listenerTunedIn(stream, req.ip, req.headers["user-agent"], Math.round((new Date()).getTime() / 1000), true)
            if (!global.streams.hlsLastHit[req.params.stream]) {
                global.streams.hlsLastHit[stream] = {}
            }
            global.streams.hlsLastHit[stream][listenerID] = Math.round((new Date()).getTime() / 1000)
            return res.redirect("/streams/" + stream + ".m3u8?id=" + listenerID);
        }

        global.streams.hlsLastHit[stream][req.query.id] = Math.round((new Date()).getTime() / 1000)
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
        let response = `#EXTM3U\n#EXT-X-VERSION:5\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:${global.streams.hlsDeleteCount[stream]}\n`
        for (let index of global.streams.hlsIndexes[stream]) {
            response += `#EXTINF:2.0,\n${global.config.hostname}/hls/${stream}/${index}?id=${req.query.id}\n`
        }
        res.send(response)
    }

}
