
(function () {
    "use strict";

    function blockKeys(event) {
        var key = (event.key || "").toLowerCase();

        if (
            event.key === "F12" ||
            (event.ctrlKey && event.shiftKey && ["i", "j", "c"].indexOf(key) !== -1) ||
            (event.ctrlKey && key === "u") ||
            (event.metaKey && event.altKey && ["i", "j", "c"].indexOf(key) !== -1)
        ) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function blockContextMenu(event) {
        event.preventDefault();
    }

    document.addEventListener("keydown", blockKeys, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
})();
