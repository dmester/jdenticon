const tap = require("tap");
const jdenticon = require("jdenticon");
const baseNode = require("./base");

tap.test("jdenticon.bundle", t => {
    t.equal(jdenticon.bundle, "node-cjs");
    t.end();
});

tap.test("jdenticon.config", t => {
    const originalConsoleWarn = console.warn;
    const warn = [];

    console.warn = function () {
        warn.push(Array.prototype.join.call(arguments, ""));
    }

    try {
        jdenticon.config = {};
    } finally {
        console.warn = originalConsoleWarn;
    }

    t.equivalent(warn, ["jdenticon.config is deprecated. Use jdenticon.configure() instead."]);
    t.end();
});

baseNode(jdenticon);


