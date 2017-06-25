import test from "ava"
import sinon from "sinon"
import stream from "stream"
import EventEmitter from "events"
class Events extends EventEmitter {}


const testStreamInfo = {
    name: "test stream",
    stream: "128kbps",
    type: "audio/mpeg",
    bitrate: 128,
    url: "https://getca.st",
    genre: "Pop",
    directoryListed: true,
}

test.beforeEach("setup config", () => {
    global.config = {
        "streams": [{
            "stream": "128kbps",
            "password": "password",
        }],
    }
    global.streams = null
    global.streams = require("../intern/streams/streams.js")
    global.events = new Events();
})

test.serial("test addstream", t => {
    global.events.on("addStream", name => t.is(name, "128kbps"))

    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
})

test.serial("test addstream with null stream", t => {
    try {
        global.streams.addStream(null, {})
    } catch (error) {
        t.pass()
    }
})

test.serial("test getStreamConf", t => {
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)

    t.deepEqual(global.streams.getStreamConf("128kbps"), testStreamInfo)

})

test.serial("test removeStream", t => {
    global.events.on("removeStream", name => t.is(name, "128kbps"))

    global.streams.addStream(new stream.PassThrough(), testStreamInfo)

    global.streams.removeStream("128kbps")
})

test.serial("test isStreamInUse", t => {
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)

    t.is(global.streams.isStreamInUse("128kbps"), true)

    global.streams.removeStream("128kbps")

    t.is(global.streams.isStreamInUse("128kbps"), false)
})


test.serial("test getStreamMetadata with none available", t => {
    t.deepEqual(global.streams.getStreamMetadata("128kbps"), {})
})

test.serial("test getStreamMetadata", t => {
    t.plan(2)

    const meta = {
        genre: "test",
        title: "Song",
        artist: "Artist",
        song: "Artist - Song",
        album: "Album",
        djname: "DrO",
    }

    global.events.on("metadata", data => t.deepEqual(data, meta))

    global.streams.addStream(new stream.PassThrough(), testStreamInfo)

    global.streams.setStreamMetadata("128kbps", meta)

    t.deepEqual(global.streams.getStreamMetadata("128kbps"), meta)
})

test.serial("test getActiveStreams", t => {
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    t.deepEqual(global.streams.getActiveStreams(), [ "128kbps" ])
})

test.serial("test getActiveStreams and sort them", t => {
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    testStreamInfo.stream = "64kbps"
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    t.deepEqual(global.streams.getActiveStreams(), [ "64kbps", "128kbps" ])
})

test.serial("test listenerTunedIn", t => {
    t.plan(4)
    const now = Math.round((new Date()).getTime() / 1000)

    global.events.on("listenerTunedIn", info => t.deepEqual(info, {
        stream: "128kbps",
        ip: "::1",
        client: "Unit/1.1",
        starttime: now,
        hls: false,
        id: 1,
    }))
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    let id = global.streams.listenerTunedIn("128kbps", "::1", "Unit/1.1", now)
    t.is(id, 1)
    t.is(global.streams.getListeners("128kbps").length, 1)
    t.is(global.streams.numberOfListerners("128kbps"), 1)
})

test.serial("test listenerTunedOut", t => {
    const now = Math.round((new Date()).getTime() / 1000)

    global.events.on("listenerTunedOut", info => t.deepEqual(info, {
        stream: "128kbps",
        ip: "::1",
        client: "Unit/1.1",
        starttime: now,
        hls: false,
        id: 1,
    }))
    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    global.streams.listenerTunedOut("128kbps", 1)
})

test.serial("test no listeners", t => {
    t.is(global.streams.getListeners("128kbps").length, 0)
    t.is(global.streams.numberOfListerners("128kbps"), 0)
})

test.serial("test getUniqueListeners", t => {
    const now = Math.round((new Date()).getTime() / 1000)

    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    global.streams.listenerTunedIn("128kbps", "::1", "Unit/1.1", now)
    global.streams.listenerTunedIn("128kbps", "::1", "Unit/1.1", now)

    t.is(global.streams.numberOfListerners("128kbps"), 2)
    t.is(global.streams.getUniqueListeners("128kbps").length, 1)
})

test.serial("test hideListenerCount", t => {
    global.config.hideListenerCount = true
    const now = Math.round((new Date()).getTime() / 1000)

    global.streams.addStream(new stream.PassThrough(), testStreamInfo)
    global.streams.listenerTunedIn("128kbps", "::1", "Unit/1.1", now)

    t.is(global.streams.numberOfListerners("128kbps"), 0)
    t.is(global.streams.numberOfUniqueListerners("128kbps"), 0)
})
