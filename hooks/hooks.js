let fs = require("fs");
let hooksPerAction = {};

// hooksPerAction={action:[function(options)]} //as of now no callbacks

export function add(module, func) {
    if (!hooksPerAction.hasOwnProperty(module)) {
        hooksPerAction[module] = [];
    }
    hooksPerAction[module].push(func);
}

export function runHooks(module, options) {
    if (!hooksPerAction.hasOwnProperty(module) || hooksPerAction[module].length === 0) {
        return;
    }
    hooksPerAction[module].forEach((action) => action(options));
}

export function loadModules() {
    var actionModules = fs.readdirSync(global.localdir + "/hooks/action");
    for (let module of actionModules) {
        require(global.localdir + "/hooks/action/" + module);
    }
}
