var xml = require('xml');
var auth = require('http-auth');

var basic = auth.basic({
    realm: "Cast SHOUTcast v2 compatible backend"
}, function(username, password, callback) { // Custom authentication method.
    callback(username === "admin" && password === global.config.apikey);
});
module.exports = function(app) {

    app.get("/currentsong", function(req, res) {
        var stream = sidToStream(req.query.sid)

        if (global.streams.isStreamInUse(stream)) {
            res.send(global.streams.getStreamMetadata(stream).song || "")
        } else {
            res.send('')
        }

    })

    app.get("/statistics", function(req, res) {
        var mode = 'xml'
        if (req.query.json == 1) {
            mode = 'json'
        }
        var generalInfo = {
            "totalstreams": global.config.streams.length,
            "activestreams": global.streams.getActiveStreams().length,
            "currentlisteners": 0, //TO DO: Calculate this
            "peaklisteners": 0, //Currently not recorded
            "maxlisteners": 999999, //Max??? Why limit that?
            "uniquelisteners": 0, //TO DO: calculate this
            "averagetime": 0, //Any idea what this means?
            "version": global.cast.version + " (V8 (Node.JS))",
        }
        var streamInfo = []
        var streams = global.streams.getActiveStreams()
        for (var id in streams) {
            if (streams.hasOwnProperty(id)) {
                streamInfo.push({
                    "id": id, // again we should assign numbers
                    "currentlisteners": global.streams.numberOfListerners(streams[id]),
                    "peaklisteners": global.streams.numberOfListerners(streams[id]), //Shall we record this?
                    "maxlisteners": 9999999, //not again...
                    "uniquelisteners": global.streams.numberOfUniqueListerners(streams[id]),
                    "averagetime": 0, //Again, what is this?
                    "servergenre": global.streams.getStreamConf(streams[id]).genre,
                    "servergenre2": "", //We'll probably never support this
                    "servergenre3": "",
                    "servergenre4": "",
                    "servergenre5": "",
                    "serverurl": global.streams.getStreamConf(streams[id]).url || "",
                    "servertitle": global.streams.getStreamConf(streams[id]).name || "",
                    "songtitle": global.streams.getStreamMetadata(streams[id]).song || "",
                    "streamhits": 0, //What if my server is top 40?? got it?
                    "streamstatus": 1, //Yeah DUH
                    "backupstatus": 0, //We got no fallback
                    "streamlisted": 1, //Unable to tell with our YP mechanism
                    "streamlistederror": 200, //idem
                    "streampath": "/streams/" + streams[id],
                    "streamuptime": 0, //not logged
                    "bitrate": global.streams.getStreamConf(streams[id]).bitrate || 0,
                    "samplerate": 44100, //not logged
                    "content": global.streams.getStreamConf(streams[id]).type || "audio/mpeg"
                })
            }
        }

        if (mode === 'json') {
            generalInfo.streams = streamInfo
            res.json(generalInfo)
            return
        }

        var streamInfoXML = []

        for (var id in generalInfo) {
            if (generalInfo.hasOwnProperty(id)) {
                var obj = {}
                obj[id.toUpperCase()] = generalInfo[id]
                streamInfoXML.push(obj)
            }
        }

        for (var id in streamInfo) {
            var strInfo = [{
                _attr: {
                    id: id
                }
            }]
            for (var objid in streamInfo[id]) {
                var obj = {}
                obj[objid.toUpperCase()] = streamInfo[id][objid]
                strInfo.push(obj)
            }
            streamInfoXML.push({
                STREAM: strInfo
            })
        }

        //TO DO: look up how we can add multiple stream tags here
        res.setHeader("Content-Type", "text/xml")
        res.send(xml({
            SHOUTCASTSERVER: [{
                STREAMSTATS: streamInfoXML
            }]

        }))

    })

    app.get("/stats", function(req, res) {
        var stream = sidToStream(req.query.sid)
        var mode = 'xml'
        if (req.query.json == 1) {
            mode = 'json'
        }
        var generalInfo = {
            "id": id, // again we should assign numbers
            "currentlisteners": global.streams.numberOfListerners(stream),
            "peaklisteners": global.streams.numberOfListerners(stream), //Shall we record this?
            "maxlisteners": 9999999, //not again...
            "uniquelisteners": global.streams.numberOfUniqueListerners(stream),
            "averagetime": 0, //Again, what is this?
            "servergenre": global.streams.getStreamConf(stream).genre,
            "servergenre2": "", //We'll probably never support this
            "servergenre3": "",
            "servergenre4": "",
            "servergenre5": "",
            "serverurl": global.streams.getStreamConf(stream).url || "",
            "servertitle": global.streams.getStreamConf(stream).name || "",
            "songtitle": global.streams.getStreamMetadata(stream).song || "",
            "streamhits": 0, //What if my server is top 40?? got it?
            "streamstatus": 1, //Yeah DUH
            "backupstatus": 0, //We got no fallback
            "streamlisted": 1, //Unable to tell with our YP mechanism
            "streamlistederror": 200, //idem
            "streampath": "/streams/" + stream,
            "streamuptime": 0, //not logged
            "bitrate": global.streams.getStreamConf(stream).bitrate || 0,
            "samplerate": 44100, //not logged
            "content": global.streams.getStreamConf(stream).type || "audio/mpeg"
        }

        if (mode === 'json') {
            res.json(generalInfo)
            return
        }

        var streamInfoXML = []

        for (var id in generalInfo) {
            if (generalInfo.hasOwnProperty(id)) {
                var obj = {}
                obj[id.toUpperCase()] = generalInfo[id]
                streamInfoXML.push(obj)
            }
        }

        //TO DO: look up how we can add multiple stream tags here
        res.setHeader("Content-Type", "text/xml")
        res.send(xml({
            SHOUTCASTSERVER: streamInfoXML

        }))

    })

    app.get("/7.html", function(req, res) { //Personal option: WHY USE THIS????
        var stream = sidToStream(req.query.sid)
            //CURRENTLISTENERS,STREAMSTATUS,PEAKLISTENERS,MAXLISTENERS,UNIQUELISTENERS,BITRATE,SONGTITLE
        if (global.streams.isStreamInUse(stream)) {
            res.send(global.streams.numberOfListerners(stream).toString() + ",1," + global.streams.numberOfListerners(stream).toString() + ",99999," + global.streams.numberOfUniqueListerners(stream).toString() + "," + (global.streams.getStreamConf(stream).bitrate || "0") + "," + (global.streams.getStreamMetadata(stream).song || ""))
        } else {
            res.send("0,0,0,99999,0,0,")
        }
    })

    app.get("/played*", function(req, res) {
        streamAdminSongHistory(req, res)
    })

    app.get("/admin.cgi", auth.connect(basic), function(req, res) {
        if (typeof req.query.mode === "undefined") {
            res.status(400).send('This is only for API calls.')
            return
        }
        switch (req.query.page) {
            case '1':
                streamAdminStats(req, res)
                break;
            case '3':
                streamAdminListeners(req, res)
                break;
            case '4':
                streamAdminSongHistory(req, res)
                break;
            default:
                streamAdminOverview(req, res)
        }
    })

}


var sidToStream = function(sid) {
    var stream
    if (typeof sid === "undefined") {
        stream = global.streams.primaryStream
    } else if (!isNaN(parseInt(sid))) {
        stream = global.streams.streamID[parseInt(sid) - 1]
    } else {
        stream = sid
    }
    return stream
}

var streamAdminOverview = function(req, res) {

    var stream = sidToStream(req.query.sid)
    var streamStatus = 0
    if (global.streams.isStreamInUse(stream)) {
        var out = {
            "currentlisteners": global.streams.numberOfListerners(stream) || 0,
            "peaklisteners": global.streams.numberOfListerners(stream) || 0,
            "maxlisteners": 9999,
            "uniquelisteners": global.streams.numberOfUniqueListerners(stream) || 0,
            "averagetime": 0,
            "servergenre": global.streams.getStreamConf(stream).genre || "",
            "servergenre2": "",
            "servergenre3": "",
            "servergenre4": "",
            "servergenre5": "",
            "serverurl": global.streams.getStreamConf(stream).url || "",
            "servertitle": global.streams.getStreamConf(stream).name || "",
            "songtitle": global.streams.getStreamMetadata(stream).song || "",
            "streamhits": 0,
            "streamstatus": 1,
            "backupstatus": 0,
            "streamlisted": 0, //We never can know
            "streamlistederror": 200,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": global.streams.getStreamConf(stream).bitrate,
            "content": global.streams.getStreamConf(stream).type,
            "version": global.cast.version + " (V8 (Node.JS))"
        }
    } else {
        var out = {
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
            "streamlisted": 0, //We never can know
            "streamlistederror": 200,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": 0,
            "content": "",
            "version": global.cast.version + " (V8 (Node.JS))"
        }
    }
    var pastSongs = global.streams.getPastMedatada(stream)
    out.songs = []

    for (var id in pastSongs) {
        if (pastSongs.hasOwnProperty(id)) {
            out.songs.push({
                "playedat": pastSongs[id].time,
                "title": pastSongs[id].song
            })
        }
    }

    var listeners = global.streams.getListeners(stream)

    out.listeners = []

    for (var id in listeners) {
        if (listeners.hasOwnProperty(id)) {
            out.listeners.push({
                "hostname": listeners[id].ip,
                "useragent": listeners[id].client,
                "connecttime": (Math.round((new Date()).getTime() / 1000) - listeners[id].starttime),
                "uid": id,
                "type": "",
                "referer": "",
                "xff": "",
                "grid": "-1",
                "triggers": "0"
            })
        }
    }

    if (req.query.mode == "viewjson") {
        res.json(out)
        return
    }

    var outXML = []

    for (var id in out) {
        if (out.hasOwnProperty(id)) {
            var obj = {}
            if (id !== "listeners" && id !== "songs") {
                obj[id.toUpperCase()] = out[id]
                outXML.push(obj)
            }
        }
    }

    var xmlListeners = []

    for (var id in out.listeners) {
        if (out.listeners.hasOwnProperty(id)) {
            var lstrInfo = []
            for (var objid in out.listeners[id]) {
                var obj = {}
                obj[objid.toUpperCase()] = out.listeners[id][objid]
                lstrInfo.push(obj)
            }
            xmlListeners.push({
                LISTENER: lstrInfo
            })
        }
    }

    outXML.push({
        LISTENERS: xmlListeners
    })

    var xmlSongs = []

    for (var id in out.songs) {
        if (out.songs.hasOwnProperty(id)) {
            var songInfo = [{}]
            for (var objid in out.songs[id]) {
                var obj = {}
                obj[objid.toUpperCase()] = out.songs[id][objid]
                songInfo.push(obj)
            }

            xmlSongs.push({
                SONG: songInfo
            })
        }
    }

    outXML.push({
        SONGHISTORY: xmlSongs
    })

    res.setHeader("Content-Type", "text/xml")
    res.send(xml({
        SHOUTCASTSERVER: outXML
    }))

}

var streamAdminStats = function(req, res) {

    var stream = sidToStream(req.query.sid)
    var streamStatus = 0
    if (global.streams.isStreamInUse(stream)) {
        var out = {
            "currentlisteners": global.streams.numberOfListerners(stream) || 0,
            "peaklisteners": global.streams.numberOfListerners(stream) || 0,
            "maxlisteners": 9999,
            "uniquelisteners": global.streams.numberOfUniqueListerners(stream) || 0,
            "averagetime": 0,
            "servergenre": global.streams.getStreamConf(stream).genre || "",
            "servergenre2": "",
            "servergenre3": "",
            "servergenre4": "",
            "servergenre5": "",
            "serverurl": global.streams.getStreamConf(stream).url || "",
            "servertitle": global.streams.getStreamConf(stream).name || "",
            "songtitle": global.streams.getStreamMetadata(stream).song || "",
            "streamhits": 0,
            "streamstatus": 1,
            "backupstatus": 0,
            "streamlisted": 0, //We never can know
            "streamlistederror": 200,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": global.streams.getStreamConf(stream).bitrate,
            "content": global.streams.getStreamConf(stream).type,
            "version": global.cast.version + " (V8 (Node.JS))"
        }
    } else {
        var out = {
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
            "streamlisted": 0, //We never can know
            "streamlistederror": 200,
            "streamsource": "127.0.0.1",
            "streampath": "/streams/" + stream,
            "streamuptime": 2,
            "bitrate": 0,
            "content": "",
            "version": global.cast.version + " (V8 (Node.JS))"
        }
    }

    if (req.query.mode == "viewjson") {
        res.json(out)
        return
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
        SHOUTCASTSERVER: outXML
    }))

}
var streamAdminListeners = function(req, res) {
    var stream = sidToStream(req.query.sid)
    var listeners = global.streams.getListeners(stream)

    var out = []

    for (var id in listeners) {
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
                "triggers": "0"
            })
        }
    }

    if (req.query.mode == "viewjson") {
        res.json(out)
        return
    }

    var outXML = []

    for (var id in out) {
        if (out.hasOwnProperty(id)) {
            var lstrInfo = []
            for (var objid in out[id]) {
                var obj = {}
                obj[objid.toUpperCase()] = out[id][objid]
                lstrInfo.push(obj)
            }

            outXML.push({
                LISTENER: lstrInfo
            })
        }
    }

    res.setHeader("Content-Type", "text/xml")
    res.send(xml({
        SHOUTCASTSERVER: [{
            LISTENERS: outXML
        }]

    }))

}

var streamAdminSongHistory = function(req, res) {
    var stream = sidToStream(req.query.sid)
    var pastSongs = global.streams.getPastMedatada(stream)
    var out = []

    for (var id in pastSongs) {
        if (pastSongs.hasOwnProperty(id)) {
            out.push({
                "playedat": pastSongs[id].time,
                "title": pastSongs[id].song
            })
        }
    }

    if (req.query.mode == "viewjson" || req.query.type == "json") {
        res.json(out)
        return
    }

    var outXML = []

    for (var id in out) {
        if (out.hasOwnProperty(id)) {
            var songInfo = [{}]
            for (var objid in out[id]) {
                var obj = {}
                obj[objid.toUpperCase()] = out[id][objid]
                songInfo.push(obj)
            }

            outXML.push({
                SONG: songInfo
            })
        }
    }

    res.setHeader("Content-Type", "text/xml")
    res.send(xml({
        SHOUTCASTSERVER: [{
            SONGHISTORY: outXML
        }]

    }))
}
