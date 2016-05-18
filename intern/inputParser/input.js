import * as SHOUTcast from "./shoutcast.js"
import * as metadata from "./metadata.js"

export const shoutcastListener = (port) => {
    metadata.listenOn(port)
    SHOUTcast.listenOn(port + 1)
}
