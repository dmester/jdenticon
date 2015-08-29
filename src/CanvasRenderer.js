/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    
    /**
     * A wrapper around a context for building paths.
     * @private
     * @constructor
     */
    function CanvasRenderer(ctx, width, height) {
        this._ctx = ctx;
        ctx.clearRect(0, 0, width, height);
    }
    CanvasRenderer.prototype = {
        beginShape: function (color) {
            this._ctx.fillStyle = color;
            this._ctx.beginPath();
        },
        endShape: function () {
            this._ctx.fill();
        },
        addPolygon: function (points) {
            var ctx = this._ctx, i;
            ctx.moveTo(points[0].x, points[0].y);
            for (i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        },
        addCircle: function (point, size, counterClockwise) {
            var ctx = this._ctx,
                radius = size / 2;
            ctx.arc(point.x + radius, point.y + radius, radius, 0, Math.PI * 2, counterClockwise);
            ctx.closePath();
        }
    };
    
    return CanvasRenderer;
});