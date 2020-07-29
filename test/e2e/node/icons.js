"use strict";

const tap = require("tap");
const fs = require("fs");
const path = require("path");

const expectedDir = path.join(__dirname, "expected");

function equal(buf1, buf2) {
    if (buf1.length !== buf2.length) {
        return false;
    }
    
    for (let i = 0; i < buf1.length; i++) {
        if (buf1.readUInt8(i) !== buf2.readUInt8(i)) {
            return false;
        }
    }
    
    return true;
}

function test(jdenticon, icon, style) {
    jdenticon.configure(style);
    
    // PNG
    {
        const actual = jdenticon.toPng(icon, 50);
        const expected = fs.readFileSync(path.join(expectedDir, icon +".png"));
        
        if (!equal(actual, expected)) {
            fs.writeFileSync(path.join(expectedDir, icon +"-actual.png"), actual);
            tap.ok(false, "Icon '" + icon + "' failed PNG test.");
        }
        else {
            tap.ok(true);
        }
    }

    // SVG
    {
        const actual = jdenticon.toSvg(icon, 50);
        const expected = fs.readFileSync(path.join(expectedDir, icon +".svg"));
        
        if (actual !== expected.toString()) {
            fs.writeFileSync(path.join(expectedDir, icon + "-actual.svg"), actual);
            tap.ok(false, "Icon '" + icon + "' failed SVG test.");
            console.log(expected.toString());
            console.log(actual);
        }
        else {
            tap.ok(true);
        }
    }
}

function testIcons(jdenticon) {
    test(jdenticon, 73, {
        backColor: "#fff"
    });

    test(jdenticon, 76, {
        hues: [ 134 /*green*/, 0 /*red*/, 60 /*yellow*/ ],
        lightness: {
            color: [0.29, 0.53],
            grayscale: [0.19, 0.40]
        },
        saturation: {
            color: 0.45,
            grayscale: 0.72
        },
        backColor: "#0000002a"
    });

    test(jdenticon, 39, {
        hues: [ 134 /*green*/, 0 /*red*/, 60 /*yellow*/ ],
        lightness: {
            color: [0.65, 0.86],
            grayscale: [0.00, 1.00]
        },
        saturation: {
            color: 0.34,
            grayscale: 0.10
        },
        backColor: "#ffffffff"
    });

    test(jdenticon, 50, {
        backColor: "#fff"
    });
}

module.exports = testIcons;