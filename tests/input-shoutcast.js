import test from "ava"
import sinon from "sinon"
import tcp from "net"

test.serial.cb("Test connect with incorrect password", t => {
    global.streams = {}
    const shoutcastInput = require("../intern/inputParser/shoutcast.js")
    t.plan(1)

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = shoutcastInput.listenOn(8000)
    const socket = tcp.connect({
        port: 8000,
        host: "127.0.0.1",
    })

    socket.write("incorrect\n")

    socket.on("data", (data) => {
        t.is(data.toString(), "invalid password\n")
        listener.close()
        t.end()
    })

})


test.serial.cb("Test connect with correct password but stream in use", t => {
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(true);
    const shoutcastInput = require("../intern/inputParser/shoutcast.js")
    t.plan(1)

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = shoutcastInput.listenOn(8000)
    const socket = tcp.connect({
        port: 8000,
        host: "127.0.0.1",
    })

    socket.write("correct\n")

    socket.on("data", (data) => {
        t.is(data.toString(), "Other source is connected\n")
        listener.close()
        t.end()
    })

})

test.serial.cb("Test connect with correct password and headers after OK2", t => {
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(false);
    global.streams.addStream = (stream, info) => {
        t.is(info.name, "test")
        t.is(info.type, "audio/mpeg")
        t.is(info.bitrate, "128")

        listener.close()
        clearInterval(sendInterval)

        t.end()
    }
    const shoutcastInput = require("../intern/inputParser/shoutcast.js")

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = shoutcastInput.listenOn(8000)
    const socket = tcp.connect({
        port: 8000,
        host: "127.0.0.1",
    })

    socket.write("correct\n")

    let messageCount = 0
    let sendInterval = null

    socket.on("data", (data) => {
        messageCount++
        if (messageCount === 1) {
            t.is(data.toString(), "OK2\r\nicy-caps:11\r\n\r\n")
            socket.write("icy-name:test\ncontent-type:audio/mpeg\nicy-br:128\n\n")
            sendInterval = setInterval(() => { socket.write("icy-name:test\ncontent-type:audio/mpeg\nicy-br:128\n\n") }, 500)
        }
    })

})

test.serial.cb("Test connect with correct password and headers before OK2", t => {
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(false);
    global.streams.addStream = (stream, info) => {
        t.is(info.name, "test")
        t.is(info.type, "audio/mpeg")
        t.is(info.bitrate, "128")

        listener.close()
        clearInterval(sendInterval)

        t.end()
    }
    const shoutcastInput = require("../intern/inputParser/shoutcast.js")

    global.streams.streamPasswords = {
        correct: "stream",
    }
    const listener = shoutcastInput.listenOn(8000)
    const socket = tcp.connect({
        port: 8000,
        host: "127.0.0.1",
    })

    socket.write("correct\n")
    socket.write("icy-name:test\ncontent-type:audio/mpeg\nicy-br:128\n\n")

    let messageCount = 0
    let sendInterval = null

    socket.on("data", (data) => {
        messageCount++
        if (messageCount === 1) {
            t.is(data.toString(), "OK2\r\nicy-caps:11\r\n\r\n")
            sendInterval = setInterval(() => { socket.write("icy-name:test\ncontent-type:audio/mpeg\nicy-br:128\n\n") }, 500)
        }
    })

})
