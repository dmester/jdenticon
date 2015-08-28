/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    function SvgLine(x0, y0, x1, y1) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        
        var dy = this.dy = (y1 - y0) / (x1 - x0);
        this.intersect = dy > 1 || dy < -1 ? 
            x0 - y0 / dy : // Intersection of x axis
            y0 - x0 * dy;  // Intersection of y axis
        this.r = (x1 - x0) < 0;
    };
    
    return SvgLine;
});