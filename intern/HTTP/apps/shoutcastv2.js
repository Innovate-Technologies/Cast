import xml from "xml"
import auth from "http-auth"

var basic = auth.basic({
    realm: "Cast's SHOUTcast v2 compatible backend",
}, (username, password, callback) => { // Custom authentication method.
    callback(username === "admin" && password === config.apikey);
});

export default function (app) {

    app.get("/currentsong", (req, res) => {
        var stream = sidToStream(req.query.sid)

        if (streams.isStreamInUse(stream)) {
            res.send(streams.getStreamMetadata(stream).song || "")
        } else {
            res.send("")
        }

    })

    app.get("/statistics", (req, res) => {
        const activeStreams = streams.getActiveStreams()
        let mode = "xml"
        if (req.query.json === 1) {
            mode = "json"
        }

        let currentlistenersAllStreams = 0;
        let uniquelistenersAllStreams = 0;
        for (let stream of activeStreams) {
            currentlistenersAllStreams += streams.numberOfListerners(stream);
            uniquelistenersAllStreams += streams.numberOfUniqueListerners(stream);
        }

        let generalInfo = {
            "totalstreams": config.streams.length,
            "activestreams": streams.getActiveStreams().length,
            "currentlisteners": currentlistenersAllStreams,
            "peaklisteners": 0, // Shall we record this?
            "maxlisteners": 999999, // Max??? Why limit that?
            "uniquelisteners": uniquelistenersAllStreams,
            "averagetime": 0, // Shall we record this?
            "version": cast.version + " (V8 (Node.JS))",
        }
        var streamInfo = []

        for (let id in activeStreams) {
            if (activeStreams.hasOwnProperty(id)) {
                streamInfo.push({
                    "id": id,
                    "currentlisteners": streams.numberOfListerners(activeStreams[id]),
                    "peaklisteners": streams.numberOfListerners(activeStreams[id]), // Shall we record this?
                    "maxlisteners": 9999999, // not again...
                    "uniquelisteners": streams.numberOfUniqueListerners(activeStreams[id]),
                    "averagetime": 0,  // Shall we record this?
                    "servergenre": streams.getStreamConf(streams[id]).genre,
                    "servergenre2": "", // We'll probably never support this
                    "servergenre3": "",
                    "servergenre4": "",
                    "servergenre5": "",
                    "serverurl": streams.getStreamConf(activeStreams[id]).url || "",
                    "servertitle": streams.getStreamConf(activeStreams[id]).name || "",
                    "songtitle": streams.getStreamMetadata(activeStreams[id]).song || "",
                    "streamhits": 0, // What if my server is top 40?? got it?
                    "streamstatus": 1,
                    "backupstatus": 0, // We got no fallback
                    "streamlisted": 1, // Unable to tell with our YP mechanism
                    "streamlistederror": 200, // idem
                    "streampath": "/streams/" + activeStreams[id],
                    "streamuptime": 0, // not logged
                    "bitrate": streams.getStreamConf(activeStreams[id]).bitrate || 0,
                    "samplerate": 44100, // not logged
                    "content": streams.getStreamConf(activeStreams[id]).type,
                })
            }
        }

        if (mode === "json") {
            generalInfo.streams = streamInfo
            return res.json(generalInfo)
        }

        const streamInfoXML = []

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
        const stream = sidToStream(req.query.sid)
            // CURRENTLISTENERS,STREAMSTATUS,PEAKLISTENERS,MAXLISTENERS,UNIQUELISTENERS,BITRATE,SONGTITLE
        if (streams.isStreamInUse(stream)) {
            res.send(streams.numberOfListerners(stream).toString() + ",1," + streams.numberOfListerners(stream).toString() + ",99999," + streams.numberOfUniqueListerners(stream).toString() + "," + streams.getStreamConf(stream).bitrate + "," + (streams.getStreamMetadata(stream).song || ""))
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

const sidToStream = (sid) => {
    if (!sid) {
        return streams.primaryStream
    }
    if (!isNaN(parseInt(sid, 10))) {
        return streams.streamID[parseInt(sid, 10)]
    }
    return sid
}


const streamAdminStats = (req, res) => {
    var stream = sidToStream(req.query.sid)
    let out
    if (streams.isStreamInUse(stream)) {
        out = {
            "currentlisteners": streams.numberOfListerners(stream),
            "peaklisteners": streams.numberOfListerners(stream),
            "maxlisteners": 9999,
            "uniquelisteners": streams.numberOfUniqueListerners(stream),
            "averagetime": 0,
            "servergenre": streams.getStreamConf(stream).genre,
            "servergenre2": "",
            "servergenre3": "",
            "servergenre4": "",
            "servergenre5": "",
            "serverurl": streams.getStreamConf(stream).url,
            "servertitle": streams.getStreamConf(stream).title,
            "songtitle": streams.getStreamMetadata(stream).song,
            "streamhits": 0,
            "streamstatus": 1,
            "backupstatus": 0,
            "streamlisted": 1,
            "streamlistederror": 200,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": streams.getStreamConf(stream).bitrate,
            "content": streams.getStreamConf(stream).type,
            "version": cast.version + " (V8 (Node.JS))",
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
            "version": cast.version + " (V8 (Node.JS))",
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
const streamAdminListeners = (req, res) => {
    var stream = sidToStream(req.query.sid)
    var listeners = streams.getListeners(stream)

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

const streamAdminSongHistory = (req, res) => {
    let stream = sidToStream(req.query.sid)
    let pastSongs = streams.getPastMedatada(stream)
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
