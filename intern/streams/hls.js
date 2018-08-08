import tmp from "tmp"
import { spawn } from "child_process"
import rimraf from "rimraf"


export default class HLSHandler {

    tempPath = ""
    tmpobj
    inputStream
    process
    name = ""

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
            "-hls_time", "9",
            "-hls_segment_filename", `${this.tempPath}/seq%03d.ts`,
            "-hls_list_size", "5",
            "-hls_wrap", "5",
            "-hls_flags", "delete_segments+program_date_time",
            "-metadata", `title=${this.name}`,
            `${this.tempPath}/hls.m3u8`
        ],
        { 
            stdio: ['pipe', null, null]
        });
    
        this.inputStream.pipe(this.process.stdin);
    }

    stop() {
        this.process.kill()
        rimraf(this.tempPath, () => {})
    }
}