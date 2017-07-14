"use strict";

var tap = require("tap");
var jdenticon = require("../index");

var expectedSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path fill="#c0e5b2" d="M29 18.5L39.5 8L50 18.5L39.5 29ZM60.5 8L71 18.5L60.5 29L50 18.5ZM71 81.5L60.5 92L50 81.5L60.5 71ZM39.5 92L29 81.5L39.5 71L50 81.5ZM8 39.5L18.5 29L29 39.5L18.5 50ZM81.5 29L92 39.5L81.5 50L71 39.5ZM92 60.5L81.5 71L71 60.5L81.5 50ZM18.5 71L8 60.5L18.5 50L29 60.5Z"/><path fill="#81cc66" d="M11.5 18.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M74.5 18.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M74.5 81.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M11.5 81.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M50 29L50 45L40 29ZM71 50L55 50L71 40ZM50 71L50 55L60 71ZM29 50L45 50L29 60Z"/></svg>';

tap.equal(expectedSvg, jdenticon.toSvg("Icon1", 100));
tap.equal(expectedSvg, jdenticon.toSvg("9faff4f3d6d7d75577ce810ec6d6a06be49c3a5a", 100));
