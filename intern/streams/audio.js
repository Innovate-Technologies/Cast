import stream from "stream"

// General Audio Handler for AAC ADTS and MP3
export default class AudioHandler {

    // needed by othe compoments
    prebuffer = []
    throttleStream

    // internal
    rateLimitInterval
    inputStream
    rateLimitBuffer

    constructor() {
        this.throttleStream = new stream.PassThrough();
        this.throttleStream.setMaxListeners(0); // set soft max to prevent leaks
    }

    input(inputStream) {
        this.inputStream = inputStream
        if (config.rateLimiting) {
            inputStream.on("data", (chunk) => {
                if (!this.rateLimitBuffer) {
                    this.rateLimitBuffer = []
                }
                this.rateLimitBuffer.push(chunk)
            });

            rateLimitInterval = setInterval(() => {
                this.throttleStream.write(Buffer.concat(this.rateLimitBuffer))
                this.rateLimitBuffer = []
            }, 500)
        } else {
            inputStream.pipe(this.throttleStream);
        }

        // start workers
        this.preBufferWorker()
        this.endWorker()
    }

    preBufferWorker() {
        this.throttleStream.on("data", (chunk) => {
            const newPreBuffer = []
            const currentLength = this.prebuffer.length
            for (let i = (config.rateLimiting ? 10 : 100); i > 0; i--) {
                if (this.prebuffer.hasOwnProperty(currentLength - i)) {
                    newPreBuffer.push(this.prebuffer[currentLength - i])
                }
            }
            newPreBuffer.push(chunk)
            this.prebuffer = newPreBuffer
        })
    }

    endWorker() {
        this.inputStream.on("end", () => {
            streamPreBufferprebuffer = ""
            if (config.rateLimiting) {
                this.rateLimitBuffer = []
                clearInterval(this.rateLimitInterval)
            }
        })
    }

    getStream() {
        return this.throttleStream
    }

}