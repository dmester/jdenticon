/**
 * Jdenticon #version#
 * http://jdenticon.com
 *  
 * Built: #date#
 *
 * #license#
 */

(function (global, factory) {
    var jQuery = global && global["jQuery"],
        jdenticon = factory(global, jQuery);

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
        global["jdenticon"] = jdenticon;
    }
})(typeof self !== "undefined" ? self : this, function (global, jQuery) {
/*content*/
});