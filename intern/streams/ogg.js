import stream from "stream"
import ogg from "ogg"

// General Audio Handler for OGG encapsulated media, please do not send Theora
export default class OGGHandler {

    // needed by othe compoments
    prebuffer = [] // very important as this will eep the first packet
    
    // internal
    throttleStream
    inputStream
    oggStream

    decoder = new ogg.Decoder();
    encoder = new ogg.Encoder();

    gotFirst = false
    fistPacketBuffer

    constructor() {
        this.throttleStream = new stream.PassThrough();
        this.throttleStream.setMaxListeners(0); // set soft max to prevent leaks
        this.encoder.pipe(this.throttleStream)
    }

    input(inputStream) {
        this.inputStream = inputStream
        inputStream.pipe(this.decoder);
        
        this.decoder.on('stream', (stream) => {
            if (!this.oggStream) {
                this.oggStream = stream
            }
            const outStream = this.encoder.stream(stream.serialno);

            stream.on('page', (function (page) {
                outStream.flush()
            }).bind(this));

            // for each "packet" event, send the packet to the output stream untouched
            stream.on('packet', (function (packet) {
                if (!this.gotFirst) {
                    this.gotFirst = true
                    this.handleFirstPacket(packet)
                    return
                }
                outStream.packetin(packet)
            }).bind(this));

            this.endWorker()
        })
    }

    packetPreBufferWorker() {
        this.throttleStream.on("packet", (packet) => {
            const newPrebuffer = []
            newPrebuffer.push(this.fistPacketBuffer)
            const currentLength = this.packetPreBuffer.length
            for (let i = 300; i > 0; i--) {
                if (this.packetPreBuffer.hasOwnProperty(currentLength - i)) {
                    newPrebuffer.push(this.packetPreBuffer[currentLength - i])
                }
            }
            newPrebuffer.push(packet)
            this.prebuffer = newPrebuffer
        })
    }

    endWorker() {
        this.inputStream.on("end", () => {
            streampacketPreBufferpacketPreBuffer = ""
        })
    }

    handleFirstPacket(firstPacket) {
        const encoder = new ogg.Encoder();
        const outStream = encoder.stream(this.oggStream.serialno);
        outStream.packetin(firstPacket)

        encoder.on("data", (buf) => {
            this.prebuffer = [buf]

            this.throttleStream.write(buf) // send to early listeners
            this.fistPacketBuffer = buf //we need to re-use this
            setTimeout(this.packetPreBufferWorker.bind(this), 200) // start pre buffer after sure the event is gone
        })

        outStream.flush()
    }

    getStream() {
        return this.throttleStream
    }

}