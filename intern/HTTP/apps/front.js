import pug from "pug"
import fs from "fs"
import * as geolock from "../../geolock/geolock.js"
import express from "express"

const indexPage = pug.compile(fs.readFileSync(localdir + "/public/index.jade"));

export default (app) => {
    app.get("/", (req, res) => {
        // Index page
        const geolockIsAllowed = geolock.isAllowed(req.processedIP)
        const activeStreams = streams.getActiveStreams()
        if (activeStreams.length > 0) {
            const stream = streams.isStreamInUse(streams.primaryStream) ? streams.primaryStream : activeStreams[0]
            const meta = streams.getStreamMetadata(stream)
            res.send(indexPage({
                isStreaming: true,
                streamInfo: streams.getStreamConf(stream),
                meta,
                streams: activeStreams,
                currentStream: stream,
                listencount: config.hideListenerCount ? null : streams.numberOfListerners(stream),
                hostname: config.hostname,
                geolockIsAllowed,
            }))
        } else {
            res.send(indexPage({
                isStreaming: false,
                geolockIsAllowed,
            }))
        }

    })

    app.get("/pub/:stream", (req, res) => {
        var geolockIsAllowed = geolock.isAllowed(req.processedIP)
        if (!req.params.stream || !streams.isStreamInUse(req.params.stream)) {
            res.send(indexPage({
                isStreaming: false,
                streams: streams.getActiveStreams(),
                geolockIsAllowed,
            }))
        } else {
            const meta = streams.getStreamMetadata(req.params.stream)
            res.send(indexPage({
                isStreaming: true,
                streamInfo: streams.getStreamConf(req.params.stream),
                meta,
                streams: streams.getActiveStreams(),
                currentStream: req.params.stream,
                listencount: config.hideListenerCount ? null : streams.numberOfListerners(req.params.stream),
                hostname: config.hostname,
                geolockIsAllowed,
            }))
        }
    })

    // serve static
    app.use("/static", express.static(localdir + "/public/static"));
}
