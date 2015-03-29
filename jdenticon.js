/**
 * Jdenticon {version}
 * http://jdenticon.com
 *  
 * Built: {date}
 *
 * Copyright (c) 2014-{year} Daniel Mester Pirttijärvi
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * 
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 
 * 3. This notice may not be removed or altered from any source distribution.
 * 
 */

/*jslint bitwise: true */

window["jdenticon"] = (function() {
    "use strict";
    var undefined,
        /** @const */
        HASH_ATTRIBUTE = "data-jdenticon-hash",
        jQuery = window["jQuery"];
    
    /**
     * Represents a color.
     * @private
     * @constructor
     */
    function Color() { }
    /**
     * @param {number} r Red channel [0, 255]
     * @param {number} g Green channel [0, 255]
     * @param {number} b Blue channel [0, 255]
     * @param {number=} a Alpha [0, 1]
     */
    Color.rgb = function (r, g, b, a) {
        var color = new Color();
        color.s = "rgba(" +
            (r & 0xff) + "," +
            (g & 0xff) + "," +
            (b & 0xff) + "," +
            (a === undefined ? 1 : a) + ")";
        return color;
    };
    /**
     * @param h Hue [0, 1]
     * @param s Saturation [0, 1]
     * @param l Lightness [0, 1]
     * @param {number=} a Alpha [0, 1]
     */
    Color.hsl = function (h, s, l, a) {
        var color = new Color();
        color.s = "hsla(" +
            ((h * 360) | 0) + "," +
            ((s * 100) | 0) + "%," +
            ((l * 100) | 0) + "%," +
            (a === undefined ? 1 : a) + ")";
        return color;
    };
    // This function will correct the lightness for the "dark" hues
    Color.correctedHsl = function (h, s, l) {
        var correctors = [ 0.95, 1, 1, 1, 0.7, 0.8, 0.8 ];
        return Color.hsl(h, s, 1 - correctors[(h * 6 + 0.5) | 0] * (1 - l));
    };
    Color.prototype = {
        toString: function () {
            return this.s;
        }
    };
    
    
    /**
     * Translates and rotates a point before being passed on to the canvas context. This was previously done by the canvas context itself, 
     * but this caused a rendering issue in Chrome on sizes > 256 where the rotation transformation of inverted paths was not done properly.
     * @param {number} x The x-coordinate of the upper left corner of the transformed rectangle.
     * @param {number} y The y-coordinate of the upper left corner of the transformed rectangle.
     * @param {number} size The size of the transformed rectangle.
     * @param {number} rotation Rotation specified as 0 = 0 rad, 1 = 0.5π rad, 2 = π rad, 3 = 1.5π rad
     * @private
     * @constructor
     */
    function Transform(x, y, size, rotation) {
        this._x = x;
        this._y = y;
        this._size = size;
        this._rotation = rotation;
    }
    Transform.noTransform = new Transform(0, 0, 0, 0);
    Transform.prototype = {
        /**
         * Transforms the specified point based on the translation and rotation specification for this Transform.
         * @param {number} x x-coordinate
         * @param {number} y y-coordinate
         * @param {number=} w The width of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
         * @param {number=} h The height of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
         */
        transformPoint: function (x, y, w, h) {
            var right = this._x + this._size,
                bottom = this._y + this._size;
            return this._rotation === 1 ? [right - y - (h || 0), this._y + x] :
                   this._rotation === 2 ? [right - x - (w || 0), bottom - y - (h || 0)] :
                   this._rotation === 3 ? [this._x + y, bottom - x - (w || 0)] :
                   [this._x + x, this._y + y];
        }
    };
    
    
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
            points.splice((r || 0) % 4, 2);
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
    
    
    // SHAPES
    /** @const */
    var CENTER_SHAPES = [
        /** @param {Path} p */
        function (p, cell, index) {
            var k = cell * 0.42;
            p.addPolygon([
                0, 0,
                cell, 0,
                cell, cell - k * 2,
                cell - k, cell,
                0, cell
            ]);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var k = 0 | (cell * 0.4);
            p.addTriangle(cell - k, cell - k * 2, k, k * 2, 1);
        },
        /** @param {Path} p */
        function (p, cell, index) { 
            var s = 0 | (cell / 3);
            p.addRectangle(s, s, cell - s, cell - s);
        },
        /** @param {Path} p */
        function (p, cell, index) { 
            var inner = 0 | (cell * 0.1),
                outer = 0 | (cell * 0.25);
            p.addRectangle(outer, outer, cell - inner - outer, cell - inner - outer);
        },
        /** @param {Path} p */
        function (p, cell, index) { 
            var m = 0 | (cell * 0.15),
                s = 0 | (cell * 0.5);
            p.addEllipse(cell - s - m, cell - s - m, s, s);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var inner = cell * 0.1,
                outer = inner * 4;

            p.addRectangle(0, 0, cell, cell);
            p.addPolygon([
                outer, outer,
                cell - inner, outer,
                outer + (cell - outer - inner) / 2, cell - inner
            ], true);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addTriangle(0, 0, cell, cell, 0);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 0);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addRectangle(0, 0, cell, cell / 2);
            p.addRectangle(0, cell / 2, cell / 2, cell / 2);
            p.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 1);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var inner = 0 | (cell * 0.14),
                outer = 0 | (cell * 0.35);
            p.addRectangle(0, 0, cell, cell);
            p.addRectangle(outer, outer, cell - outer - inner, cell - outer - inner, true);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var inner = cell * 0.12,
                outer = inner * 3;

            p.addRectangle(0, 0, cell, cell);
            p.addEllipse(outer, outer, cell - inner - outer, cell - inner - outer, true);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var m = cell * 0.25;
            p.addRectangle(0, 0, cell, cell);
            p.addRhombus(m, m, cell - m, cell - m, true);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var m = cell * 0.4, s = cell * 1.2;
            if (!index) {
                p.addEllipse(m, m, s, s);
            }
        }
    ];
    
    /** @const */
    var OUTER_SHAPES = [
        /** @param {Path} p */
        function (p, cell, index) {
            p.addTriangle(0, 0, cell, cell, 0);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addTriangle(0, cell / 2, cell, cell / 2, 0);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addRhombus(0, 0, cell, cell);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            var m = cell / 6;
            p.addEllipse(m, m, cell - 2 * m, cell - 2 * m);
        }
    ];

    /**
     * Updates the identicon in the speciifed canvas element.
     * @param {number=} padding Optional padding in pixels. Extra padding might be added to center the rendered identicon.
     */
    function update(canvas, hash, padding) {
        var ctx = (canvas = typeof(canvas) === "string" ? document.querySelector(canvas) : canvas).getContext("2d"),
            size = Math.min(canvas.width) * (1 - 2 * (padding === undefined ? 0.08 : padding));
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(
            0 | ((canvas.width - size) / 2),
            0 | ((canvas.height - size) / 2));
        
        drawIcon(
            ctx, 
            hash || canvas.getAttribute(HASH_ATTRIBUTE),
            size);
            
        ctx.restore();
    }

    /**
     * Draws an identicon to a context.
     */
    function drawIcon(ctx, hash, size) {
        // Sizes smaller than 30 px are not supported. If really needed, apply a scaling transformation 
        // to the context before passing it to this function.
        if (size < 30) {
            throw new Error("Jdenticon cannot render identicons smaller than 30 pixels.");
        }
        if (!/^[0-9a-f]{10,}$/i.test(hash)) {
            throw new Error("Invalid hash passed to Jdenticon.");
        }
        
        size = size | 0;
        
        var cell = (0 | (size / 8)) * 2;

        function renderShape(ctx, shapes, index, rotationIndex, positions) {
            var r = rotationIndex ? parseInt(hash.charAt(rotationIndex), 16) : 0,
                shape = shapes[parseInt(hash.charAt(index), 16) % shapes.length],
                i,
                path,
                transform;

            for (i = 0; i < positions.length; i++) {
                transform = new Transform(positions[i][0] * cell, positions[i][1] * cell, cell, r++ % 4);
                path = new Path(ctx, transform);
                shape(path, cell, i);
                path.fill();
            }
        }

        // AVAILABLE COLORS
        // the first 15 characters of the hash control the pixels (even/odd)
        // they are drawn down the middle first, then mirrored outwards
        var hue = parseInt(hash.substr(-7), 16) / 0xfffffff,

            // Available colors for this icon
            availableColors = [
                // Dark gray
                Color.rgb(76, 76, 76),
                // Mid color
                Color.correctedHsl(hue, 0.5, 0.6),
                // Light gray
                Color.rgb(230, 230, 230),
                // Light color
                Color.correctedHsl(hue, 0.5, 0.8),
                // Dark color
                Color.hsl(hue, 0.5, 0.4)
            ],

            // The index of the selected colors
            selectedColorIndexes = [],
            index;

        function isDuplicate(values) {
            if (values.indexOf(index) >= 0) {
                for (var i = 0; i < values.length; i++) {
                    if (selectedColorIndexes.indexOf(values[i]) >= 0) {
                        return true;
                    }
                }
            }
        }

        for (var i = 0; i < 3; i++) {
            index = parseInt(hash.charAt(8 + i), 16) % availableColors.length;
            if (isDuplicate([0, 4]) || // Disallow dark gray and dark color combo
                isDuplicate([2, 3])) { // Disallow light gray and light color combo
                index = 1;
            }
            selectedColorIndexes.push(index);
        }

        function selectColor(index) {
            ctx.fillStyle = availableColors[selectedColorIndexes[index]].toString();
        }

        
        // ACTUAL RENDERING
        ctx.clearRect(0, 0, size, size);
        // Sides
        selectColor(0);
        renderShape(ctx, OUTER_SHAPES, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]);
        // Corners
        selectColor(1);
        renderShape(ctx, OUTER_SHAPES, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]);
        // Center
        selectColor(2);
        renderShape(ctx, CENTER_SHAPES, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]);
    };

    /**
     * Updates all canvas elements with the data-jdenticon-hash attribute.
     */
    function jdenticon() {
        var hash, 
            canvases = document.getElementsByTagName("canvas");
            
        for (var i = 0; i < canvases.length; i++) {
            hash = canvases[i].getAttribute(HASH_ATTRIBUTE);
            if (hash) {
                update(canvases[i], hash);
            }
        }
    }
    jdenticon["drawIcon"] = drawIcon;
    jdenticon["update"] = update;
    
    // Basic jQuery plugin
    if (jQuery) {
        jQuery["fn"]["jdenticon"] = function (hash, padding) {
            this["each"](function (index, el) {
                update(el, hash, padding);
            });
            return this;
        };
    }
    
    setTimeout(jdenticon, 0);
    return jdenticon;
})();