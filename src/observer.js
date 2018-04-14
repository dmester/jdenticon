/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon.
 */
"use strict";

const dom = require("./dom");

var observer = {
    initObserver: initObserver,
    observeNewElements: observeNewElements,
    observeAttributes: observeAttributes
};

var mutationObserver;

function onmutation(mutations) {
    if (observer.updateCallback) {
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];

            if (mutation.type == "attributes") {
                console.log("Updated attribute", mutation.attributeName);
                observer.updateCallback(mutation.target);
            }
            else {
                var addedNodes = mutation.addedNodes;
                for (var j = 0; addedNodes && j < addedNodes.length; j++) {
                    var addedNode = addedNodes[j];
                    if (dom.getIdenticonType(addedNode)) {
                        console.log("New el");
                        observer.updateCallback(addedNode);
                    }
                    else {
                        var icons = addedNode.querySelectorAll("[" + dom.HASH_ATTRIBUTE + "],[" + dom.VALUE_ATTRIBUTE + "]");
                        for (var k = 0; k < icons.length; k++) {
                            console.log("New el");
                            if (dom.getIdenticonType(icons[k])) {
                                observer.updateCallback(icons[k]);
                            }
                        }
                    }
                }
            }
        }
    }
}

function initObserver() {
    if (typeof MutationObserver == "undefined") {
        console.log("replaceMode continuous not supported in this browser.");
    }
    else {
        mutationObserver = new MutationObserver(onmutation);
    }
}

function observeNewElements() {
    if (mutationObserver) {
        mutationObserver.observe(document.body, { childList: true });
    }
}

function observeAttributes(el) {
    if (mutationObserver && !el["__jdm"]) {
        mutationObserver.observe(el, { "attributes": true, "attributeFilter": [dom.HASH_ATTRIBUTE, dom.VALUE_ATTRIBUTE, "width", "height"] });
        el["__jdm"] = true;
    }
}

module.exports = observer;
