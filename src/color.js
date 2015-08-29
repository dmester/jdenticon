/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    
    function decToHex(v) {
        v |= 0; // Ensure integer value
        return v < 0 ? "00" :
            v < 16 ? "0" + v.toString(16) :
            v < 256 ? v.toString(16) :
            "ff";
    }
    
    function hueToRgb(m1, m2, h) {
        h = h < 0 ? h + 6 : h > 6 ? h - 6 : h;
        return decToHex(255 * (
            h < 1 ? m1 + (m2 - m1) * h :
            h < 3 ? m2 :
            h < 4 ? m1 + (m2 - m1) * (4 - h) :
            m1));
    }
        
    /**
     * Represents a color.
     * @private
     * @constructor
     */
    var color = {
        /**
         * @param {number} r Red channel [0, 255]
         * @param {number} g Green channel [0, 255]
         * @param {number} b Blue channel [0, 255]
         */
        rgb: function (r, g, b) {
            return "#" + decToHex(r) + decToHex(g) + decToHex(b);
        },
        /**
         * @param h Hue [0, 1]
         * @param s Saturation [0, 1]
         * @param l Lightness [0, 1]
         */
        hsl: function (h, s, l) {
            // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
            if (s == 0) {
                var partialHex = decToHex(l * 255);
                return "#" + partialHex + partialHex + partialHex;
            }
            else {
                var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
                    m1 = l * 2 - m2;
                return "#" +
                    hueToRgb(m1, m2, h * 6 + 2) +
                    hueToRgb(m1, m2, h * 6) +
                    hueToRgb(m1, m2, h * 6 - 2);
            }
        },
        // This function will correct the lightness for the "dark" hues
        correctedHsl: function (h, s, l) {
            var correctors = [ 0.95, 1, 1, 1, 0.7, 0.8, 0.8 ];
            return color.hsl(h, s, 1 - correctors[(h * 6 + 0.5) | 0] * (1 - l));
        }
    };

    return color;
});