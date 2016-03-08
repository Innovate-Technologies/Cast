module.exports = (app) => {

    app.get("/status-json.xsl", (req, res) => {
        var streams = global.streams.getActiveStreams()
        var iceStreams = []
        for (let stream of streams) {
            iceStreams.push({
                "audio_info": "bitrate=" + (global.streams.getStreamConf(stream).bitrate) + ";",
                "bitrate": global.streams.getStreamConf(streams).bitrate,
                "channels": 2, // we guess so, there is currently not format reading
                "genre": global.streams.getStreamConf(stream).genre,
                "listener_peak": global.streams.numberOfListerners(stream),
                "listeners": global.streams.numberOfListerners(stream),
                "listenurl": global.config.hostname + "/streams/" + stream,
                "samplerate": 44100, // we guess so, there is currently not format reading
                "server_description": "",
                "server_name": global.streams.getStreamConf(stream).name,
                "server_type": global.streams.getStreamConf(stream).type,
                "server_url": global.streams.getStreamConf(stream).url,
                "stream_start": "Fri, 03 Jul 2015 13:13:18 -0400", // leaving that for now
                "stream_start_iso8601": "2015-07-03T13:13:18-0400", // leaving that for now
                "title": global.streams.getStreamMetadata(stream).song,
                "dummy": null,
            })
        }

        if (iceStreams.length === 1) {
            iceStreams = iceStreams[0]
        }

        res.json({
            "icestats": {
                "admin": "nobody@getca.st",
                "host": global.config.hostname.replace("http://", "").replace("https://", ""),
                "location": "Cloud",
                "server_id": "Cast 1.0",
                "server_start": "Fri, 03 Jul 2015 09:09:19 -0400", // leaving that for now
                "server_start_iso8601": "2015-07-03T09:09:19-0400", // leaving that for now
                "source": iceStreams,
            },
        })

    })
}
