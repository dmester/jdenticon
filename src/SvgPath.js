/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./Line"], function (Line) {
    function simplifyByPoints(points, outLines) {
        points.sort(function (a, b) {
            return (
                // Sort by x coordinate
                (a.x - b.x) ||

                // Sort by y coordinate
                (a.y - b.y) ||

                // Ensure start points comes before end points => adjacent lines are merged
                (b.s - a.s));
        });

        var start = null,
            count = 0,
            countRev = 0,
            point,
            dn,
            activeLine;

        for (var i = 0; i < points.length; i++) {
            point = points[i];
            dn = point.s ? 1 : -1;
            if (point.r) {
                countRev += dn;
            }
            else {
                count += dn;
            }

            activeLine = (count == 0) != (countRev == 0);

            if (!start && activeLine) {
                start = point;
            }
            else if (start && !activeLine) {
                if (start.x != point.x || start.y != point.y) {
                    outLines.push(start.s ?
                        new Line(start.x, start.y, point.x, point.y) :
                        new Line(point.x, point.y, start.x, start.y));
                }
                start = null;
            }
        }
    }

    function simplify(lines) {
        lines.sort(function (a, b) {
            // By slope
            return (a.dy - b.dy) || (a.intersect - b.intersect);
        });

        var outLines = [],
            points,
            pivot,
            line;

        for (var i = 0; i < lines.length; i++) {
            line = lines[i];
            
            if (pivot) {
                if (pivot.dy != line.dy ||
                    pivot.intersect != line.intersect) {
                    simplifyByPoints(points, outLines);
                    pivot = null;
                }
            }
            if (!pivot) {
                pivot = line;
                points = [];
            }

            points.push({
                x: line.x0,
                y: line.y0,
                r: line.r,
                s: true
            });
            points.push({
                x: line.x1,
                y: line.y1,
                r: line.r,
                s: false
            });
        }

        if (points) {
            simplifyByPoints(points, outLines);
        }

        return outLines;
    }

    function SvgPath() {
        this._lines = [];
        this._circles = "";
    }
    SvgPath.prototype = {
        addPolygon: function (points) {
            for (var i = 1; i < points.length; i++) {
                this._lines.push(new Line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y));
            }
        },
        addCircle: function (point, size, invert) {
            var sweepFlag = invert ? 0 : 1,
                radius = size / 2;
            this._circles += 
                " M " + (point.x) + " " + (point.y + radius) +
                " a " + radius + "," + radius + " 0 1," + sweepFlag + " " + size + ",0" + 
                " a " + radius + "," + radius + " 0 1," + sweepFlag + " " + (-size) + ",0";
        },
        toSvg: function () {
            var lines = simplify(this._lines);
            var path = "";

            for (var pi = 0; pi < lines.length; pi++) {
                if (!lines[pi]) continue;

                var pivot = lines[pi];
                var pathIndexes = [pi];
                var pathIndexes2 = { pi: true };

                var cursor = pivot;
                for (var i = pi + 1; i < lines.length && (pivot.x0 != cursor.x1 || pivot.y0 != cursor.y1) ; i++) {
                    if (!lines[i] || pathIndexes2[i]) continue;
                    if (lines[i].x0 == cursor.x1 && lines[i].y0 == cursor.y1) {
                        cursor = lines[i];
                        pathIndexes.push(i);
                        pathIndexes2[i] = true;
                        i = pi;
                    }
                }

                if (cursor.x1 == pivot.x0 && cursor.y1 == pivot.y0) {
                    // Closed path
                    var line = lines[pathIndexes[0]];
                    path += " M " + line.x0 + " " + line.y0;
                    for (var i = 0; i < pathIndexes.length; i++) {
                        var lineIndex = pathIndexes[i];
                        line = lines[lineIndex];
                        lines[lineIndex] = null;
                        path += " L " + line.x1 + " " + line.y1;
                    }
                }
            }

            return (path + this._circles).replace(/^\s+/, "");
        }
    };
    
    return SvgPath;
});