/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { SvgPath } from "./svgPath";
import { parseHex } from "../../common/parseHex";

/**
 * Renderer producing SVG output.
 */
export class SvgRenderer {
    /**
     * @param {SvgElement|SvgWriter} target 
     */
    constructor(target) {
        /**
         * @type {SvgPath}
         */
        this._path;
        this._pathsByColor = { };
        this._target = target;
        this.iconSize = target.iconSize;
    }

    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb[aa].
     */
    setBackground(fillColor) {
        const match = /^(#......)(..)?/.exec(fillColor),
              opacity = match[2] ? parseHex(match[2], 0) / 255 : 1;
        this._target.setBackground(match[1], opacity);
    }

    /**
     * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
     * @param {string} color Fill color on format #xxxxxx.
     */
    beginShape(color) {
        this._path = this._pathsByColor[color] || (this._pathsByColor[color] = new SvgPath());
    }

    /**
     * Marks the end of the currently drawn shape.
     */
    endShape() { }

    /**
     * Adds a polygon with the current fill color to the SVG.
     * @param points An array of Point objects.
     */
    addPolygon(points) {
        this._path.addPolygon(points);
    }

    /**
     * Adds a circle with the current fill color to the SVG.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle(point, diameter, counterClockwise) {
        this._path.addCircle(point, diameter, counterClockwise);
    }

    /**
     * Called when the icon has been completely drawn.
     */
    finish() { 
        const pathsByColor = this._pathsByColor;
        for (let color in pathsByColor) {
            // hasOwnProperty cannot be shadowed in pathsByColor
            // eslint-disable-next-line no-prototype-builtins
            if (pathsByColor.hasOwnProperty(color)) {
                this._target.appendPath(color, pathsByColor[color].dataString);
            }
        }
    }
}
