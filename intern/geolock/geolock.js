if (config.geolock && config.geolock.enabled && !maxmind) {
    global.maxmind = require("maxmind").open(global.config.geolock.maxmindDatabase)
    if (!maxmind) {
        console.log("Error loading Maxmind Database")
    }
}

export function isAllowed(ip) {
    if (typeof config.geolock === "undefined" || !config.geolock.enabled) {
        return true
    }
    let ipLocation = maxmind.get(ip)
    let isWhilelistMode = config.geolock.mode === "whitelist"
    if (!ipLocation) {
        return isWhilelistMode
    }
    if (config.geolock.countryCodes.indexOf(ipLocation.country.iso_code) === -1) {
        return !isWhilelistMode
    }
    return isWhilelistMode
}
