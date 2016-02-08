let fs = require("fs");
let hooksPerAction = {};

// hooksPerAction={action:[function(options)]} //as of now no callbacks

module.exports.add = function (module, func) {
    if (!hooksPerAction.hasOwnProperty(module)) {
        hooksPerAction[module] = [];
    }
    hooksPerAction[module].push(func);
};

module.exports.runHooks = function (module, options) {
    if (!hooksPerAction.hasOwnProperty(module) || hooksPerAction[module].length === 0) {
        return;
    }
    for (let action of hooksPerAction[module]) {
        action(options)
    }
};

module.exports.loadModules = function () {
    var actionModules = fs.readdirSync(global.localdir + "/hooks/action");
    for (let module of actionModules) {
        require(global.localdir + "/hooks/action/" + module);
    }
};
