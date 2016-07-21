import stream from "stream"
import _ from "underscore"

if (config.geoservices && config.geoservices.enabled && !maxmind) {
    global.maxmind = require("maxmind")
    if (!global.maxmind.init(global.config.geoservices.maxmindDatabase)) {
        console.log("Error loading Maxmind Database")
    }
}

let configFileInfo = {} // {streamname:conf}
let streamID = {} // id:streamname
let inputStreams = {} // {streamname:stream}
let streams = {} // {streamname:stream}
let streamConf = {} // {streamname:{conf}}
let streamPasswords = {} // {pass:Stream}
let streamMetadata = {} // {streamname:{Meta}}
let streamPastMetadata = {} // {streamname:[{Meta}]}
let streamListeners = {} // {stream:[{listener}]}
let streamPreBuffer = {} // {stream:prebuffer}
let rateLimitBuffer = {} // {stream:[buffers]}
let rateLimitingIsEnabled = false
let primaryStream = ""
let latestListenerID = {} // {stream:id}

if (global.config.hls) {
    var hlsBuffer = {} // {stream:[buffers]}
    var hlsPool = {} // {stream:{unixtime:song data}}
    var hlsDeleteCount = {} // {stream:count}
    var hlsLastHit = {} // {stream:{id:unixtime}}
    var hlsIndexes = {} // {stream:[indexes]}
    setInterval(() => {
        let now = Math.round((new Date()).getTime() / 1000)
        for (let id in streams) {
            if (streams.hasOwnProperty(id)) {
                let listeners = getListeners(id)
                for (let lid in listeners) {
                    if (listeners.hasOwnProperty(lid)) {
                        if (listeners[lid].hls) {
                            if (!hlsLastHit[id]) {
                                hlsLastHit[id] = {}
                            }
                            if (!hlsLastHit[id][listeners[lid].id]) {
                                hlsLastHit[id][listeners[lid].id] = now
                            }
                            if (hlsLastHit[id][listeners[lid].id] < now - 20 ) {
                                listenerTunedOut(id, listeners[lid].id)
                            }
                        }
                    }
                }
            }
        }
    }, 1000)
}

const streamExists = function (streamname) {
    return streams.hasOwnProperty(streamname) && stream[streamname] !== null
}


/*
    Conf
    {
        stream: "streamname",
        name: "Stream Name",
        type: "Audio type in file Content-Type format eg. audio/mpeg"
    }
*/
const addStream = function (inputStream, conf) {
    conf.name = conf.name || "Not available";
    streamPreBuffer[conf.stream] = []

    var throttleStream = new stream.PassThrough();
    throttleStream.setMaxListeners(10000); // set soft max to prevent leaks
    streams[conf.stream] = throttleStream
    streamConf[conf.stream] = conf
    inputStreams[conf.stream] = inputStream

    if (config.rateLimiting) {
        rateLimitingIsEnabled = true

        inputStreams[conf.stream].on("data", (chunk) => {
            if (!rateLimitBuffer[conf.stream]) {
                rateLimitBuffer[conf.stream] = []
            }
            rateLimitBuffer[conf.stream].push(chunk)
        });

        var rateLimitInterval = setInterval(() => {
            throttleStream.write(Buffer.concat(rateLimitBuffer[conf.stream]))
            rateLimitBuffer[conf.stream] = []
        }, 500)
    } else {
        inputStream.pipe(throttleStream);
    }

    if (global.config.hls) {
        hlsDeleteCount[conf.stream] = 0

        inputStreams[conf.stream].on("data", (chunk) => {
            if (typeof hlsBuffer[conf.stream] === "undefined") {
                hlsBuffer[conf.stream] = []
            }
            hlsBuffer[conf.stream].push(chunk)
        });
        var hlsInterval = setInterval(() => {
            const now = new Date().getTime()
            if (!hlsPool[conf.stream]) {
                hlsPool[conf.stream] = {}
            }
            if (!hlsIndexes[conf.stream]) {
                hlsIndexes[conf.stream] = []
            }
            hlsPool[conf.stream][now] = Buffer.concat(hlsBuffer[conf.stream])
            hlsBuffer[conf.stream] = []
            hlsIndexes[conf.stream].push(now)
            if (hlsIndexes[conf.stream].length > 7) {
                hlsIndexes[conf.stream] = hlsIndexes[conf.stream].slice(1, hlsIndexes.length)
                hlsDeleteCount[conf.stream]++
            }
            for (var id in hlsPool[conf.stream]) {
                if (id < now - (5000 * 20)) {
                    delete hlsPool[conf.stream][id]
                }
            }
        }, 5000)
    }


    throttleStream.on("data", (chunk) => {
        const newPreBuffer = []
        const currentLength = streamPreBuffer[conf.stream].length
        for (let i = (rateLimitingIsEnabled ? 10 : 100); i > 0; i--) {
            if (streamPreBuffer[conf.stream].hasOwnProperty(currentLength - i)) {
                newPreBuffer.push(streamPreBuffer[conf.stream][currentLength - i])
            }
        }
        newPreBuffer.push(chunk)
        streamPreBuffer[conf.stream] = newPreBuffer
    })

    inputStreams[conf.stream].on("end", () => {
        streamPreBuffer[conf.stream] = ""
        if (rateLimitingIsEnabled) {
            rateLimitBuffer[conf.stream] = []
            clearInterval(rateLimitInterval)
            clearInterval(hlsInterval)
        }
    })
    events.emit("addStream", conf.stream)

}

const getStream = (streamName) => {
    return streams[streamName]
}

const getStreamConf = (streamName) => {
    return streamConf[streamName]
}

const removeStream = (streamName) => {
    streams = _.omit(streams, streamName)
    streamConf = _.omit(streamConf, streamName)
    streamMetadata = _.omit(streamMetadata, streamName)
    streamListeners = _.omit(streamListeners, streamName)
    events.emit("removeStream", streamName)
}

const isStreamInUse = (streamName) => {
    return streams.hasOwnProperty(streamName)
}

const getStreamMetadata = (streamName) => {
    return streamMetadata[streamName] || {}
}
const setStreamMetadata = (streamName, data) => {
    if (config.antiStreamRipper) {
        setTimeout(setStreamMetadataNow, 1000 * (Math.random() * 10), streamName, data)
    } else {
        setStreamMetadataNow(streamName, data)
    }
}

const setStreamMetadataNow = (streamName, data) => {
    if (!isStreamInUse(streamName)) {
        return // prevents race conditions with anti-streamripper
    }
    data.time = Math.round((new Date()).getTime() / 1000)
    streamMetadata[streamName] = data
    if (typeof streamPastMetadata[streamName] === "undefined") {
        streamPastMetadata[streamName] = [data]
    } else {
        const newMeta = []
        newMeta.push(data)
        for (var i = 0; i < 19; i++) {
            if (streamPastMetadata[streamName].hasOwnProperty(i)) {
                newMeta.push(streamPastMetadata[streamName][i])
            }
        }
        streamPastMetadata[streamName] = newMeta
    }
    data.stream = streamName
    events.emit("metadata", data)
}

const getActiveStreams = () => {
    const returnStreams = []
    for (let id in streams) {
        if (streams.hasOwnProperty(id)) {
            returnStreams.push(id)
        }
    }
    returnStreams.sort()
    returnStreams.sort((a, b) => {
        return (a.replace(/\D/g, "")) - (b.replace(/\D/g, ""));
    })
    return returnStreams
}

const listenerTunedIn = (streamName, ip, client, starttime, hls) => {
    if (!streamListeners[streamName]) {
        streamListeners[streamName] = []
    }

    if (!latestListenerID[streamName]) {
        latestListenerID[streamName] = 0;
    }

    latestListenerID[streamName]++

    const info = {
        stream: streamName,
        ip: ip,
        client: client,
        starttime: starttime,
        hls: hls || false,
        id: latestListenerID[streamName],
    }
    if (config.geoservices && config.geoservices.enabled) {
        var ipInfo = global.maxmind.getLocation(ip)
        if (ipInfo !== null) {
            info.country = ipInfo.countryName
            info.location = {
                "latitude": ipInfo.latitude,
                "longitude": ipInfo.longitude,
            }
        }
    }
    events.emit("listenerTunedIn", info)

    streamListeners[streamName].push(info)
    return info.id
}

const listenerTunedOut = (streamName, id) => {
    if (typeof id === "number" && streamListeners[streamName]) {
        var listener = _.findWhere(streamListeners[streamName], {id: id})
        events.emit("listenerTunedOut", {
            id: id,
            stream: streamName,
            ip: listener.ip,
            client: listener.client,
            starttime: listener.starttime,
        })
        streamListeners[streamName] = _.without(streamListeners[streamName], listener)
    }
}

const listenerIdExists = (streamName, id, ip, client) => {
    if (!streamListeners[streamName]) {
        return false
    }
    if (typeof id !== "number") {
        id = parseInt(id, 10)
    }
    const listener = _.findWhere(streamListeners[streamName], {id: id})
    if (!listener) {
        return false
    }
    if (listener.ip !== ip || listener.client !== client) {
        return false
    }
    return true
}

const getListeners = (streamName) => {
    if (!streamListeners[streamName]) {
        return []
    }
    return _.without(streamListeners[streamName], undefined)
}

const getUniqueListeners = (streamName) => {
    if (!streamListeners[streamName]) {
        return []
    }
    const listeners = getListeners(streamName)
    let listenersWithUniqueCriteria = []

    for (let listener of listeners) {
        listenersWithUniqueCriteria.push({
            stream: listener.stream,
            client: listener.client,
            ip: listener.ip,
        })
    }

    let uniqueListeners = []

    for (let id in listenersWithUniqueCriteria) {
        if (listenersWithUniqueCriteria.hasOwnProperty(id)) {
            if (listenersWithUniqueCriteria.indexOf(listenersWithUniqueCriteria[id]) === parseInt(id, 10)) {
                uniqueListeners.push(listeners[id])
            }
        }
    }

    return uniqueListeners
}

const numberOfListerners = (streamName) => {
    if (config.hideListenerCount) {
        return 0
    }
    return getListeners(streamName).length
}

const numberOfUniqueListerners = (streamName) => {
    if (config.hideListenerCount) {
        return 0
    }
    return getListeners(streamName).length
}

const realNumberOfListerners = (streamName) => {
    return getListeners(streamName).length
}

const realNumberOfUniqueListerners = (streamName) => {
    return getListeners(streamName).length
}
const getPreBuffer = (streamName) => {
    return streamPreBuffer[streamName]
}

const getPastMedatada = (streamName) => {
    return streamPastMetadata[streamName]
}


const endStream = (streamName) => {
    if (isStreamInUse(streamName)) {
        inputStreams[stream].destroy();
    }
}

module.exports.addStream = addStream
module.exports.streamExists = streamExists
module.exports.getStream = getStream
module.exports.getStreamConf = getStreamConf
module.exports.streamPasswords = streamPasswords
module.exports.removeStream = removeStream
module.exports.isStreamInUse = isStreamInUse
module.exports.getStreamMetadata = getStreamMetadata
module.exports.setStreamMetadata = setStreamMetadata
module.exports.getActiveStreams = getActiveStreams
module.exports.primaryStream = primaryStream
module.exports.listenerTunedIn = listenerTunedIn
module.exports.listenerTunedOut = listenerTunedOut
module.exports.listenerIdExists = listenerIdExists
module.exports.getListeners = getListeners
module.exports.getUniqueListeners = getUniqueListeners
module.exports.numberOfListerners = numberOfListerners
module.exports.numberOfUniqueListerners = numberOfUniqueListerners
module.exports.realNumberOfListerners = realNumberOfListerners
module.exports.realNumberOfUniqueListerners = realNumberOfUniqueListerners
module.exports.getPreBuffer = getPreBuffer
module.exports.getPastMedatada = getPastMedatada
module.exports.configFileInfo = configFileInfo
module.exports.streamID = streamID
module.exports.endStream = endStream
module.exports.hlsPool = hlsPool
module.exports.hlsIndexes = hlsIndexes
module.exports.hlsLastHit = hlsLastHit
module.exports.hlsDeleteCount = hlsDeleteCount
