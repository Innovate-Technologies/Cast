import * as SHOUTcast from "./shoutcast.js"
import * as metadata from "./metadata.js"
import * as icecast from "./icecast.js"

export const shoutcastListener = (port) => {
    if (port && port > 0) {
        metadata.listenOn(port)
        SHOUTcast.listenOn(port + 1)
    }
}

export const icecastListener = (port) => {
    if (port && port > 0) {
        icecast.listenOn(port)
    }
}
