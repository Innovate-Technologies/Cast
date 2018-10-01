import stream from "stream"
import EventEmitter from "events"
import _ from "underscore"

/*
    StreamLayers is responsible for handling multiple input streams.
    It generates an output stream which piped the last added stream
*/
export default class StreamLayers {

    name = ""

    streams = []
    outStream

    outStreamIsRunning = false

    events

    constructor(name) {
        this.name = name
        this.events = new EventEmitter()
    }

    input(inputStream) {
        this.streams.push(inputStream)
        this.handleOnEnd(inputStream)
        this.events.emit("newStream", stream)
        if (!this.outStreamIsRunning) {
            this.outStream = new stream.PassThrough();
            this.outStream.setMaxListeners(0); // set soft max to prevent leaks

            this.outStreamIsRunning = true
            this.relayToOut()
        }
    }

    handleOnEnd(stream) {
        stream.on("end", () => {
            this.streams = _.without(this.streams, stream);
            this.events.emit("endStream", stream)
            if (this.streams.length === 0) {
                this.outStream.destroy()
                this.outStreamIsRunning = false
                global.streams.removeStream(this.name)
            } else {
                this.events.emit("newStream")
            }
        })
    }

    relayToOut() {
        const handler = (data) => {
            this.outStream.write(data)
        }
        let stream = this.streams[this.streams.length-1]
        stream.on("data", handler)
        this.events.on("newStream", () => {
            stream.removeListener("data", handler)
            stream = this.streams[this.streams.length-1]
            stream.on("data", handler)
        })
    }

    getStream() {
        return this.outStream
    }

    endAll() {
        this.outStreamIsRunning = false
        for (let stream of this.streams) {
            stream.destroy()
        }
    }

}