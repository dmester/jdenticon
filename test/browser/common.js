
addEventListener("message", function (ev) {
    if ("scrollHeight" in ev.data) {
        var iframe = document.getElementsByName(ev.data.name);
        if (iframe && iframe.length) {
            iframe[0].style.height = ev.data.scrollHeight + "px";
        }
    }
});

function postHeight(timeout) {
    setTimeout(function () {
        window.parent.postMessage({
            scrollHeight: document.body.scrollHeight,
            name: window.name
        }, "*");
    }, timeout);
}

if (window.parent) {
    postHeight(0);
    postHeight(1000);
    addEventListener("resize", postHeight);
}