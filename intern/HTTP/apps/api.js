import geojson from "geojson"
import _ from "underscore"

export default (app) => {

    app.get("/api/version", (req, res) => {
        res.json({version: global.cast.version})
    })

    app.get("/api/:stream/past-metadata", (req, res) => {
        res.json(global.streams.getPastMedatada(req.params.stream) || {})
    })

    app.get("/api/:stream/current-metadata", (req, res) => {
        res.json(global.streams.getStreamMetadata(req.params.stream))
    })

    app.get("/api/list-active-streams", (req, res) => {
        res.json(global.streams.getActiveStreams())
    })

    app.get("/api/:stream/:key/listeners", (req, res) => {
        if (req.params.key !== global.config.apikey) {
            res.status(400).json({error: "Invalid API key"})
            return
        }
        const listeners = []
        for (let listener of global.streams.getListeners(req.params.stream)) {
            listeners.push(_.omit(listener, "statsPromise"))
        }
        res.json(listeners)
    })


    app.get("/api/:stream/:key/unique-listeners", (req, res) => {
        if (req.params.key !== global.config.apikey) {
            res.status(400).json({error: "Invalid API key"})
            return
        }

        const listeners = []
        for (let listener of global.streams.getUniqueListeners(req.params.stream)) {
            listeners.push(_.omit(listener, "statsPromise"))
        }

        res.json(listeners)
    })

    app.get("/api/:stream/:key/listenersmap", (req, res) => {
        if (req.params.key !== global.config.apikey) {
            return res.status(400).json({error: "Invalid API key"})
        }
        if (!config.geoservices || !config.geoservices.enabled) {
            return res.status(500).json({error: "GeoServices is disabled"})
        }

        let listeners

        if (req.params.stream === "*") {
            listeners = []
            for (let stream of global.streams.getActiveStreams()) {
                listeners = listeners.concat(global.streams.getListeners(stream))
            }
        } else {
            listeners = global.streams.getListeners(req.params.stream)
        }

        const geoArray = []

        for (let listener of listeners) {
            geoArray.push({name: listener.client || listener.ip, ip: listener.ip, latitude: listener.location.latitude, longitude: listener.location.longitude})
        }

        res.setHeader("Content-Type", "application/json");
        res.send(geojson.parse(geoArray, {Point: ["latitude", "longitude"]}))
    })

    app.post("/api/:key/:stream/end", (req, res) => {
        if (req.params.key !== global.config.apikey) {
            res.status(400).json({error: "Invalid API key"})
            return
        }
        if (!global.streams.isStreamInUse(req.params.stream)) {
            res.status(400).json({error: "Stream is not in use"})
            return
        }
        global.streams.endStream(req.params.stream)
        res.json({result: "okay"})
    })

}
