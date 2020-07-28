
addEventListener("message", function (ev) {
    var data = JSON.parse(ev.data);

    if ("scrollHeight" in data) {
        var iframe = document.getElementsByName(data.name);
        if (iframe && iframe.length) {
            iframe[0].style.height = data.scrollHeight + "px";
        }
    }
});

function postHeight(timeout) {
    setTimeout(function () {
        // IE9 does not support passing objects through postMessage
        window.parent.postMessage(JSON.stringify({
            scrollHeight: document.body.scrollHeight,
            name: window.name
        }), "*");
    }, timeout);
}

if (window.parent) {
    postHeight(0);
    postHeight(1000);
    addEventListener("resize", postHeight);
}