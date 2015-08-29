/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./transform"], function (Transform) {
    "use strict";
    /**
     * A wrapper around a context for building paths.
     * @private
     * @constructor
     */
    function Path(ctx, transform) {
        this._ctx = ctx;
        this._transform = transform || Transform.noTransform;
        ctx.beginPath();
    }
    Path.prototype = {
        /**
         * Adds a polygon to the path.
         * @param {Array} points The points of the polygon clockwise on the format [ x0, y0, x1, y1, ..., xn, yn ]
         * @param {boolean=} invert Specifies if the polygon will be inverted.
         */
        addPolygon: function (points, invert) {
            var di = invert ? -2 : 2,
                i = invert ? points.length - 2 : 0,
                ctx = this._ctx;
            
            ctx.moveTo.apply(ctx, this._transform.transformPoint(points[i], points[i + 1]));
            
            for (i += di; i < points.length && i >= 0; i += di) {
                ctx.lineTo.apply(ctx, this._transform.transformPoint(points[i], points[i + 1]));
            }
            ctx.closePath();
        },
        
        /**
         * Adds a polygon to the path.
         * Source: http://stackoverflow.com/a/2173084
         * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the entire ellipse.
         * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the entire ellipse.
         * @param {number} w The width of the ellipse.
         * @param {number} h The height of the ellipse.
         * @param {boolean=} invert Specifies if the ellipse will be inverted.
         */
        addEllipse: function (x, y, w, h, invert) {
            var ctx = this._ctx,
                kappa = .5522848,
                p = this._transform.transformPoint(x, y, w, h),
                x = p[0],
                y = p[1],
                ox = (w / 2) * kappa, // control point offset horizontal
                oy = (h / 2) * kappa, // control point offset vertical
                xe = x + w,           // x-end
                ye = y + h,           // y-end
                xm = x + w / 2,       // x-middle
                ym = y + h / 2;       // y-middle

            if (invert) {
                ye = y;
                y = y + h;
                oy = -oy;
            }

            ctx.moveTo(x, ym);
            ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
            ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
            ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
            ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
            ctx.closePath();
        },

        /**
         * Adds a rectangle to the path.
         * @param {number} x The x-coordinate of the upper left corner of the rectangle.
         * @param {number} y The y-coordinate of the upper left corner of the rectangle.
         * @param {number} w The width of the rectangle.
         * @param {number} h The height of the rectangle.
         * @param {boolean=} invert Specifies if the rectangle will be inverted.
         */
        addRectangle: function (x, y, w, h, invert) {
            this.addPolygon([
                x, y, 
                x + w, y,
                x + w, y + h,
                x, y + h
            ], invert);
        },

        /**
         * Adds a right triangle to the path.
         * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the triangle.
         * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the triangle.
         * @param {number} w The width of the triangle.
         * @param {number} h The height of the triangle.
         * @param {number} r The rotation of the triangle (clockwise). 0 = right corner of the triangle in the lower left corner of the bounding rectangle.
         * @param {boolean=} invert Specifies if the triangle will be inverted.
         */
        addTriangle: function (x, y, w, h, r, invert) {
            var points = [
                x + w, y, 
                x + w, y + h, 
                x, y + h,
                x, y
            ];
            points.splice(((r || 0) % 4) * 2, 2);
            this.addPolygon(points, invert);
        },

        /**
         * Adds a rhombus to the path.
         * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the rhombus.
         * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the rhombus.
         * @param {number} w The width of the rhombus.
         * @param {number} h The height of the rhombus.
         * @param {boolean=} invert Specifies if the rhombus will be inverted.
         */
        addRhombus: function (x, y, w, h, invert) {
            this.addPolygon([
                x + w / 2, y,
                x + w, y + h / 2,
                x + w / 2, y + h,
                x, y + h / 2
            ], invert);
        },

        fill: function () {
            this._ctx.fill();
        }
    };
    
    return Path;
});