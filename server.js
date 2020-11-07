if (!process.env.COMPILED) {
    require("babel-polyfill");
    require("babel-register");
}
require("colors");
process.binding("http_parser").HTTPParser = require("http-parser-js").HTTPParser; // fixes bug in http client

console.log("Cast 1.0 ".rainbow);

global.localdir = __dirname;
global.cast = {};

var fs = require("fs");
var YAML = require('yaml')
try {
    if (process.argv.length > 2 && fs.statSync(process.argv[process.argv.length - 1]).isFile()) {
        var configFile = process.argv[process.argv.length - 1]
    } else if (fs.existsSync(global.localdir + "/config.yaml")) {
        configFile = global.localdir + "/config.yaml"
    }
    global.config = YAML.parse(fs.readFileSync(configFile || global.localdir + "/config.json", "utf8"));
} catch (error) {
    console.error("Failed to load the config file. Are you sure you have a valid config.json or config.yaml?".red);
    console.error("The error was:", error.message.grey);
    process.exit(1);
}

try {
    global.cast.version = JSON.parse(fs.readFileSync(global.localdir + "/package.json", "utf8")).version;
} catch (error) {
    console.error("Failed to read Cast version. Are you sure you have a valid package.json?".red);
    console.error("The error was:", error.message.grey);
    process.exit(1);
}

var loadCast = () => {
    global.app = require("./intern/HTTP/server.js");
    require("./hooks/hooks.js"); // load in hooks
};

if (global.config.startUpScript) { // run a script before going on eg. to load the configuration from a network disk
    var start = require(global.localdir + "/start.js");
    start(function (err,res) {
        if (err){
            console.error(err)
            process.exit(1);
        }
        loadCast();
    })
} else {
    loadCast();
}

process.on("SIGTERM", () => {
      process.exit(0);
});
