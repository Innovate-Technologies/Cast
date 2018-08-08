import url from "url"
import stream from "stream"
import icy from "./icy"

export const relayStream = (desinationStream, relayUrl) => {
    let http
    let gotData = false;
    const urlInfo = url.parse(relayUrl)
    if (urlInfo.protocol === "https:") {
        http = require("https")
    } else {
        http = require("http")
    }
    http.get({
        hostname: urlInfo.hostname,
        port: urlInfo.port,
        path: urlInfo.path,
        headers: {
            "user-agent": `Cast/${global.cast.version}`,
            "icy-metadata": 1,
        },
    }, (res) => {
        let useicy = false;
        let metadataint = 0;
        if (!res.headers["content-type"] || (res.headers["content-type"].indexOf("audio/") !== 0 && res.headers["content-type"] !== "application/ogg")) {
            setTimeout(relayStream, 10000, desinationStream, relayUrl)
            return console.log(`${relayUrl} doesn't serve audio`)
        }
        if (res.headers["icy-metaint"]) {
            useicy = true
            metadataint = parseInt(res.headers["icy-metaint"], 10)
        }

        let inputStream = null
        const outputStream = new stream.PassThrough();
        if (useicy) {
            inputStream = new icy.IcecastReadStack(res, metadataint)
        } else {
            inputStream = res
        }

        streams.addStream(outputStream, {
            name: res.headers["icy-name"],
            stream: desinationStream,
            type: res.headers["content-type"],
            bitrate: res.headers["icy-br"] || 0,
            url: res.headers["icy-url"],
            genre: res.headers["icy-genre"],
            directoryListed: res.headers["icy-pub"] === 1,
        })

        inputStream.on("data", (data) => {
            gotData = true
            outputStream.write(data)
        })
        inputStream.on("metadata", (data) => {
            const parsedData = icy.parseMetadata(data)
            let title = ""
            let artist = ""
            if (parsedData.StreamTitle && parsedData.StreamTitle.indexOf("-") >= 0) {
                title = parsedData.StreamTitle.split("-")[1].trim()
                artist = parsedData.StreamTitle.split("-")[0].trim()
            }
            let meta = {
                stream: desinationStream,
                title,
                artist,
                song: parsedData.StreamTitle,
            }
            streams.setStreamMetadata(desinationStream, meta)
        })

        inputStream.on("end", () => {
            outputStream.end()
            streams.removeStream(desinationStream)
            setTimeout(relayStream, 10000, desinationStream, relayUrl)
        })

        const checkInterval = setInterval(() => { // check every 5 seconds to see if we got new data
            if (!gotData) {
                inputStream.destroy()
                clearInterval(checkInterval)
            }
            gotData = false
        }, 5000)
    }).on("error", (e) => {
        console.error(e);
    });
}

