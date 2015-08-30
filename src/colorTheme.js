/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./color"], function (color) {
    "use strict";
    
    /**
     * Gets a set of identicon color candidates for a specified hue and config.
     */
    function colorTheme(hue, configContainer) {
        /**
         * Gets a lightness relative the specified value in the specified lightness range.
         */
        function lightness(range, value) {
            value = range[0] + value * (range[1] - range[0]);
            return value < 0 ? 0 : value > 1 ? 1 : value;
        }
        
        // Config
        var config = configContainer["jdenticon_config"] || { },
            saturation = typeof config["saturation"] == "number" ? config["saturation"] : 0.5,
            lightnessConfig = config["lightness"] || { },
            colorLightnessRange = lightnessConfig["color"] instanceof Array ? lightnessConfig["color"] : [0.4, 0.8],
            grayscaleLightnessRange = lightnessConfig["grayscale"] instanceof Array ? lightnessConfig["grayscale"] : [0.3, 0.9];

        return [
            // Dark gray
            color.hsl(0, 0, lightness(grayscaleLightnessRange, 0)),
            // Mid color
            color.correctedHsl(hue, saturation, lightness(colorLightnessRange, 0.5)),
            // Light gray
            color.hsl(0, 0, lightness(grayscaleLightnessRange, 1)),
            // Light color
            color.correctedHsl(hue, saturation, lightness(colorLightnessRange, 1)),
            // Dark color
            color.correctedHsl(hue, saturation, lightness(colorLightnessRange, 0))
        ];
    }

    return colorTheme;
});