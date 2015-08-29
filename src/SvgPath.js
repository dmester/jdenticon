/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    
    function SvgPath() {
        this._path = "";
    }
    SvgPath.prototype = {
        addPolygon: function (points) {
            this._path += " M " + points[0].x + " " + points[0].y;
            for (var i = 1; i < points.length; i++) {
                this._path += " L " + points[i].x + " " + points[i].y;
            }
        },
        addCircle: function (point, size, invert) {
            var sweepFlag = invert ? 0 : 1,
                radius = size / 2;
            this._path += 
                " M " + (point.x) + " " + (point.y + radius) +
                " a " + radius + "," + radius + " 0 1," + sweepFlag + " " + size + ",0" + 
                " a " + radius + "," + radius + " 0 1," + sweepFlag + " " + (-size) + ",0";
        },
        toSvg: function () {
            return this._path;
        }
    };
    
    return SvgPath;
});