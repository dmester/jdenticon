/**
 * Jdenticon #version#
 * http://jdenticon.com
 *  
 * Built: #date#
 *
 * #license#
 */

(function (umdGlobal, factory) {
    var jdenticon = factory(umdGlobal);

    // Node.js
    if (typeof module !== "undefined" && "exports" in module) {
        module["exports"] = jdenticon;
    }
    // RequireJS
    else if (typeof define === "function" && define["amd"]) {
        define([], function () { return jdenticon; });
    }
    // No module loader
    else {
        umdGlobal["jdenticon"] = jdenticon;
    }
})(typeof self !== "undefined" ? self : this, function (umdGlobal) {
/*content*/
});