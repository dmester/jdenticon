/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define(["./SvgPath", "./SvgLine", "./SvgBezier"], function (SvgPath, SvgLine, SvgBezier) {

    function SvgContext(width, height) {
        this._size = { w: width, h: height };
        this._savedTranslations = [];
        this._translation = { x: 0, y: 0 };
        this._pathsByColor = {};
    }
    SvgContext.prototype = {
        "moveTo": function (x, y) {
            var translation = this._translation;
            this._path.$moveTo(
                x + translation.x, y + translation.y);
        },
        "lineTo": function (x, y) {
            var translation = this._translation;
            this._path.$lineTo(
                x + translation.x, y + translation.y);
        },
        "bezierCurveTo": function (cp1x, cp1y, cp2x, cp2y, x, y) {
            var translation = this._translation;
            this._path.$bezierCurveTo(
                cp1x + translation.x, cp1y + translation.y,
                cp2x + translation.x, cp2y + translation.y,
                x + translation.x, y + translation.y
                );
        },
        "beginPath": function () {
            this._path = new SvgPath();
        },
        "closePath": function () {
            this._path.$closePath();
        },
        "fill": function () {
            var fillStyle = this.fillStyle;
            if (fillStyle) {
                this._path.$closePath();
                this._pathsByColor[fillStyle] = this._path.append(this._pathsByColor[fillStyle]);
            }
        },
        "save": function () {
            this._savedTranslations.push(this._translation);
            this._translation = { x: this._translation.x, y: this._translation.y };
        },
        "restore": function () {
            if (this._savedTranslations.length) {
                this._translation = this._savedTranslations.pop();
            }
        },
        "clearRect": function () {
        },
        "translate": function translate(dx, dy) {
            this._translation.x += dx;
            this._translation.y += dy;
        },
        toSvg: function (fragment) {
            var svg = '';
            
            if (!fragment) {
                svg = '<svg width="' + this._size.w + '" height="' + this._size.h + '" version="1.1" xmlns="http://www.w3.org/2000/svg">';
            }

            for (var color in this._pathsByColor) {
                svg += '<path fill="' + color + '" d="';

                var lastLine,
                    path = this._pathsByColor[color].simplify();

                for (var i = 0; i < path.length; i++) {
                    var line = path[i];

                    if (!lastLine || lastLine.x1 != line.x0 || lastLine.y1 != line.y0) {
                        svg += 'M ' + line.x0 + ' ' + line.y0 + ' ';
                    }
                    lastLine = line;

                    if (line instanceof SvgLine) {
                        svg += 'L ' + line.x1 + ' ' + line.y1 + ' ';
                    } else if (line instanceof SvgBezier) {
                        svg += 'C ' +
                            line.cp1x + ' ' +
                            line.cp1y + ', ' +
                            line.cp2x + ' ' +
                            line.cp2y + ', ' +
                            line.x1 + ' ' +
                            line.y1 + ' ';
                    }
                }

                svg += '"/>';
            }

            if (!fragment) {
                svg += '</svg>';
            }

            return svg;
        }
    };

    return SvgContext;
});