import SHOUTcast from "./shoutcast.js"
import metadata from "./metadata.js"

var SHOUTcastListener = (port) => {
    metadata.listenOn(port)
    SHOUTcast.listenOn(port + 1)
}

module.exports.SHOUTcastListener = SHOUTcastListener
