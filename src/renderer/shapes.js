/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

/**
 * @param {number} index
 * @param {Graphics} g
 * @param {number} cell
 * @param {number} positionIndex
 */
export function centerShape(index, g, cell, positionIndex) {
    index = index % 14;

    let k, m, w, h, inner, outer;

    !index ? (
        k = cell * 0.42,
        g.addPolygon([
            0, 0,
            cell, 0,
            cell, cell - k * 2,
            cell - k, cell,
            0, cell
        ])) :

    index == 1 ? (
        w = 0 | (cell * 0.5), 
        h = 0 | (cell * 0.8),

        g.addTriangle(cell - w, 0, w, h, 2)) :

    index == 2 ? (
        w = 0 | (cell / 3),
        g.addRectangle(w, w, cell - w, cell - w)) :

    index == 3 ? (
        inner = cell * 0.1,
        // Use fixed outer border widths in small icons to ensure the border is drawn
        outer = 
            cell < 6 ? 1 :
            cell < 8 ? 2 :
            (0 | (cell * 0.25)),
        
        inner = 
            inner > 1 ? (0 | inner) : // large icon => truncate decimals
            inner > 0.5 ? 1 :         // medium size icon => fixed width
            inner,                    // small icon => anti-aliased border

        g.addRectangle(outer, outer, cell - inner - outer, cell - inner - outer)) :

    index == 4 ? (
        m = 0 | (cell * 0.15),
        w = 0 | (cell * 0.5),
        g.addCircle(cell - w - m, cell - w - m, w)) :

    index == 5 ? (
        inner = cell * 0.1,
        outer = inner * 4,

        // Align edge to nearest pixel in large icons
        outer > 3 && (outer = 0 | outer),
        
        g.addRectangle(0, 0, cell, cell),
        g.addPolygon([
            outer, outer,
            cell - inner, outer,
            outer + (cell - outer - inner) / 2, cell - inner
        ], true)) :

    index == 6 ? 
        g.addPolygon([
            0, 0,
            cell, 0,
            cell, cell * 0.7,
            cell * 0.4, cell * 0.4,
            cell * 0.7, cell,
            0, cell
        ]) :

    index == 7 ? 
        g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3) :

    index == 8 ? (
        g.addRectangle(0, 0, cell, cell / 2),
        g.addRectangle(0, cell / 2, cell / 2, cell / 2),
        g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 1)) :

    index == 9 ? (
        inner = cell * 0.14,
        // Use fixed outer border widths in small icons to ensure the border is drawn
        outer = 
            cell < 4 ? 1 :
            cell < 6 ? 2 :
            (0 | (cell * 0.35)),

        inner = 
            cell < 8 ? inner : // small icon => anti-aliased border
            (0 | inner),       // large icon => truncate decimals

        g.addRectangle(0, 0, cell, cell),
        g.addRectangle(outer, outer, cell - outer - inner, cell - outer - inner, true)) :

    index == 10 ? (
        inner = cell * 0.12,
        outer = inner * 3,

        g.addRectangle(0, 0, cell, cell),
        g.addCircle(outer, outer, cell - inner - outer, true)) :

    index == 11 ? 
        g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3) :

    index == 12 ? (
        m = cell * 0.25,
        g.addRectangle(0, 0, cell, cell),
        g.addRhombus(m, m, cell - m, cell - m, true)) :

    // 13
    (
        !positionIndex && (
            m = cell * 0.4, w = cell * 1.2,
            g.addCircle(m, m, w)
        )
    );
}

/**
 * @param {number} index
 * @param {Graphics} g
 * @param {number} cell
 */
export function outerShape(index, g, cell) {
    index = index % 4;

    let m;

    !index ?
        g.addTriangle(0, 0, cell, cell, 0) :
        
    index == 1 ?
        g.addTriangle(0, cell / 2, cell, cell / 2, 0) :

    index == 2 ?
        g.addRhombus(0, 0, cell, cell) :

    // 3
    (
        m = cell / 6,
        g.addCircle(m, m, cell - 2 * m)
    );
}
