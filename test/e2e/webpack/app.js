import { testBrowser } from "../base-browser-test";

import * as jdenticonEsm from "jdenticon";
testBrowser(jdenticonEsm, "browser-esm");

import * as jdenticonUmd from "jdenticon/standalone";
testBrowser(jdenticonUmd, "browser-umd");