/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { Point } from "./point";

/**
 * Translates and rotates a point before being passed on to the canvas context. This was previously done by the canvas context itself, 
 * but this caused a rendering issue in Chrome on sizes > 256 where the rotation transformation of inverted paths was not done properly.
 */
export class Transform {
    /**
     * @param {number} x The x-coordinate of the upper left corner of the transformed rectangle.
     * @param {number} y The y-coordinate of the upper left corner of the transformed rectangle.
     * @param {number} size The size of the transformed rectangle.
     * @param {number} rotation Rotation specified as 0 = 0 rad, 1 = 0.5π rad, 2 = π rad, 3 = 1.5π rad
     */
    constructor(x, y, size, rotation) {
        this._x = x;
        this._y = y;
        this._size = size;
        this._rotation = rotation;
    }

    /**
     * Transforms the specified point based on the translation and rotation specification for this Transform.
     * @param {number} x x-coordinate
     * @param {number} y y-coordinate
     * @param {number=} w The width of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
     * @param {number=} h The height of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
     */
    transformIconPoint(x, y, w, h) {
        const right = this._x + this._size,
              bottom = this._y + this._size,
              rotation = this._rotation;
        return rotation === 1 ? new Point(right - y - (h || 0), this._y + x) :
               rotation === 2 ? new Point(right - x - (w || 0), bottom - y - (h || 0)) :
               rotation === 3 ? new Point(this._x + y, bottom - x - (w || 0)) :
               new Point(this._x + x, this._y + y);
    }
}

export const NO_TRANSFORM = new Transform(0, 0, 0, 0);
