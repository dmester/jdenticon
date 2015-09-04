/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./svgPath"], function (SvgPath) {
    "use strict";
    /**
     * Renderer producing SVG output.
     * @private
     * @constructor
     */
    function SvgRenderer(width, height) {
        this._pathsByColor = { };
        this._size = { w: width, h: height };
    }
    SvgRenderer.prototype = {
        /**
         * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
         * @param {string} color Fill color on format #xxxxxx.
         */
        beginShape: function (color) {
            this._path = this._pathsByColor[color] || (this._pathsByColor[color] = new SvgPath());
        },
        /**
         * Marks the end of the currently drawn shape.
         */
        endShape: function () { },
        /**
         * Adds a polygon with the current fill color to the SVG.
         * @param points An array of Point objects.
         */
        addPolygon: function (points) {
            this._path.addPolygon(points);
        },
        /**
         * Adds a circle with the current fill color to the SVG.
         * @param {Point} point The upper left corner of the circle bounding box.
         * @param {number} diameter The diameter of the circle.
         * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
         */
        addCircle: function (point, diameter, counterClockwise) {
            this._path.addCircle(point, diameter, counterClockwise);
        },
        /**
         * Gets the rendered image as an SVG string.
         * @param {boolean=} fragment If true, the container svg element is not included in the result.
         */
        toSvg: function (fragment) {
            var svg = fragment ? '' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="' + 
                this._size.w + '" height="' + this._size.h + '" viewBox="0 0 ' + 
                this._size.w + ' ' + this._size.h + '" preserveAspectRatio="xMidYMid meet">';
            
            for (var color in this._pathsByColor) {
                svg += '<path fill="' + color + '" d="' + this._pathsByColor[color].dataString + '"/>';
            }

            return fragment ? svg : 
                svg + '</svg>';
        }
    };
    
    return SvgRenderer;
});