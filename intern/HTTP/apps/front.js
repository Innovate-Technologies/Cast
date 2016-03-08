import jade from "jade"
import fs from "fs"
import geolock from "../../geolock/geolock.js"
import express from "express"

const indexPage = jade.compile(fs.readFileSync(global.localdir + "/public/index.jade"));

module.exports = (app) => {
    app.get("/", (req, res) => {
        // Index page
        let geolockIsAllowed = geolock.isAllowed(req.ip)
        let streams = global.streams.getActiveStreams()
        if (streams.length > 0) {
            let stream;
            stream = global.streams.isStreamInUse(global.streams.primaryStream) ? global.streams.primaryStream : streams[0]
            let meta = global.streams.getStreamMetadata(stream)
            res.send(indexPage({
                isStreaming: true,
                streamInfo: global.streams.getStreamConf(stream),
                meta: meta,
                streams: streams,
                currentStream: stream,
                listencount: global.streams.numberOfListerners(stream),
                hostname: global.config.hostname,
                geolockIsAllowed: geolockIsAllowed,
            }))
        } else {
            res.send(indexPage({
                isStreaming: false,
                geolockIsAllowed: geolockIsAllowed,
            }))
        }

    })

    app.get("/pub/:stream", (req, res) => {
        var geolockIsAllowed = geolock.isAllowed(req.ip)
        if (!req.params.stream || !global.streams.isStreamInUse(req.params.stream)) {
            res.send(indexPage({
                isStreaming: false,
                streams: global.streams.getActiveStreams(),
                geolockIsAllowed: geolockIsAllowed,
            }))
        } else {
            var meta = global.streams.getStreamMetadata(req.params.stream)
            res.send(indexPage({
                isStreaming: true,
                streamInfo: global.streams.getStreamConf(req.params[0]),
                meta: meta,
                streams: global.streams.getActiveStreams(),
                currentStream: req.params[0],
                listencount: global.streams.numberOfListerners(req.params[0]),
                hostname: global.config.hostname,
                geolockIsAllowed: geolockIsAllowed,
            }))
        }
    })

    // serve static
    app.use("/static", express.static(global.localdir + "/public/static"));
}
