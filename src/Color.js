/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    /**
     * Represents a color.
     * @private
     * @constructor
     */
    function Color() { }
    /**
     * @param {number} r Red channel [0, 255]
     * @param {number} g Green channel [0, 255]
     * @param {number} b Blue channel [0, 255]
     * @param {number=} a Alpha [0, 1]
     */
    Color.rgb = function (r, g, b, a) {
        var color = new Color();
        color.s = "rgba(" +
            (r & 0xff) + "," +
            (g & 0xff) + "," +
            (b & 0xff) + "," +
            (a === undefined ? 1 : a) + ")";
        return color;
    };
    /**
     * @param h Hue [0, 1]
     * @param s Saturation [0, 1]
     * @param l Lightness [0, 1]
     * @param {number=} a Alpha [0, 1]
     */
    Color.hsl = function (h, s, l, a) {
        var color = new Color();
        color.s = "hsla(" +
            ((h * 360) | 0) + "," +
            ((s * 100) | 0) + "%," +
            ((l * 100) | 0) + "%," +
            (a === undefined ? 1 : a) + ")";
        return color;
    };
    // This function will correct the lightness for the "dark" hues
    Color.correctedHsl = function (h, s, l) {
        var correctors = [ 0.95, 1, 1, 1, 0.7, 0.8, 0.8 ];
        return Color.hsl(h, s, 1 - correctors[(h * 6 + 0.5) | 0] * (1 - l));
    };
    Color.prototype = {
        toString: function () {
            return this.s;
        }
    };
    
    return Color;
});