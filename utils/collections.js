SNQL.utils.collections = (function () {

    function unique(arr) {
        return Array.from(new Set(arr));
    }

    function normalizeArray(v) {
        if (!v) return [];
        return Array.isArray(v) ? v : [v];
    }

    function findIgnoreCase(arr, value) {
        const v = value.toLowerCase();
        return arr.find(x => String(x).toLowerCase() === v);
    }

    function toSetIgnoreCase(arr) {
        return new Set(arr.map(v => String(v).toUpperCase()));
    }

    return {
        unique,
        normalizeArray,
        findIgnoreCase,
        toSetIgnoreCase
    };

})();
