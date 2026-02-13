SNQL.utils = SNQL.utils || {};

SNQL.utils.escape = (function () {

    function html(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    return { html };

})();
