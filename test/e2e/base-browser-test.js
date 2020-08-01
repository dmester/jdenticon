const tap = require("tap");
const canvasRenderer = require("canvas-renderer");

export function testBrowser(jdenticon, bundle) {
    tap.test(bundle, bundleTest => {
        bundleTest.test("jdenticon.bundle", t => {
            t.equal(jdenticon.bundle, bundle);
            t.end();
        });

        bundleTest.test("jdenticon.version", t => {
            t.match(jdenticon.version, /^\d+(\.\d+)*$/);
            t.end();
        });

        bundleTest.test("jdenticon.configure", t => {
            t.doesNotThrow(() => jdenticon.configure({ backColor: "#fff" }));
            t.end();
        });

        bundleTest.test("jdenticon.drawIcon", t => {
            t.doesNotThrow(() => jdenticon.drawIcon(canvasRenderer.createCanvas(100, 100).getContext("2d"), "Icon1", 100));
            t.end();
        });

        bundleTest.test("jdenticon.toSvg", t => {
            t.match(jdenticon.toSvg("Icon1", 100), /^<svg/);
            t.end();
        });

        bundleTest.test("jdenticon.update*", t => {
            t.isa(jdenticon.update, Function);
            t.isa(jdenticon.updateCanvas, Function);
            t.isa(jdenticon.updateSvg, Function);
            t.end();
        });

        bundleTest.end();
    });
}
