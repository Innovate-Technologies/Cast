import xml from "xml"
import auth from "http-auth"

var basic = auth.basic({
    realm: "Cast's SHOUTcast v2 compatible backend",
}, (username, password, callback) => { // Custom authentication method.
    callback(username === "admin" && password === global.config.apikey);
});

module.exports = function (app) {

    app.get("/currentsong", (req, res) => {
        var stream = sidToStream(req.query.sid)

        if (global.streams.isStreamInUse(stream)) {
            res.send(global.streams.getStreamMetadata(stream).song || "")
        } else {
            res.send("")
        }

    })

    app.get("/statistics", (req, res) => {
        let streams = global.streams.getActiveStreams()
        let mode = "xml"
        if (req.query.json === 1) {
            mode = "json"
        }

        let currentlistenersAllStreams = 0;
        let uniquelistenersAllStreams = 0;
        for (let stream of streams) {
            currentlistenersAllStreams += global.streams.numberOfListerners(stream);
            uniquelistenersAllStreams += global.streams.numberOfUniqueListerners(stream);
        }

        let generalInfo = {
            "totalstreams": global.config.streams.length,
            "activestreams": global.streams.getActiveStreams().length,
            "currentlisteners": currentlistenersAllStreams,
            "peaklisteners": 0, // Shall we record this?
            "maxlisteners": 999999, // Max??? Why limit that?
            "uniquelisteners": uniquelistenersAllStreams,
            "averagetime": 0, // Shall we record this?
            "version": global.cast.version + " (V8 (Node.JS))",
        }
        var streamInfo = []

        for (let id in streams) {
            if (streams.hasOwnProperty(id)) {
                streamInfo.push({
                    "id": id,
                    "currentlisteners": global.streams.numberOfListerners(streams[id]),
                    "peaklisteners": global.streams.numberOfListerners(streams[id]), // Shall we record this?
                    "maxlisteners": 9999999, // not again...
                    "uniquelisteners": global.streams.numberOfUniqueListerners(streams[id]),
                    "averagetime": 0,  // Shall we record this?
                    "servergenre": global.streams.getStreamConf(streams[id]).genre,
                    "servergenre2": "", // We'll probably never support this
                    "servergenre3": "",
                    "servergenre4": "",
                    "servergenre5": "",
                    "serverurl": global.streams.getStreamConf(streams[id]).url || "",
                    "servertitle": global.streams.getStreamConf(streams[id]).name || "",
                    "songtitle": global.streams.getStreamMetadata(streams[id]).song || "",
                    "streamhits": 0, // What if my server is top 40?? got it?
                    "streamstatus": 1,
                    "backupstatus": 0, // We got no fallback
                    "streamlisted": 1, // Unable to tell with our YP mechanism
                    "streamlistederror": 200, // idem
                    "streampath": "/streams/" + streams[id],
                    "streamuptime": 0, // not logged
                    "bitrate": global.streams.getStreamConf(streams[id]).bitrate || 0,
                    "samplerate": 44100, // not logged
                    "content": global.streams.getStreamConf(streams[id]).type,
                })
            }
        }

        if (mode === "json") {
            generalInfo.streams = streamInfo
            return res.json(generalInfo)
        }

        let streamInfoXML = []

        for (let key in generalInfo) {
            if (generalInfo.hasOwnProperty(key)) {
                var obj = {}
                obj[key.toUpperCase()] = generalInfo[key]
                streamInfoXML.push(obj)
            }
        }

        for (let id in streamInfo) {
            if (streamInfo.hasOwnProperty(id)) {
                var strInfo = [{
                    _attr: {
                        id: id,
                    },
                }]
                for (let objid in streamInfo[id]) {
                    if (streamInfo[id].hasOwnProperty(objid)) {
                        let infoObj = {}
                        infoObj[objid.toUpperCase()] = streamInfo[id][objid]
                        strInfo.push(infoObj)
                    }
                }
                streamInfoXML.push({
                    STREAM: strInfo,
                })
            }
        }

        res.setHeader("Content-Type", "text/xml")
        res.send(xml({
            SHOUTCASTSERVER: [
                {
                    STREAMSTATS: streamInfoXML,
                },
            ],
        }))

    })

    app.get("/7.html", (req, res) => { // Personal option: WHY USE THIS????
        var stream = sidToStream(req.query.sid)
            // CURRENTLISTENERS,STREAMSTATUS,PEAKLISTENERS,MAXLISTENERS,UNIQUELISTENERS,BITRATE,SONGTITLE
        if (global.streams.isStreamInUse(stream)) {
            res.send(global.streams.numberOfListerners(stream).toString() + ",1," + global.streams.numberOfListerners(stream).toString() + ",99999," + global.streams.numberOfUniqueListerners(stream).toString() + "," + global.streams.getStreamConf(stream).bitrate + "," + (global.streams.getStreamMetadata(stream).song || ""))
        } else {
            res.send("0,0,0,99999,0,0,")
        }
    })

    app.get("/played*", (req, res) => {
        streamAdminSongHistory(req, res)
    })

    app.get("/admin.cgi", auth.connect(basic), (req, res) => {
        if (!req.query.page || !req.query.mode) {
            return res.status(400).send("This is only for API calls.")
        }
        switch (req.query.page) {
            case "1":
                streamAdminStats(req, res)
                break;
            case "3":
                streamAdminListeners(req, res)
                break;
            case "4":
                streamAdminSongHistory(req, res)
                break;
            default:
                res.status(400).send("Not supported")
        }
    })
}

// functions used for the calls

let sidToStream = (sid) => {
    if (!sid) {
        return global.streams.primaryStream
    }
    if (!isNaN(parseInt(sid, 10))) {
        return global.streams.streamID[parseInt(sid, 10)]
    }
    return sid
}


let streamAdminStats = (req, res) => {
    var stream = sidToStream(req.query.sid)
    let out
    if (global.streams.isStreamInUse(stream)) {
        out = {
            "currentlisteners": global.streams.numberOfListerners(stream),
            "peaklisteners": global.streams.numberOfListerners(stream),
            "maxlisteners": 9999,
            "uniquelisteners": global.streams.numberOfUniqueListerners(stream),
            "averagetime": 0,
            "servergenre": global.streams.getStreamConf(stream).genre,
            "servergenre2": "",
            "servergenre3": "",
            "servergenre4": "",
            "servergenre5": "",
            "serverurl": global.streams.getStreamConf(stream).url,
            "servertitle": global.streams.getStreamConf(stream).title,
            "songtitle": global.streams.getStreamMetadata(stream).song,
            "streamhits": 0,
            "streamstatus": 1,
            "backupstatus": 0,
            "streamlisted": 1,
            "streamlistederror": 200,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": global.streams.getStreamConf(stream).bitrate,
            "content": global.streams.getStreamConf(stream).type,
            "version": global.cast.version + " (V8 (Node.JS))",
        }
    } else {
        out = {
            "currentlisteners": 0,
            "peaklisteners": 0,
            "maxlisteners": 9999,
            "uniquelisteners": 0,
            "averagetime": 0,
            "servergenre": "",
            "servergenre2": "",
            "servergenre3": "",
            "servergenre4": "",
            "servergenre5": "",
            "serverurl": "",
            "servertitle": "",
            "songtitle": "",
            "streamhits": 0,
            "streamstatus": 0,
            "backupstatus": 0,
            "streamlisted": 0,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": 0,
            "content": "",
            "version": global.cast.version + " (V8 (Node.JS))",
        }
    }

    if (req.query.mode === "viewjson") {
        return res.json(out)
    }

    var outXML = []

    for (var id in out) {
        if (out.hasOwnProperty(id)) {
            var obj = {}
            obj[id.toUpperCase()] = out[id]
            outXML.push(obj)
        }
    }

    res.setHeader("Content-Type", "text/xml")
    res.send(xml({
        SHOUTCASTSERVER: outXML,
    }))

}
let streamAdminListeners = (req, res) => {
    var stream = sidToStream(req.query.sid)
    var listeners = global.streams.getListeners(stream)

    var out = []

    for (let id in listeners) {
        if (listeners.hasOwnProperty(id)) {
            out.push({
                "hostname": listeners[id].ip,
                "useragent": listeners[id].client,
                "connecttime": (Math.round((new Date()).getTime() / 1000) - listeners[id].starttime),
                "uid": id,
                "type": "",
                "referer": "",
                "xff": "",
                "grid": "-1",
                "triggers": "0",
            })
        }
    }

    if (req.query.mode === "viewjson") {
        return res.json(out)
    }

    var outXML = []

    for (let id in out) {
        if (out.hasOwnProperty(id)) {
            var lstrInfo = []
            for (var objid in out[id]) {
                if (out[id].hasOwnProperty(objid)) {
                    let obj = {}
                    obj[objid.toUpperCase()] = out[id][objid]
                    lstrInfo.push(obj)
                }
            }
            outXML.push({
                LISTENER: lstrInfo,
            })
        }
    }

    res.setHeader("Content-Type", "text/xml")
    res.send(xml({
        SHOUTCASTSERVER: [
            {
                LISTENERS: outXML,
            },
        ],
    }))

}

let streamAdminSongHistory = (req, res) => {
    let stream = sidToStream(req.query.sid)
    let pastSongs = global.streams.getPastMedatada(stream)
    let out = []

    for (let id in pastSongs) {
        if (pastSongs.hasOwnProperty(id)) {
            out.push({
                "playedat": pastSongs[id].time,
                "title": pastSongs[id].song,
            })
        }
    }

    if (req.query.mode === "viewjson" || req.query.type === "json") {
        return res.json(out)
    }

    let outXML = []

    for (let id in out) {
        if (out.hasOwnProperty(id)) {
            var songInfo = [{}]
            for (let objid in out[id]) {
                if (out[id].hasOwnProperty(objid)) {
                    let obj = {}
                    obj[objid.toUpperCase()] = out[id][objid]
                    songInfo.push(obj)
                }
            }
            outXML.push({
                SONG: songInfo,
            })
        }
    }

    res.setHeader("Content-Type", "text/xml")
    res.send(xml({
        SHOUTCASTSERVER: [
            {
                SONGHISTORY: outXML,
            },
        ],
    }))
}
