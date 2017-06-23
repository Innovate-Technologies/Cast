import test from "ava"
import sinon from "sinon"
import express from "express"
import api from "../intern/HTTP/apps/api.js"
import request from "supertest"


const makeApp = () => {
    const app = express();
    return app;
}

test("test version", async t => {
    global.cast = { version: 1.0 }
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/version")

    t.is(res.status, 200);
    t.is(res.body.version, global.cast.version);
})

test.serial("test get pastmetadata", async t => {
    const testMetadata = [
        {
            "title": "Extinction",
            "artist": "Epic Soul Factory",
            "song": "Epic Soul Factory - Extinction",
            "album": "Epic Soul Factory - Volume 2",
            "stream": "128kbps",
        },
        {
            "title": "Arab Trade",
            "artist": "Epic Soul Factory",
            "song": "Epic Soul Factory - Arab Trade",
            "album": "Epic Soul Factory - Xpansion Edition",
            "stream": "128kbps",
        },
    ]
    global.streams = {}
    global.streams.getPastMedatada = sinon.stub().withArgs("128kbps").returns(testMetadata)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/past-metadata")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testMetadata));
})

test.serial("test get current metadata", async t => {
    const testMetadata = {
        "title": "Extinction",
        "artist": "Epic Soul Factory",
        "song": "Epic Soul Factory - Extinction",
        "album": "Epic Soul Factory - Volume 2",
        "stream": "128kbps",
    }
    global.streams = {}
    global.streams.getStreamMetadata = sinon.stub().withArgs("128kbps").returns(testMetadata)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/current-metadata")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testMetadata));
})

test.serial("test get active streams", async t => {
    const testMetadata = [
        "stream name",
    ]
    global.streams = {}
    global.streams.getActiveStreams = sinon.stub().returns(testMetadata)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/list-active-streams")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testMetadata));
})

test.serial("test get listeneners", async t => {
    const testListeners = [
        {
            "stream": "128kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 17,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]
    global.config = { apikey: "valid" }
    global.streams = {}
    global.streams.getListeners = sinon.stub().withArgs("128kbps").returns(testListeners)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/valid/listeners")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testListeners));
})

test.serial("test get listeneners of all streams", async t => {
    const testListeners = [
        {
            "stream": "128kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 17,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]

    const testListeners2 = [
        {
            "stream": "64kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 18,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]

    global.config = { apikey: "valid" }
    global.streams = {}
    global.streams.getActiveStreams = sinon.stub().returns([ "128kbps", "64kbps" ])
    global.streams.getListeners = sinon.stub()
    global.streams.getListeners.withArgs("64kbps").returns(testListeners2)
    global.streams.getListeners.withArgs("128kbps").returns(testListeners)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/*/valid/listeners")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testListeners.concat(testListeners2)));
})

test.serial("test listeners with invalid key", async t => {
    global.config = { apikey: "valid" }
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/invalid/listeners")

    t.is(res.status, 400);
})

test.serial("test unique-listeners with invalid key", async t => {
    global.config = { apikey: "valid" }
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/invalid/unique-listeners")

    t.is(res.status, 400);
})

test.serial("test get unique-listeneners", async t => {
    const testListeners = [
        {
            "stream": "128kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 17,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]
    global.config = { apikey: "valid" }
    global.streams = {}
    global.streams.getUniqueListeners = sinon.stub().withArgs("128kbps").returns(testListeners)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/valid/unique-listeners")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testListeners));
})

test.serial("test get unique-listeneners of all streams", async t => {
    const testListeners = [
        {
            "stream": "128kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 17,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]

    const testListeners2 = [
        {
            "stream": "64kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 18,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]

    global.config = { apikey: "valid" }
    global.streams = {}
    global.streams.getActiveStreams = sinon.stub().returns([ "128kbps", "64kbps" ])
    global.streams.getUniqueListeners = sinon.stub()
    global.streams.getUniqueListeners.withArgs("64kbps").returns(testListeners2)
    global.streams.getUniqueListeners.withArgs("128kbps").returns(testListeners)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/*/valid/unique-listeners")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), JSON.stringify(testListeners.concat(testListeners2)));
})

test.serial("test listenersmap", async t => {
    const testListeners = [
        {
            "stream": "128kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 17,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]

    global.config = { apikey: "valid", geoservices: { enabled: true } }
    global.streams = {}
    global.streams.getListeners = sinon.stub().withArgs("128kbps").returns(testListeners)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/valid/listenersmap")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[9.05,59.7681]},"properties":{"name":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36","ip":"2a02:1810:40b:fake::6af8"}}]}');
})

test.serial("test listenersmap for an streams", async t => {
    const testListeners = [
        {
            "stream": "128kbps",
            "ip": "2a02:1810:40b:fake::6af8",
            "client": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "starttime": 1498212250, // unix timestamp
            "hls": false,
            "id": 17,
            "country": "Belgium",
            "countryCode": "BE",
            "location": {"latitude": 59.7681, "longitude": 9.05, "accuracy": 100},
        },
    ]

    global.config = { apikey: "valid", geoservices: { enabled: true } }
    global.streams = {}
    global.streams.getListeners = sinon.stub().withArgs("128kbps").returns(testListeners)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/valid/listenersmap")

    t.is(res.status, 200);
    t.is(JSON.stringify(res.body), '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[9.05,59.7681]},"properties":{"name":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36","ip":"2a02:1810:40b:fake::6af8"}}]}');
})

test.serial("test listenersmap with invalid key", async t => {
    global.config = { apikey: "valid" }
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/invalid/listenersmap")

    t.is(res.status, 400);
})

test.serial("test listenersmap with geoservices disabled", async t => {
    global.config = { apikey: "valid" }
    const app = makeApp()
    api(app)
    const res = await request(app)
        .get("/api/128kbps/valid/listenersmap")

    t.is(res.status, 500);
})

test.serial("test end with invalid key", async t => {
    global.config = { apikey: "valid" }
    const app = makeApp()
    api(app)
    const res = await request(app)
        .post("/api/invalid/128kbps/end")

    t.is(res.status, 400);
})

test.serial("test end with stream not un use", async t => {
    global.config = { apikey: "valid" }
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(false)
    const app = makeApp()
    api(app)
    const res = await request(app)
        .post("/api/valid/128kbps/end")

    t.is(res.status, 400);
})

test.serial("test end", async t => {
    global.config = { apikey: "valid" }
    global.streams = {}
    global.streams.isStreamInUse = sinon.stub().returns(true)
    global.streams.endStream = sinon.spy()
    const app = makeApp()
    api(app)
    const res = await request(app)
        .post("/api/valid/128kbps/end")

    t.is(res.status, 200);
    t.is(res.body.result, "okay")
    t.is(global.streams.endStream.calledWith("128kbps"), true)
})
