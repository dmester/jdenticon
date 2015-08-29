/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([], function () {
    "use strict";
    
    // SHAPES
    var shapes = {
        center: [
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
                p.addCircle(cell - s - m, cell - s - m, s);
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
                p.addCircle(outer, outer, cell - inner - outer, true);
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
                    p.addCircle(m, m, s);
                }
            }
        ],
        
        outer: [
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
                p.addCircle(m, m, cell - 2 * m);
            }
        ]
    };

    return shapes;
});