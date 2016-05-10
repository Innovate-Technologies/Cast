import SHOUTcast from "./shoutcast.js"
import metadata from "./metadata.js"

export const shoutcastListener = (port) => {
    metadata.listenOn(port)
    SHOUTcast.listenOn(port + 1)
}
