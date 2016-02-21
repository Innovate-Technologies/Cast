import fs from "fs"
let app = require("express")()

global.io = require("socket.io")

if (config.httpsPort !== 0) {
    let https = require("http2").createServer({
        key: fs.readFileSync(config.httpsKey),
        cert: fs.readFileSync(config.httpsCert),
    }, app).listen(global.config.httpsPort)
    global.io.attach(https)
}
if (config.httpPort !== 0) {
    let http = require("http").createServer(app).listen(config.httpPort);
    global.io.attach(http)
}

import streamOutput from "../streams/httphandler.js"
import streamInput from "../streams/inputhandler.js"

if (config.trustProxy) {
    app.enable("trust proxy");
}

app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "Cast 1.0")
    res.setHeader("Server", "Cast/1.0")
    next()
})

for (let file of fs.readdirSync(global.localdir + "/intern/HTTP/apps/")) {
    require(global.localdir + "/intern/HTTP/apps/" + file)(app)
}
for (let file of fs.readdirSync(global.localdir + "/hooks/http/")) {
    require(global.localdir + "/hooks/http/" + file)(app)
}

streamOutput(app)
streamInput(global.config)

module.exports = app
