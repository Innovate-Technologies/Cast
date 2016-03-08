import geojson from "geojson"

module.exports = (app) => {

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
        res.json(global.streams.getListeners(req.params.stream))
    })


    app.get("/api/:stream/:key/unique-listeners", (req, res) => {
        if (req.params.key !== global.config.apikey) {
            res.status(400).json({error: "Invalid API key"})
            return
        }
        res.json(global.streams.getUniqueListeners(req.params.stream))
    })

    app.get("/api/:stream/:key/listenersmap", (req, res) => {
        if (req.params.key !== global.config.apikey) {
            return res.status(400).json({error: "Invalid API key"})
        }
        if (!config.geoservices || config.geoservices.enabled) {
            return res.status(500).json({error: "GeoServices is disabled"})
        }

        var listeners = global.streams.getListeners(req.params.stream)

        var geoArray = []

        for (var id in listeners) {
            if (listeners[id].location) {
                geoArray.push({name: listeners[id].client || listeners[id].ip, ip: listeners[id].ip, latitude: listeners[id].location.latitude, longitude: listeners[id].location.longitude})
            }
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
