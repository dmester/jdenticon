/**
 * Jdenticon 1.4.0
 * http://jdenticon.com
 *  
 * Built: 2016-12-10T17:10:50.251Z
 *
 * Copyright (c) 2014-2016 Daniel Mester Pirttijärvi
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

(function (global, name, factory) {
    var jQuery = global["jQuery"],
        jdenticon = factory(global, jQuery);

    // Node.js
    if (typeof module !== "undefined" && "exports" in module) {
        module["exports"] = jdenticon;
    }
    // RequireJS
    else if (typeof define === "function" && define["amd"]) {
        define([], function () { return jdenticon; });
    }
    // No module loader
    else {
        global[name] = jdenticon;
    }
})(this, "jdenticon", function (global, jQuery) {
    "use strict";



    
    /**
     * Represents a point.
     * @private
     * @constructor
     */
    function Point(x, y) {
        this.x = x;
        this.y = y;
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
            return this._rotation === 1 ? new Point(right - y - (h || 0), this._y + x) :
                   this._rotation === 2 ? new Point(right - x - (w || 0), bottom - y - (h || 0)) :
                   this._rotation === 3 ? new Point(this._x + y, bottom - x - (w || 0)) :
                   new Point(this._x + x, this._y + y);
        }
    };
    Transform.noTransform = new Transform(0, 0, 0, 0);
    
    
    
    /**
     * Provides helper functions for rendering common basic shapes.
     * @private
     * @constructor
     */
    function Graphics(renderer) {
        this._renderer = renderer;
        this._transform = Transform.noTransform;
    }
    Graphics.prototype = {
        /**
         * Adds a polygon to the underlying renderer.
         * @param {Array} points The points of the polygon clockwise on the format [ x0, y0, x1, y1, ..., xn, yn ]
         * @param {boolean=} invert Specifies if the polygon will be inverted.
         */
        addPolygon: function (points, invert) {
            var di = invert ? -2 : 2, 
                transform = this._transform,
                transformedPoints = [],
                i;
            
            for (i = invert ? points.length - 2 : 0; i < points.length && i >= 0; i += di) {
                transformedPoints.push(transform.transformPoint(points[i], points[i + 1]));
            }
            
            this._renderer.addPolygon(transformedPoints);
        },
        
        /**
         * Adds a polygon to the underlying renderer.
         * Source: http://stackoverflow.com/a/2173084
         * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the entire ellipse.
         * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the entire ellipse.
         * @param {number} size The size of the ellipse.
         * @param {boolean=} invert Specifies if the ellipse will be inverted.
         */
        addCircle: function (x, y, size, invert) {
            var p = this._transform.transformPoint(x, y, size, size);
            this._renderer.addCircle(p, size, invert);
        },

        /**
         * Adds a rectangle to the underlying renderer.
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
         * Adds a right triangle to the underlying renderer.
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
         * Adds a rhombus to the underlying renderer.
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
        }
    };
    
    
    
    
    var shapes = {
        center: [
            /** @param {Graphics} g */
            function (g, cell, index) {
                var k = cell * 0.42;
                g.addPolygon([
                    0, 0,
                    cell, 0,
                    cell, cell - k * 2,
                    cell - k, cell,
                    0, cell
                ]);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var w = 0 | (cell * 0.5), 
                    h = 0 | (cell * 0.8);
                g.addTriangle(cell - w, 0, w, h, 2);
            },
            /** @param {Graphics} g */
            function (g, cell, index) { 
                var s = 0 | (cell / 3);
                g.addRectangle(s, s, cell - s, cell - s);
            },
            /** @param {Graphics} g */
            function (g, cell, index) { 
                var inner = cell * 0.1,
                    inner = 
                        inner > 1 ? (0 | inner) : // large icon => truncate decimals
                        inner > 0.5 ? 1 :         // medium size icon => fixed width
                        inner,                    // small icon => anti-aliased border
                    
                    // Use fixed outer border widths in small icons to ensure the border is drawn
                    outer = 
                        cell < 6 ? 1 :
                        cell < 8 ? 2 :
                        (0 | (cell * 0.25));
                
                g.addRectangle(outer, outer, cell - inner - outer, cell - inner - outer);
            },
            /** @param {Graphics} g */
            function (g, cell, index) { 
                var m = 0 | (cell * 0.15),
                    s = 0 | (cell * 0.5);
                g.addCircle(cell - s - m, cell - s - m, s);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var inner = cell * 0.1,
                    outer = inner * 4;

                g.addRectangle(0, 0, cell, cell);
                g.addPolygon([
                    outer, outer,
                    cell - inner, outer,
                    outer + (cell - outer - inner) / 2, cell - inner
                ], true);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addPolygon([
                    0, 0,
                    cell, 0,
                    cell, cell * 0.7,
                    cell * 0.4, cell * 0.4,
                    cell * 0.7, cell,
                    0, cell
                ]);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addRectangle(0, 0, cell, cell / 2);
                g.addRectangle(0, cell / 2, cell / 2, cell / 2);
                g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 1);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var inner = cell * 0.14,
                    inner = 
                        cell < 8 ? inner : // small icon => anti-aliased border
                        (0 | inner),       // large icon => truncate decimals
                    
                    // Use fixed outer border widths in small icons to ensure the border is drawn
                    outer = 
                        cell < 4 ? 1 :
                        cell < 6 ? 2 :
                        (0 | (cell * 0.35));
                        
                g.addRectangle(0, 0, cell, cell);
                g.addRectangle(outer, outer, cell - outer - inner, cell - outer - inner, true);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var inner = cell * 0.12,
                    outer = inner * 3;

                g.addRectangle(0, 0, cell, cell);
                g.addCircle(outer, outer, cell - inner - outer, true);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var m = cell * 0.25;
                g.addRectangle(0, 0, cell, cell);
                g.addRhombus(m, m, cell - m, cell - m, true);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var m = cell * 0.4, s = cell * 1.2;
                if (!index) {
                    g.addCircle(m, m, s);
                }
            }
        ],
        
        outer: [
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addTriangle(0, 0, cell, cell, 0);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addTriangle(0, cell / 2, cell, cell / 2, 0);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                g.addRhombus(0, 0, cell, cell);
            },
            /** @param {Graphics} g */
            function (g, cell, index) {
                var m = cell / 6;
                g.addCircle(m, m, cell - 2 * m);
            }
        ]
    };

    
    
    
    function decToHex(v) {
        v |= 0; // Ensure integer value
        return v < 0 ? "00" :
            v < 16 ? "0" + v.toString(16) :
            v < 256 ? v.toString(16) :
            "ff";
    }
    
    function hueToRgb(m1, m2, h) {
        h = h < 0 ? h + 6 : h > 6 ? h - 6 : h;
        return decToHex(255 * (
            h < 1 ? m1 + (m2 - m1) * h :
            h < 3 ? m2 :
            h < 4 ? m1 + (m2 - m1) * (4 - h) :
            m1));
    }
        
    /**
     * Functions for converting colors to hex-rgb representations.
     * @private
     */
    var color = {
        /**
         * @param {number} r Red channel [0, 255]
         * @param {number} g Green channel [0, 255]
         * @param {number} b Blue channel [0, 255]
         */
        rgb: function (r, g, b) {
            return "#" + decToHex(r) + decToHex(g) + decToHex(b);
        },
        /**
         * @param h Hue [0, 1]
         * @param s Saturation [0, 1]
         * @param l Lightness [0, 1]
         */
        hsl: function (h, s, l) {
            // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
            if (s == 0) {
                var partialHex = decToHex(l * 255);
                return "#" + partialHex + partialHex + partialHex;
            }
            else {
                var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
                    m1 = l * 2 - m2;
                return "#" +
                    hueToRgb(m1, m2, h * 6 + 2) +
                    hueToRgb(m1, m2, h * 6) +
                    hueToRgb(m1, m2, h * 6 - 2);
            }
        },
        // This function will correct the lightness for the "dark" hues
        correctedHsl: function (h, s, l) {
            // The corrector specifies the perceived middle lightnesses for each hue
            var correctors = [ 0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55 ],
                corrector = correctors[(h * 6 + 0.5) | 0];
            
            // Adjust the input lightness relative to the corrector
            l = l < 0.5 ? l * corrector * 2 : corrector + (l - 0.5) * (1 - corrector) * 2;
            
            return color.hsl(h, s, l);
        }
    };

    
    
    
    /**
     * Gets a set of identicon color candidates for a specified hue and config.
     */
    function colorTheme(hue, config) {
        return [
            // Dark gray
            color.hsl(0, 0, config.grayscaleLightness(0)),
            // Mid color
            color.correctedHsl(hue, config.saturation, config.colorLightness(0.5)),
            // Light gray
            color.hsl(0, 0, config.grayscaleLightness(1)),
            // Light color
            color.correctedHsl(hue, config.saturation, config.colorLightness(1)),
            // Dark color
            color.correctedHsl(hue, config.saturation, config.colorLightness(0))
        ];
    }

    
    
         
    /**
     * Draws an identicon to a specified renderer.
     */
    function iconGenerator(renderer, hash, x, y, size, padding, config) {
        var undefined;
        
        // Calculate padding
        padding = (size * (padding === undefined ? 0.08 : padding)) | 0;
        size -= padding * 2;
        
        if (!/^[0-9a-f]{11,}$/i.test(hash)) {
            throw new Error("Invalid hash passed to Jdenticon.");
        }
        
        var graphics = new Graphics(renderer);
        
        // Calculate cell size and ensure it is an integer
        var cell = 0 | (size / 4);
        
        // Since the cell size is integer based, the actual icon will be slightly smaller than specified => center icon
        x += 0 | (padding + size / 2 - cell * 2);
        y += 0 | (padding + size / 2 - cell * 2);

        function renderShape(colorIndex, shapes, index, rotationIndex, positions) {
            var r = rotationIndex ? parseInt(hash.charAt(rotationIndex), 16) : 0,
                shape = shapes[parseInt(hash.charAt(index), 16) % shapes.length],
                i;
            
            renderer.beginShape(availableColors[selectedColorIndexes[colorIndex]]);
            
            for (i = 0; i < positions.length; i++) {
                graphics._transform = new Transform(x + positions[i][0] * cell, y + positions[i][1] * cell, cell, r++ % 4);
                shape(graphics, cell, i);
            }
            
            renderer.endShape();
        }

        // AVAILABLE COLORS
        var hue = parseInt(hash.substr(-7), 16) / 0xfffffff,
        
            // Available colors for this icon
            availableColors = colorTheme(hue, config),

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

        // ACTUAL RENDERING
        // Sides
        renderShape(0, shapes.outer, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]);
        // Corners
        renderShape(1, shapes.outer, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]);
        // Center
        renderShape(2, shapes.center, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]);
    };

    
    
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
    
    
    
    /**
     * Renderer redirecting drawing commands to a canvas context.
     * @private
     * @constructor
     */
    function CanvasRenderer(ctx, width, height) {
        this._ctx = ctx;
        ctx.clearRect(0, 0, width, height);
    }
    CanvasRenderer.prototype = {
        /**
         * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
         * @param {string} color Fill color on format #xxxxxx.
         */
        beginShape: function (color) {
            this._ctx.fillStyle = color;
            this._ctx.beginPath();
        },
        /**
         * Marks the end of the currently drawn shape. This causes the queued paths to be rendered on the canvas.
         */
        endShape: function () {
            this._ctx.fill();
        },
        /**
         * Adds a polygon to the rendering queue.
         * @param points An array of Point objects.
         */
        addPolygon: function (points) {
            var ctx = this._ctx, i;
            ctx.moveTo(points[0].x, points[0].y);
            for (i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
        },
        /**
         * Adds a circle to the rendering queue.
         * @param {Point} point The upper left corner of the circle bounding box.
         * @param {number} diameter The diameter of the circle.
         * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
         */
        addCircle: function (point, diameter, counterClockwise) {
            var ctx = this._ctx,
                radius = diameter / 2;
            ctx.arc(point.x + radius, point.y + radius, radius, 0, Math.PI * 2, counterClockwise);
            ctx.closePath();
        }
    };
    
    
    
         
    
    
    var /** @const */
        HASH_ATTRIBUTE = "data-jdenticon-hash",
        supportsQuerySelectorAll = "document" in global && "querySelectorAll" in document;
    
    /**
     * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
     */
    function getCurrentConfig() {
        var configObject = jdenticon["config"] || global["jdenticon_config"] || { },
            lightnessConfig = configObject["lightness"] || { },
            saturation = configObject["saturation"];
        
        /**
         * Creates a lightness range.
         */
        function lightness(configName, defaultMin, defaultMax) {
            var range = lightnessConfig[configName] instanceof Array ? lightnessConfig[configName] : [defaultMin, defaultMax];
            
            /**
             * Gets a lightness relative the specified value in the specified lightness range.
             */
            return function (value) {
                value = range[0] + value * (range[1] - range[0]);
                return value < 0 ? 0 : value > 1 ? 1 : value;
            };
        }
            
        return {
            saturation: typeof saturation == "number" ? saturation : 0.5,
            colorLightness: lightness("color", 0.4, 0.8),
            grayscaleLightness: lightness("grayscale", 0.3, 0.9)
        }
    }
    
    /**
     * Updates the identicon in the specified canvas or svg elements.
     * @param {string=} hash Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
     * @param {number=} padding Optional padding in percents. Extra padding might be added to center the rendered identicon.
     */
    function update(el, hash, padding) {
        if (typeof(el) === "string") {
            if (supportsQuerySelectorAll) {
                var elements = document.querySelectorAll(el);
                for (var i = 0; i < elements.length; i++) {
                    update(elements[i], hash, padding);
                }
            }
            return;
        }
        if (!el || !el["tagName"]) {
            // No element found
            return;
        }
        hash = hash || el.getAttribute(HASH_ATTRIBUTE);
        if (!hash) {
            // No hash specified
            return;
        }
        
        var isSvg = el["tagName"].toLowerCase() == "svg",
            isCanvas = el["tagName"].toLowerCase() == "canvas";
        
        // Ensure we have a supported element
        if (!isSvg && !(isCanvas && "getContext" in el)) {
            return;
        }
        
        var width = Number(el.getAttribute("width")) || el.clientWidth || 0,
            height = Number(el.getAttribute("height")) || el.clientHeight || 0,
            renderer = isSvg ? new SvgRenderer(width, height) : new CanvasRenderer(el.getContext("2d"), width, height),
            size = Math.min(width, height);
        
        // Draw icon
        iconGenerator(renderer, hash, 0, 0, size, padding, getCurrentConfig());
        
        // SVG needs postprocessing
        if (isSvg) {
            // Parse svg to a temporary span element.
            // Simply using innerHTML does unfortunately not work on IE.
            var wrapper = document.createElement("span");
            wrapper.innerHTML = renderer.toSvg(false);
            
            // Then replace the content of the target element with the parsed svg.
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
            var newNodes = wrapper.firstChild.childNodes;
            while (newNodes.length) {
                el.appendChild(newNodes[0]);
            }
            
            // Set viewBox attribute to ensure the svg scales nicely.
            el.setAttribute("viewBox", "0 0 " + width + " " + height);
        }
    }
    
    /**
     * Draws an identicon to a context.
     */
    function drawIcon(ctx, hash, size) {
        if (!ctx) {
            throw new Error("No canvas specified.");
        }
        
        var renderer = new CanvasRenderer(ctx, size, size);
        iconGenerator(renderer, hash, 0, 0, size, 0, getCurrentConfig());
    }
    
    /**
     * Draws an identicon to a context.
     * @param {number=} padding Optional padding in percents. Extra padding might be added to center the rendered identicon.
     */
    function toSvg(hash, size, padding) {
        var renderer = new SvgRenderer(size, size);
        iconGenerator(renderer, hash, 0, 0, size, padding, getCurrentConfig());
        return renderer.toSvg();
    }

    /**
     * Updates all canvas elements with the data-jdenticon-hash attribute.
     */
    function jdenticon() {
        if (supportsQuerySelectorAll) {
            update("svg[" + HASH_ATTRIBUTE + "],canvas[" + HASH_ATTRIBUTE + "]");
        }
    }
    
    // Public API
    jdenticon["drawIcon"] = drawIcon;
    jdenticon["toSvg"] = toSvg;
    jdenticon["update"] = update;
    jdenticon["version"] = "1.4.0";
    
    // Basic jQuery plugin
    if (jQuery) {
        jQuery["fn"]["jdenticon"] = function (hash, padding) {
            this["each"](function (index, el) {
                update(el, hash, padding);
            });
            return this;
        };
    }
    
    // Schedule to render all identicons on the page once it has been loaded.
    if (typeof setTimeout === "function") {
        setTimeout(jdenticon, 0);
    }
    
    return jdenticon;

});