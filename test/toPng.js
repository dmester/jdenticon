"use strict";

var tap = require("tap");
var jdenticon = require("../index");

var pngHash = jdenticon.toPng("Icon1", 100);
var pngValue = jdenticon.toPng("9faff4f3d6d7d75577ce810ec6d6a06be49c3a5a", 100);

tap.ok(pngHash);
tap.ok(pngHash instanceof Buffer);
tap.ok(pngHash.length > 500);

tap.ok(pngValue);
tap.ok(pngValue instanceof Buffer);
tap.ok(pngValue.length > 500);

tap.ok(pngHash.equals(pngValue));
