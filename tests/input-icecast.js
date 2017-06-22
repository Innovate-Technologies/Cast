import test from "ava"
import sinon from "sinon"
import tcp from "net"

test.serial.cb("Test connect with PUT and incorrect password", t => {
    global.streams = {}
    global.streams.removeStream = ()=>{}
    const icecastInput = require("../intern/inputParser/icecast.js")
    t.plan(1)

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = icecastInput.listenOn(9000)
    const socket = tcp.connect({
        port: 9000,
        host: "127.0.0.1",
    })

    socket.write("PUT /stream.mp3 HTTP/1.1\n")
    socket.write(`Authorization: Basic c291cmNlOmluY29ycmVjdA== \n
                Content-Type: audio/mpeg \n
                User-Agent: unit-test/1.1 \n
                Ice-Name: UnitFM \n
    `)

    socket.on("data", (data) => {
        t.is(data.toString(), "HTTP/1.1 401 You need to authenticate\n\n")
        listener.close()
        t.end()
    })

})

test.serial.cb("Test connect with PUT and incorrect password", t => {
    global.streams = {}
    global.streams.removeStream = ()=>{}
    global.streams.isStreamInUse = sinon.stub().returns(true);
    const icecastInput = require("../intern/inputParser/icecast.js")
    t.plan(1)

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = icecastInput.listenOn(9000)
    const socket = tcp.connect({
        port: 9000,
        host: "127.0.0.1",
    })

    socket.write("PUT /stream.mp3 HTTP/1.1\n")
    socket.write(`Authorization: Basic c291cmNlOmNvcnJlY3Q= \n
                Content-Type: audio/mpeg \n
                User-Agent: unit-test/1.1 \n
                Ice-Name: UnitFM \n
    `)

    socket.on("data", (data) => {
        t.is(data.toString(), "HTTP/1.1 403 Mountpoint in use\n\n")
        listener.close()
        t.end()
    })

})

test.serial.cb("Test connect with PUT and incorrect file type", t => {
    global.streams = {}
    global.streams.removeStream = ()=>{}
    global.streams.isStreamInUse = sinon.stub().returns(false);
    const icecastInput = require("../intern/inputParser/icecast.js")
    t.plan(1)

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = icecastInput.listenOn(9000)
    const socket = tcp.connect({
        port: 9000,
        host: "127.0.0.1",
    })

    socket.write("PUT /stream.mp3 HTTP/1.1\n")
    socket.write(`Authorization: Basic c291cmNlOmNvcnJlY3Q= \n
                Content-Type: text/pdf \n
                User-Agent: unit-test/1.1 \n
                Ice-Name: UnitFM \n
    `)

    socket.on("data", (data) => {
        t.is(data.toString(), "HTTP/1.1 403 Content-type not supported\n\n")
        listener.close()
        t.end()
    })

})

test.serial.cb("Test connect with correct password and PUT", t => {
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(false);
    global.streams.removeStream = ()=>{}
    global.streams.addStream = (stream, info) => {
        t.is(info.name, "UnitFM")
        t.is(info.type, "audio/mpeg")
        t.is(info.bitrate, "128")
        t.is(info.url, "https://getca.st")
        t.is(info.genre, "Rock")

        listener.close()
        clearInterval(sendInterval)

        t.end()
    }
    global.streams.streamPasswords = {
        correct: "stream",
    }
    const icecastInput = require("../intern/inputParser/icecast.js")
    const listener = icecastInput.listenOn(9000)
    const socket = tcp.connect({
        port: 9000,
        host: "127.0.0.1",
    })

    socket.write("PUT /stream.mp3 HTTP/1.1\n")
    socket.write(`Authorization: Basic c291cmNlOmNvcnJlY3Q= \n
                Content-Type: audio/mpeg \n
                User-Agent: unit-test/1.1 \n
                Ice-Name: UnitFM \n
                Ice-URL: https://getca.st \n
                Ice-Genre: Rock \n
                Ice-Bitrate: 128 \n
    `)

    let messageCount = 0
    let sendInterval = null

    socket.on("data", (data) => {
        messageCount++
        if (messageCount === 1) {
            t.is(data.toString(), "HTTP/1.1 200 OK\n\n")
            sendInterval = setInterval(() => { socket.write("mp3333333333333") }, 100)
        }
    })

})

test.serial.cb("Test connect with correct password and SOURCE", t => {
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(false);
    global.streams.removeStream = ()=>{}
    global.streams.addStream = (stream, info) => {
        t.is(info.name, "UnitFM")
        t.is(info.type, "audio/mpeg")
        t.is(info.bitrate, "128")
        t.is(info.url, "https://getca.st")
        t.is(info.genre, "Rock")

        listener.close()
        clearInterval(sendInterval)

        t.end()
    }
    global.streams.streamPasswords = {
        correct: "stream",
    }
    const icecastInput = require("../intern/inputParser/icecast.js")
    const listener = icecastInput.listenOn(9000)
    const socket = tcp.connect({
        port: 9000,
        host: "127.0.0.1",
    })

    socket.write("SOURCE /stream.mp3 HTTP/1.1\n")
    socket.write(`Authorization: Basic c291cmNlOmNvcnJlY3Q= \n
                Content-Type: audio/mpeg \n
                User-Agent: unit-test/1.1 \n
                Ice-Name: UnitFM \n
                Ice-URL: https://getca.st \n
                Ice-Genre: Rock \n
                Ice-Bitrate: 128 \n
    `)

    let messageCount = 0
    let sendInterval = null

    socket.on("data", (data) => {
        messageCount++
        if (messageCount === 1) {
            t.is(data.toString(), "HTTP/1.1 200 OK\n\n")
            sendInterval = setInterval(() => { socket.write("mp3333333333333") }, 100)
        }
    })

})


test.serial.cb("Test connect with correct password and PUT and 100-continue", t => {
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(false);
    global.streams.removeStream = ()=>{}
    global.streams.addStream = (stream, info) => {
        t.is(info.name, "UnitFM")
        t.is(info.type, "audio/mpeg")
        t.is(info.bitrate, "128")
        t.is(info.url, "https://getca.st")
        t.is(info.genre, "Rock")

        listener.close()
        clearInterval(sendInterval)

        t.end()
    }
    global.streams.streamPasswords = {
        correct: "stream",
    }
    const icecastInput = require("../intern/inputParser/icecast.js")
    const listener = icecastInput.listenOn(9000)
    const socket = tcp.connect({
        port: 9000,
        host: "127.0.0.1",
    })

    socket.write("PUT /stream.mp3 HTTP/1.1\n")
    socket.write(`Authorization: Basic c291cmNlOmNvcnJlY3Q= \n
                Content-Type: audio/mpeg \n
                User-Agent: unit-test/1.1 \n
                Ice-Name: UnitFM \n
                Ice-URL: https://getca.st \n
                Ice-Genre: Rock \n
                Ice-Bitrate: 128 \n
                Expect: 100-continue \n
    `)

    let messageCount = 0
    let sendInterval = null

    socket.on("data", (data) => {
        messageCount++
        if (messageCount === 1) {
            t.is(data.toString(), "HTTP/1.1 100 Continue\n\n")
            sendInterval = setInterval(() => { socket.write("mp3333333333333") }, 100)
        }
    })

})