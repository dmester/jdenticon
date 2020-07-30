/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

/**
 * Renderer producing SVG output.
 */
export class SvgWriter {
    /**
     * @param {number} iconSize - Icon width and height in pixels.
     */
    constructor(iconSize) {
        this.iconSize = iconSize;
        this._s =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + 
            iconSize + '" height="' + iconSize + '" viewBox="0 0 ' + 
            iconSize + ' ' + iconSize + '">';
    }

    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb.
     * @param {number} opacity  Opacity in the range [0.0, 1.0].
     */
    setBackground(fillColor, opacity) {
        if (opacity) {
            this._s += '<rect width="100%" height="100%" fill="' + 
                fillColor + '" opacity="' + opacity.toFixed(2) + '"/>';
        }
    }

    /**
     * Writes a path to the SVG string.
     * @param {string} color Fill color on format #rrggbb.
     * @param {string} dataString The SVG path data string.
     */
    appendPath(color, dataString) {
        this._s += '<path fill="' + color + '" d="' + dataString + '"/>';
    }

    /**
     * Gets the rendered image as an SVG string.
     */
    toString() {
        return this._s + "</svg>";
    }
}
