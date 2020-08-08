/**
 * @typedef {import('./point').Point} Point
 */

/**
 * @typedef {Object} Renderer
 * @property {number} iconSize
 * @property {function(string):void} setBackground  Fills the background with the specified color.
 * @property {function(string):void} beginShape  Marks the beginning of a new shape of the specified color. Should be
 *     ended with a call to endShape.
 * @property {function():void} endShape  Marks the end of the currently drawn shape. This causes the queued paths to
 *     be rendered on the canvas.
 * @property {function(Point[]):void} addPolygon  Adds a polygon to the rendering queue.
 * @property {function(Point,number,boolean):void} addCircle  Adds a circle to the rendering queue.
 * @property {function():void} finish  Called when the icon has been completely drawn.
 */

export default class {}
