const tap = require("tap");
const canvasRenderer = require("canvas-renderer");

function testBrowser(jdenticon) {
    tap.test("jdenticon.bundle", t => {
        t.equal(jdenticon.bundle, "browser-esm");
        t.end();
    });

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

    tap.test("jdenticon.toSvg", t => {
        t.match(jdenticon.toSvg("Icon1", 100), /^<svg/);
        t.end();
    });

    tap.test("jdenticon.update*", t => {
        t.isa(jdenticon.update, Function);
        t.isa(jdenticon.updateCanvas, Function);
        t.isa(jdenticon.updateSvg, Function);
        t.end();
    });
}

module.exports = testBrowser;
