/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./Color", "./Path", "./Transform"], function (Color, Path, Transform) {
    "use strict";
    
    var undefined,
		/** @const */
		version = "{version}",
        /** @const */
        HASH_ATTRIBUTE = "data-jdenticon-hash";
        
    // <debug>
    var global = window,
        jQuery = window.jQuery;
    // </debug>
    
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
            var w = 0 | (cell * 0.5), 
                h = 0 | (cell * 0.8);
            p.addTriangle(cell - w, 0, w, h, 2);
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
            p.addPolygon([
                0, 0,
                cell, 0,
                cell, cell * 0.7,
                cell * 0.4, cell * 0.4,
                cell * 0.7, cell,
                0, cell
            ]);
        },
        /** @param {Path} p */
        function (p, cell, index) {
            p.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3);
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
        if (!/^[0-9a-f]{11,}$/i.test(hash)) {
            throw new Error("Invalid hash passed to Jdenticon.");
        }
        if (!ctx) {
            throw new Error("No canvas specified.");
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
            canvases = "document" in global ? document.getElementsByTagName("canvas") : [];
            
        for (var i = 0; i < canvases.length; i++) {
            hash = canvases[i].getAttribute(HASH_ATTRIBUTE);
            if (hash) {
                update(canvases[i], hash);
            }
        }
    }
    jdenticon["drawIcon"] = drawIcon;
    jdenticon["update"] = update;
    jdenticon["version"] = version;
    
    // Basic jQuery plugin
    if (jQuery) {
        jQuery["fn"]["jdenticon"] = function (hash, padding) {
            this["each"](function (index, el) {
                update(el, hash, padding);
            });
            return this;
        };
    }
    
    if (typeof setTimeout === "function") {
        setTimeout(jdenticon, 0);
    }

    return jdenticon;
});