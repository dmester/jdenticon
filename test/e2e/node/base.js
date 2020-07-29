const tap = require("tap");
const canvasRenderer = require("canvas-renderer");
const iconTest = require("./icons");

// The user might have modified the native object prototypes.
// It should not break Jdenticon.
Object.prototype.somethingOdd = function() {};
Object.prototype.nothing = null;
Object.prototype.anEmptyObject = {};

function testNode(jdenticon) {
    tap.test("jdenticon.version", t => {
        t.match(jdenticon.version, /^\d+(\.\d+)*$/);
        t.end();
    });

    tap.test("jdenticon.configure", t => {
        t.doesNotThrow(() => jdenticon.configure({ backColor: "#fff" }));
        t.end();
    });
    
    tap.test("jdenticon.drawIcon", t => {
        t.doesNotThrow(() => jdenticon.drawIcon(canvasRenderer.createCanvas(100, 100).getContext("2d"), "Icon1", 100));
        t.end();
    });
    
    tap.test("jdenticon.toPng", t => {
        t.isa(jdenticon.toPng("Icon1", 100), Buffer);
        iconTest(jdenticon);
        t.end();
    });
    
    tap.test("jdenticon.toSvg", t => {
        t.match(jdenticon.toSvg("Icon1", 100), /^<svg/);
        t.end();
    });
    
    tap.test("jdenticon.update*", t => {
        t.throws(() => jdenticon.update(), "jdenticon.update() is not supported on Node.js.");
        t.throws(() => jdenticon.updateCanvas(), "jdenticon.updateCanvas() is not supported on Node.js.");
        t.throws(() => jdenticon.updateSvg(), "jdenticon.updateSvg() is not supported on Node.js.");
        t.end();
    });
}

module.exports = testNode;
