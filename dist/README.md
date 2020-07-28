# What file should I use?

## Overview

| Platform | Bundle           | File name            |
|----------|------------------|----------------------|
| Browser  | Standalone (UMD) | jdenticon.js         |
|          |                  | jdenticon.min.js     |
|          | ES module        | jdenticon-module.mjs |
|          | CommonJS module  | jdenticon-module.js  |
| Node.js  | ES module        | jdenticon-node.mjs   |
|          | CommonJS module  | jdenticon-node.js    |

## Node vs browser
There are separate bundles for Node.js and browsers. The Node.js bundles contain support for generating PNG icons, while the browser bundles have support for updating DOM elements. It is important that the right bundle is used, since a web application bundle will be significally larger if the Node bundle is imported instead of the browser bundle.

## Don't address `dist/*` directly
In first hand, don't import a specific file from the `dist` folder. Instead import the Jdenticon package and let the package decide what file to be imported.

Jdenticon has multiple public entry points:

### ES module

For browsers `jdenticon-module.mjs` is imported and in Node.js environments `jdenticon-node.mjs` is imported. This is the preferred way of using Jdenticon since your bundler will most likely be able to eliminiate code from Jdenticon not used in your application (a.k.a. tree-shaking).

**Example**

```js
import { toSvg } from "jdenticon";

console.log(toSvg("my value", 100));
```

### CommonJS module

If Jdenticon is imported on platforms not supporting ES modules, `jdenticon-module.js` is imported for browser environments and `jdenticon-node.js` in Node.js environments.

**Example**

```js
const { toSvg } = require("jdenticon");
console.log(toSvg("my value", 100));
// or
const jdenticon = require("jdenticon");
console.log(jdenticon.toSvg("my value", 100));
```

### Standalone browser package

This package will render icons automatically at startup and also provides a legacy jQuery plugin, if jQuery is loaded before Jdenticon.

**Example**

```js
import "jdenticon/standalone";

// or

import { toSvg } from "jdenticon/standalone";
console.log(toSvg("my value", 100));
```