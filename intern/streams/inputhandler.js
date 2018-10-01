import { shoutcastListener, icecastListener } from "../inputParser/input.js"
import * as relayHandler from "./relayhandler"

export default (conf) => {
    for (let id in conf.streams) {
        if (conf.streams.hasOwnProperty(id)) {
            global.streams.configFileInfo[conf.streams[id].stream] = conf.streams[id]
            global.streams.streamID[id] = conf.streams[id].stream
            if (conf.streams[id].primary) {
                global.streams.primaryStream = conf.streams[id].stream
            }
            if (conf.streams[id].relay) {
                // relay the stream
                relayHandler.relayStream(conf.streams[id].stream, conf.streams[id].relay)
                if (conf.streams[id].password) {
                    global.streams.streamPasswords[conf.streams[id].password] = conf.streams[id].stream
                }
            } else {
                // add to password list to accept input
                global.streams.streamPasswords[conf.streams[id].password] = conf.streams[id].stream
            }
        }
    }
    shoutcastListener(conf.input.SHOUTcast)
    icecastListener(conf.input.Icecast)
}
