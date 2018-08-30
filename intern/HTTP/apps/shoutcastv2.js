import xml from "xml"
import auth from "http-auth"

var basic = auth.basic({
    realm: "Cast's SHOUTcast v2 compatible backend",
}, (username, password, callback) => { // Custom authentication method.
    callback(password === config.apikey);
});

const shoutcastv1Auth = (fn) => {
    return (req, res, next) => {
        if (req.query.pass === config.apikey) {
            return next()
        }

        return fn(req, res, next)
    }
}

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
        if (req.query.json === "1") {
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
                    "servergenre": streams.getStreamConf(activeStreams[id]).genre,
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

    app.get("/admin.cgi", shoutcastv1Auth(auth.connect(basic)), (req, res) => {
        if (!req.query.page || !req.query.mode) {
            return res.status(400).send("This is only for API calls.")
        }
        switch (req.query.page) {
            case "1":
                return streamAdminStats(req, res)
                break;
            case "3":
                return streamAdminListeners(req, res)
                break;
            case "4":
                return streamAdminSongHistory(req, res)
                break;
        }

        switch (req.query.mode) {
            case "kicksrc": 
                const stream = sidToStream(req.query.sid)
                global.streams.endStream(stream)
                return res.status(200).send("OK")
                // implement me
                break;
        }

        return res.status(400).send("Not supported")
    })

    app.get("/stream/:sid", (req, res) => {
        const stream = sidToStream(req.params.sid)
        res.redirect(`/streams/${stream}`)
    })
    app.get("/;", (req, res) => { // we didn't want but we must
        res.redirect(`/streams/${streams.primaryStream}`)
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
    let output
    if (streams.isStreamInUse(stream)) {
        output = {
            "currentlisteners": streams.realNumberOfListerners(stream),
            "peaklisteners": streams.realNumberOfListerners(stream),
            "maxlisteners": 9999,
            "uniquelisteners": streams.realNumberOfUniqueListerners(stream),
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
        output = {
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
        return res.json(output)
    }

    var outXML = []

    for (var id in output) {
        if (output.hasOwnProperty(id)) {
            var obj = {}
            obj[id.toUpperCase()] = output[id]
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

    var output = []

    for (let id in listeners) {
        if (listeners.hasOwnProperty(id)) {
            output.push({
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
        return res.json(output)
    }

    var outXML = []

    for (let id in output) {
        if (output.hasOwnProperty(id)) {
            var lstrInfo = []
            for (var objid in output[id]) {
                if (output[id].hasOwnProperty(objid)) {
                    let obj = {}
                    obj[objid.toUpperCase()] = output[id][objid]
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
    let output = []

    for (let id in pastSongs) {
        if (pastSongs.hasOwnProperty(id)) {
            output.push({
                "playedat": pastSongs[id].time,
                "title": pastSongs[id].song,
            })
        }
    }

    if (req.query.mode === "viewjson" || req.query.type === "json") {
        return res.json(output)
    }

    let outXML = []

    for (let id in output) {
        if (output.hasOwnProperty(id)) {
            var songInfo = [{}]
            for (let objid in output[id]) {
                if (output[id].hasOwnProperty(objid)) {
                    let obj = {}
                    obj[objid.toUpperCase()] = output[id][objid]
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
