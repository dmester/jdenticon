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
        this.dataString = "";
    }
    SvgPath.prototype = {
        addPolygon: function (points) {
            var dataString = "M" + points[0].x + " " + points[0].y;
            for (var i = 1; i < points.length; i++) {
                dataString += "L" + points[i].x + " " + points[i].y;
            }
            this.dataString += dataString + "Z";
        },
        addCircle: function (point, size, invert) {
            var sweepFlag = invert ? 0 : 1,
                radius = size / 2;
            this.dataString += 
                "M" + (point.x) + " " + (point.y + radius) +
                "a" + radius + "," + radius + " 0 1," + sweepFlag + " " + size + ",0" + 
                "a" + radius + "," + radius + " 0 1," + sweepFlag + " " + (-size) + ",0";
        }
    };
    
    return SvgPath;
});