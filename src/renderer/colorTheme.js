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
    hue = config.hue(hue);
    return [
        // Dark gray
        color.correctedHsl(hue, config.grayscaleSaturation, config.grayscaleLightness(0)),
        // Mid color
        color.correctedHsl(hue, config.colorSaturation, config.colorLightness(0.5)),
        // Light gray
        color.correctedHsl(hue, config.grayscaleSaturation, config.grayscaleLightness(1)),
        // Light color
        color.correctedHsl(hue, config.colorSaturation, config.colorLightness(1)),
        // Dark color
        color.correctedHsl(hue, config.colorSaturation, config.colorLightness(0))
    ];
}

module.exports = colorTheme;
