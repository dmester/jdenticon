/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

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
                // Use fixed outer border widths in small icons to ensure the border is drawn
                outer = 
                    cell < 6 ? 1 :
                    cell < 8 ? 2 :
                    (0 | (cell * 0.25));
                
            inner = 
                inner > 1 ? (0 | inner) : // large icon => truncate decimals
                inner > 0.5 ? 1 :         // medium size icon => fixed width
                inner;                    // small icon => anti-aliased border

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

            // Align edge to nearest pixel in large icons
            if (outer > 3) {
                outer = 0 | outer;
            }

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
                // Use fixed outer border widths in small icons to ensure the border is drawn
                outer = 
                    cell < 4 ? 1 :
                    cell < 6 ? 2 :
                    (0 | (cell * 0.35));

            inner = 
                cell < 8 ? inner : // small icon => anti-aliased border
                (0 | inner);       // large icon => truncate decimals

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

module.exports = shapes;
