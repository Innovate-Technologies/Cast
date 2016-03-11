import SHOUTcast from "./shoutcast.js"
import metadata from "./metadata.js"

export const SHOUTcastListener = (port) => {
    metadata.listenOn(port)
    SHOUTcast.listenOn(port + 1)
}
