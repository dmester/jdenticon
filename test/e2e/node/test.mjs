import tap from "tap";
import { bundle } from "jdenticon";
import * as jdenticon from "jdenticon";
import baseNode from "./base.js";

tap.test("jdenticon.bundle", t => {
    t.equal(bundle, "node-esm");
    t.end();
});

baseNode(jdenticon);
