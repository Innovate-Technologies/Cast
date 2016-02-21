if (config.geolock && config.geolock.enabled && !maxmind) {
    global.maxmind = require("maxmind")
    if (!maxmind.init(config.geolock.maxmindDatabase)) {
        console.log("Error loading Maxmind Database")
    }
}

export function isAllowed(ip) {
    if (typeof config.geolock === "undefined" || !config.geolock.enabled) {
        return true
    }
    let ipLocation = maxmind.getLocation(ip)
    let isWhilelistMode = config.geolock.mode === "whitelist"
    if (!ipLocation) {
        return isWhilelistMode
    }
    if (config.geolock.countryCodes.indexOf(ipLocation.countryCode) === -1) {
        return !isWhilelistMode
    }
    return isWhilelistMode
}
