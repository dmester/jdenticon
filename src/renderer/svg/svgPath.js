/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

/**
 * Prepares a measure to be used as a measure in an SVG path, by
 * rounding the measure to a single decimal. This reduces the file
 * size of the generated SVG with more than 50% in some cases.
 */
function svgValue(value) {
    return ((value * 10 + 0.5) | 0) / 10;
}

/**
 * Represents an SVG path element.
 */
export class SvgPath {
    constructor() {
        /**
         * This property holds the data string (path.d) of the SVG path.
         */
        this.dataString = "";
    }

    /**
     * Adds a polygon with the current fill color to the SVG path.
     * @param points An array of Point objects.
     */
    addPolygon(points) {
        let dataString = "";
        for (let i = 0; i < points.length; i++) {
            dataString += (i ? "L" : "M") + svgValue(points[i].x) + " " + svgValue(points[i].y);
        }
        this.dataString += dataString + "Z";
    }

    /**
     * Adds a circle with the current fill color to the SVG path.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle(point, diameter, counterClockwise) {
        const sweepFlag = counterClockwise ? 0 : 1,
              svgRadius = svgValue(diameter / 2),
              svgDiameter = svgValue(diameter),
              svgArc = "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " ";
            
        this.dataString += 
            "M" + svgValue(point.x) + " " + svgValue(point.y + diameter / 2) +
            svgArc + svgDiameter + ",0" + 
            svgArc + (-svgDiameter) + ",0";
    }
}

