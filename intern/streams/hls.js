import tmp from "tmp"
import { spawn } from "child_process"


export default class HLSHandler {

    tempPath = ""
    tmpobj
    inputStream
    process

    constructor(inputStream) {
        this.tmpobj = tmp.dirSync();
        this.tempPath = this.tmpobj.name

        this.inputStream = inputStream
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
            "-hls_flags", "delete_segments",
            `${this.tempPath}/hls.m3u8`
        ],
        { 
            stdio: ['pipe', process.stdout, process.stdout]
        });
    
        this.inputStream.pipe(this.process.stdin);
    }

    stop() {
        this.process.kill()
        this.tmpobj.removeCallback()
    }
}