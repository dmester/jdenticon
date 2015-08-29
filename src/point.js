/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    
    function Point(x, y) {
        this.x = x;
        this.y = y;
    };
    Point.prototype = {
        equals: function (other) {
            return other.x == this.x && other.y == this.y;
        }
    };
    
    return Point;
});