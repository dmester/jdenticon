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
     * Writes a path to the SVG string.
     * @param {string} color Fill color on format #xxxxxx.
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
