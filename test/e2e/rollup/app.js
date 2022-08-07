import { testBrowser } from "../base-browser-test";

import * as jdenticonEsm from "jdenticon";
testBrowser(jdenticonEsm, "browser-esm");

import * as jdenticonEsmBrowser from "jdenticon/browser";
testBrowser(jdenticonEsmBrowser, "browser-esm");

import * as jdenticonEsmNode from "jdenticon/node";
testBrowser(jdenticonEsmNode, "node-esm");

import * as jdenticonUmd from "jdenticon/standalone";
testBrowser(jdenticonUmd, "browser-umd");