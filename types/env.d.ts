/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

// Allow Jdenticon to be used in Node environments without referencing the "dom" lib.
// An alternative is to use <reference lib="dom" />, but it leaks to the user code base, so this is probably a
// safer option.
interface Element { }

// By declaring Buffer without including the Node typings, we can avoid type issues related to differences
// between Node and browser typings, e.g. the return type of setTimeout. The user can import the Node typings
// if desired.
declare module "buffer" {
    global {
        interface Buffer { }
    }
}
