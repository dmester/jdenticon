/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { parseHex } from "./parseHex";

/**
 * Computes a SHA1 hash for any value and returns it as a hexadecimal string.
 * @param {string} message 
 */
export function sha1(message) {
    const BLOCK_SIZE_BYTES = 64;
    const BLOCK_SIZE_WORDS = BLOCK_SIZE_BYTES >>> 2;
    const MESSAGE_LENGTH_SIZE_BYTES = 8;

    /**
     * Converts an array of 32-bit unsigned numbers to a hexadecimal string in big endian format.
     * @param {Array<number>} words
     */
    function wordsToHexString(words) {
        const hashOctets = [];
        for (let i = 0; i < words.length; i++) {
            const val = words[i];
           
            for (let shift = 28; shift >= 0; shift -= 4) {
                const octet = (val >>> shift) & 0xf;
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
        const percentEncoded = encodeURI(message),
            binaryMessage = [],
            blocks = [];

        let binaryMessageLength = 0, b, i;

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
            const words = [];
            let wordIndex = -1;
            
            for (let i = 0; i < byteCount; i++) {
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
        const lastBlockDataLength = binaryMessageLength - i;
        
        let block = getWordBlock(i, lastBlockDataLength);
        
        // If there is no room for the message size in this block, 
        // return the block and put the size in the following block.
        if (lastBlockDataLength + MESSAGE_LENGTH_SIZE_BYTES > BLOCK_SIZE_BYTES) {
            // Message size goes in next block
            blocks.push(block);
            block = getWordBlock(0, 0);
        }

        const messageSizeBits = binaryMessageLength * 8 - 8;
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
        let a = 0x67452301,
            b = 0xefcdab89,
            c = 0x98badcfe,
            d = 0x10325476,
            e = 0xc3d2e1f0;

        const hash = [a, b, c, d, e];

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];

            for (let t = 16; t < 80; t++) {
                block[t] = rotl(block[t - 3] ^ block[t - 8] ^ block[t - 14] ^ block[t - 16], 1);
            }

            for (let t = 0; t < 80; t++) {
                const f =
                    // Ch
                    t < 20 ? ((b & c) ^ ((~b) & d)) + 0x5a827999 :
                    
                    // Parity
                    t < 40 ? (b ^ c ^ d) + 0x6ed9eba1 :
                    
                    // Maj
                    t < 60 ? ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc :
                    
                    // Parity
                    (b ^ c ^ d) + 0xca62c1d6;

                const T = rotl(a, 5) + f + e + block[t];

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
