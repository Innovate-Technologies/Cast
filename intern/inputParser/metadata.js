let app = require("express")()

export const listenOn = (port) => {
    require("http").createServer(app).listen(port)
}

app.get("/admin.cgi", (req, res) => {
    if (!req.query || req.query.mode !== "updinfo") {
        res.status(400).send("Not supported")
        return
    }
    if (!streams.streamPasswords.hasOwnProperty(req.query.pass)) {
        res.status(401).send("Invalid password")
        return
    }

    const stream = streams.streamPasswords[req.query.pass]

    if (req.query.mode === "updinfo") {

        if (req.query.song === "Advert: - Advert:") {
            // Never mind... SHOUTcast is better for this
        }
        if (req.query.song && req.query.song.indexOf("-") >= 0) {
            if (!req.query.title) {
                req.query.title = req.query.song.split("-")[1].trim()
            }
            if (!req.query.artist) {
                req.query.artist = req.query.song.split("-")[0].trim()
            }
        }
        let meta = {
            genre: req.query.genre,
            title: req.query.title,
            artist: req.query.artist,
            song: req.query.song || "",
            date: req.query.date,
            album: req.query.album,
            djname: req.query.djname,
        }
        meta.stream = stream
        streams.setStreamMetadata(stream, meta)
        return res.send("ok")
    }
})

app.get("/", (req, res) => {
    res.send("You hit the Cast metadata input server. If you are looking for good music try to remove the port from the URL")
})

// this is here to prove that we're an "actual SHOUTcast server"
app.get("/7.html", (req, res) => {
    res.send("0,0,0,99999,0,0,")
})
