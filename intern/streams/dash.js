import fs from "fs"
import util from "util"
import tmp from "tmp"
import rimraf from "rimraf"
import { spawn } from "child_process"

const unlink = util.promisify(fs.unlink)
const readdir = util.promisify(fs.readdir)

const KEEP_SEGMENTS = 20
const chunkRegex = new RegExp(/chunk-stream0-(.*).m4s/)

export default class DASHHandler {

    tempPath = ""
    tmpobj
    inputStream
    process
    name = ""

    oldestChunk = 1
    chunkTimer

    constructor(inputStream, name) {
        this.tmpobj = tmp.dirSync();
        this.tempPath = this.tmpobj.name

        this.inputStream = inputStream
        this.name = name
    }

    /*
        We use ffmpeg as the best way to implement this atm.
        Transmuxing in JS will take more resources and currently there is no good library available
        In order to move fast we decided to let ffmpeg do the job here in a subprocess.
    */

    start() {
        this.process = spawn('ffmpeg', [
            "-y",
            "-i", "-",
            "-codec", "copy",
            "-live", "1",
            "-use_timeline", `0`,
            "-media_seg_name", "chunk-stream$RepresentationID$-$Number$.m4s",
            "-remove_at_exit", "1",
            "-f", "dash",
            "-metadata", `title=${this.name}`,
            `${this.tempPath}/dash.mpd`
        ],
        { 
            stdio: ['pipe', null, process.stderr]
        });
        
        this.process.stdin.on('error', (...args) => { console.log('stdin err dash', args); });

        //this.inputStream.pipe(this.process.stdin);
        this.inputStream.on("data", data => this.process.stdin.write(data))
        this.chunkTimer = setInterval(this.deleteOldChunks.bind(this), 10000)
    }

    stop() {
        this.process.kill()
        clearInterval(this.chunkTimer)
        rimraf(this.tempPath, () => {})
    }

    async deleteOldChunks() {
        const files = await readdir(this.tempPath)
        const chunkList = []

        let highest = 0
        let lowest = Infinity

        for (let file of files) {
            if (file.match(chunkRegex)) {
                chunkList.push(file)
            }
        }

        for (let chunk of chunkList) {
            const match = chunkRegex.exec(chunk);
            const number = parseInt(match[1], 10);
            if (number > highest) {
                highest = number
            }
            if (number < lowest) {
                lowest = number
            }
        }
        
        if (highest - KEEP_SEGMENTS > lowest) {
            this.oldestChunk = (highest - KEEP_SEGMENTS )
            for (let i = lowest; i < (highest - KEEP_SEGMENTS ); i++) {
                await unlink(`${this.tempPath}/chunk-stream0-${i}.m4s`)
            }
        }
    }
}