import fs from "fs"
import EventEmitter from "events"
class Events extends EventEmitter {}

global.events = new Events();

var actionModules = fs.readdirSync(global.localdir + "/hooks/action");
for (let module of actionModules) {
    require(global.localdir + "/hooks/action/" + module);
}
