/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const color = require("./color");

/**
 * Gets a set of identicon color candidates for a specified hue and config.
 */
function colorTheme(hue, config) {
    return [
        // Dark gray
        color.hsl(0, 0, config.grayscaleLightness(0)),
        // Mid color
        color.correctedHsl(hue, config.saturation, config.colorLightness(0.5)),
        // Light gray
        color.hsl(0, 0, config.grayscaleLightness(1)),
        // Light color
        color.correctedHsl(hue, config.saturation, config.colorLightness(1)),
        // Dark color
        color.correctedHsl(hue, config.saturation, config.colorLightness(0))
    ];
}

module.exports = colorTheme;
