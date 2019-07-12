/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const parseHex = require("./parseHex");

/**
 * Computes a SHA1 hash for any value and returns it as a hexadecimal string.
 * @param {string} message 
 */
function sha1(message) {
    /**
     * Converts an array of 32-bit unsigned numbers to a hexadecimal string in big endian format.
     * @param {Array<number>} words
     */
    function wordsToHexString(words) {
        var hashOctets = [];
        for (var i = 0; i < words.length; i++) {
            var val = words[i];
           
            for (var shift = 28; shift >= 0; shift -= 4) {
                var octet = (val >>> shift) & 0xf;
                hashOctets.push(octet.toString(16));
            }
        }

        return hashOctets.join("");
    }
    
    /**
     * Converts the specified message to a sequence of UTF8 encoded and padded 64 byte blocks.
     * @param {string} message  Any value that will be padded to 64 byte blocks.
     */
    function getBlocks(message) {
        var percentEncoded = encodeURI(message),
            binaryMessage = [],
            binaryMessageLength = 0,
            i, b,

            blocks = [],

            BLOCK_SIZE_BYTES = 64,
            BLOCK_SIZE_WORDS = BLOCK_SIZE_BYTES >>> 2,
            MESSAGE_LENGTH_SIZE_BYTES = 8;

        // UTF8 encode message
        for (i = 0; i < percentEncoded.length; i++) {
            if (percentEncoded[i] == "%") {
                b = parseHex(percentEncoded, i + 1, 2);
                i += 2;
            }
            else {
                b = percentEncoded.charCodeAt(i);
            }
            binaryMessage[binaryMessageLength++] = b;
        }

        // Trailing '1' bit
        binaryMessage[binaryMessageLength++] = 0x80;
        
        function getWordBlock(startIndex, byteCount) {
            var words = [];
            var wordIndex = -1;
            
            for (var i = 0; i < byteCount; i++) {
                wordIndex = (i / 4) | 0;
                words[wordIndex] = (words[wordIndex] || 0) +
                    (binaryMessage[startIndex + i] << ((3 - (i & 3)) * 8));
            }
            
            while (++wordIndex < BLOCK_SIZE_WORDS) {
                words[wordIndex] = 0;
            }

            return words;
        }

        // Full blocks
        for (i = 0; i + BLOCK_SIZE_BYTES <= binaryMessageLength; i+= BLOCK_SIZE_BYTES) {
            blocks.push(getWordBlock(i, BLOCK_SIZE_BYTES));
        }

        // Final block(s)
        // Rest of message
        var lastBlockDataLength = binaryMessageLength - i;
        
        var block = getWordBlock(i, lastBlockDataLength);
        
        // If there is no room for the message size in this block, 
        // return the block and put the size in the following block.
        if (lastBlockDataLength + MESSAGE_LENGTH_SIZE_BYTES > BLOCK_SIZE_BYTES) {
            // Message size goes in next block
            blocks.push(block);
            block = getWordBlock(0, 0);
        }

        var messageSizeBits = binaryMessageLength * 8 - 8;
        block[BLOCK_SIZE_WORDS - 1] = messageSizeBits;
        blocks.push(block);

        return blocks;
    }

    /**
     * Rotates the value a specified number of bits to the left.
     * @param {number} value  Value to rotate
     * @param {number} shift  Bit count to shift.
     */
    function rotl(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }
    
    /**
     * Computes a SHA1 hash for the specified array of 64 byte blocks.
     * @param {Array<Array<number>>} blocks 
     */
    function computeHash(blocks) {
        var a = 0x67452301,
            b = 0xefcdab89,
            c = 0x98badcfe,
            d = 0x10325476,
            e = 0xc3d2e1f0,
            hash = [a, b, c, d, e];

        for (var i = 0; i < blocks.length; i++) {
            var w = blocks[i];

            for (var t = 16; t < 80; t++) {
                w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
            }

            for (var t = 0; t < 80; t++) {
                var f =
                    // Ch
                    t < 20 ? ((b & c) ^ ((~b) & d)) + 0x5a827999 :
                    
                    // Parity
                    t < 40 ? (b ^ c ^ d) + 0x6ed9eba1 :
                    
                    // Maj
                    t < 60 ? ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc :
                    
                    // Parity
                    (b ^ c ^ d) + 0xca62c1d6;

                var T = rotl(a, 5) + f + e + w[t];

                e = d;
                d = c;
                c = rotl(b, 30);
                b = a;
                a = T | 0;
            }

            hash[0] = a = ((hash[0] + a) | 0);
            hash[1] = b = ((hash[1] + b) | 0);
            hash[2] = c = ((hash[2] + c) | 0);
            hash[3] = d = ((hash[3] + d) | 0);
            hash[4] = e = ((hash[4] + e) | 0);
        }

        return hash;
    }

    return wordsToHexString(computeHash(getBlocks(message)));
}

module.exports = sha1;
