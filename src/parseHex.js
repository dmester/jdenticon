/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

/**
 * Parses a substring of the hash as a number.
 * @param {number} startPosition 
 * @param {number=} octets 
 * @noinline
 */
function parseHex(hash, startPosition, octets) {
    return parseInt(hash.substr(startPosition, octets), 16);
}

module.exports = parseHex;
