/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const sha1 = require("./sha1");

var hashUtils = {
    /**
     * Inputs a value that might be a valid hash string for Jdenticon and returns it 
     * if it is determined valid, otherwise a falsy value is returned.
     */
    validHash: function (hashCandidate) {
        return /^[0-9a-f]{11,}$/i.test(hashCandidate) && hashCandidate;
    },

    /**
     * Computes a hash for the specified value. Currnently SHA1 is used. This function
     * always returns a valid hash.
     */
    computeHash: function (value) {
        return sha1(value == null ? "" : "" + value);
    }
};

module.exports = hashUtils;
