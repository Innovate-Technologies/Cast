if (global.config.geolock && global.config.geolock.enabled && !global.maxmind) {
    global.maxmind = require("maxmind")
    if (!global.maxmind.init(config.geolock.maxmindDatabase)) {
        console.log("Error loading Maxmind Database")
    }
}

export function isAllowed(ip) {
    if (typeof global.config.geolock === "undefined" || !global.config.geolock.enabled) {
        return true
    }
    let ipLocation = global.maxmind.getLocation(ip)
    let isWhilelistMode = global.config.geolock.mode === "whitelist"
    if (!ipLocation) {
        return isWhilelistMode
    }
    if (global.config.geolock.countryCodes.indexOf(ipLocation.countryCode) === -1) {
        return !isWhilelistMode
    }
    return isWhilelistMode
}
