/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./SvgLine", "./SvgBezier"], function (SvgLine, SvgBezier) {
    function simplifyByPoints(points, outLines) {
        points.sort(function (a, b) {
            return (
                // Sort by x coordinate
                a.x - b.x ||

                // Sort by y coordinate
                a.y - b.y ||

                // Ensure start points comes before end points => adjacent lines are merged
                b.s - a.s);
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
                        new SvgLine(start.x, start.y, point.x, point.y) :
                        new SvgLine(point.x, point.y, start.x, start.y));
                }
                start = null;
            }
        }
    }

    function simplify(lines) {
        lines.sort(function (a, b) {
            // By slope
            return a.dy - b.dy || a.intersect - b.intersect;
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
        this._beziers = [];
        this._lastPosition = { x: 0, y: 0 };
        this._startPosition = { x: 0, y: 0 };
    }
    SvgPath.prototype = {
        append: function (other) {
            if (other) {
                other.$closePath();
                this._lines = this._lines.concat(other._lines);
                this._beziers = this._beziers.concat(other._beziers);
            }
            return this;
        },
        $moveTo: function (x, y) {
            this._startPosition = { x: x, y: y };
            this._lastPosition = { x: x, y: y };
        },
        $lineTo: function (x, y) {
            var lastPosition = this._lastPosition;
            this._lines.push(new SvgLine(lastPosition.x, lastPosition.y, x, y));
            lastPosition.x = x;
            lastPosition.y = y;
        },
        $bezierCurveTo: function (cp1x, cp1y, cp2x, cp2y, x, y) {
            var lastPosition = this._lastPosition;
            this._beziers.push(new SvgBezier(
                lastPosition.x, lastPosition.y,
                x, y,
                cp1x, cp1y,
                cp2x, cp2y
                ));
            lastPosition.x = x;
            lastPosition.y = y;
        },
        $closePath: function () {
            var startPosition = this._startPosition,
                lastPosition = this._lastPosition;
            if (startPosition.x != lastPosition.x ||
                startPosition.y != lastPosition.y) {
                this._lines.push(new SvgLine(lastPosition.x, lastPosition.y, startPosition.x, startPosition.y));
                lastPosition.x = startPosition.x;
                lastPosition.y = startPosition.y;
            }
        },
        simplify: function () {
            var lines = simplify(this._lines).concat(this._beziers);
            var linesByPath = [];

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
                    var path = [pivot];
                    for (var i = 0; i < pathIndexes.length; i++) {
                        var lineIndex = pathIndexes[i];
                        linesByPath.push(lines[lineIndex]);
                        lines[lineIndex] = null;
                    }
                }
            }

            return linesByPath;
        }
    };
    
    return SvgPath;
});