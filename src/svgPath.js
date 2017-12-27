/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

/**
 * Prepares a measure to be used as a measure in an SVG path, by
 * rounding the measure to a single decimal. This reduces the file
 * size of the generated SVG with more than 50% in some cases.
 */
function svgValue(value) {
    return ((value * 10 + 0.5) | 0) / 10;
}

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
        var dataString = "M" + svgValue(points[0].x) + " " + svgValue(points[0].y);
        for (var i = 1; i < points.length; i++) {
            dataString += "L" + svgValue(points[i].x) + " " + svgValue(points[i].y);
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
            svgRadius = svgValue(diameter / 2),
            svgDiameter = svgValue(diameter);
            
        this.dataString += 
            "M" + svgValue(point.x) + " " + svgValue(point.y + diameter / 2) +
            "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " " + svgDiameter + ",0" + 
            "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " " + (-svgDiameter) + ",0";
    }
};

module.exports = SvgPath;
