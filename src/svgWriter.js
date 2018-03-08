/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

/**
 * Renderer producing SVG output.
 * @private
 * @constructor
 */
function SvgWriter(size) {
    this.size = size;
    this._s =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + 
        size + '" height="' + size + '" viewBox="0 0 ' + 
        size + ' ' + size + '" preserveAspectRatio="xMidYMid meet">';
}
SvgWriter.prototype = {
    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb.
     * @param {number} opacity  Opacity in the range [0.0, 1.0].
     */
    setBackground: function (fillColor, opacity) {
        if (opacity) {
            this._s += '<rect width="100%" height="100%" fill="' + 
                fillColor + '" opacity="' + opacity.toFixed(2) + '"/>';
        }
    },
    /**
     * Writes a path to the SVG string.
     * @param {string} color Fill color on format #rrggbb.
     * @param {string} dataString The SVG path data string.
     */
    append: function (color, dataString) {
        this._s += 
            '<path fill="' + color + '" d="' + dataString + '"/>';
    },
    /**
     * Gets the rendered image as an SVG string.
     */
    toString: function () {
        return this._s + "</svg>";
    }
};

module.exports = SvgWriter;
