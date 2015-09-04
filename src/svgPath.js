/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    /**
     * Represents an SVG path element.
     * @private
     * @constructor
     */
    function SvgPath() {
        /**
         * This property holds the data string (path.d) of the SVG path.
         */
        this.dataString = "";
    }
    SvgPath.prototype = {
        /**
         * Adds a polygon with the current fill color to the SVG path.
         * @param points An array of Point objects.
         */
        addPolygon: function (points) {
            var dataString = "M" + points[0].x + " " + points[0].y;
            for (var i = 1; i < points.length; i++) {
                dataString += "L" + points[i].x + " " + points[i].y;
            }
            this.dataString += dataString + "Z";
        },
        /**
         * Adds a circle with the current fill color to the SVG path.
         * @param {Point} point The upper left corner of the circle bounding box.
         * @param {number} diameter The diameter of the circle.
         * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
         */
        addCircle: function (point, diameter, counterClockwise) {
            var sweepFlag = counterClockwise ? 0 : 1,
                radius = diameter / 2;
            this.dataString += 
                "M" + (point.x) + " " + (point.y + radius) +
                "a" + radius + "," + radius + " 0 1," + sweepFlag + " " + diameter + ",0" + 
                "a" + radius + "," + radius + " 0 1," + sweepFlag + " " + (-diameter) + ",0";
        }
    };
    
    return SvgPath;
});