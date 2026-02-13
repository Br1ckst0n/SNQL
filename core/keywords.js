SNQL.keywords = (function () {

    const SUPPORTED = new Set([
        "AND", "OR", "IN", "NOT", "IS", "NULL", "LIKE",
        "WHERE", "FROM", "GROUP", "BY", "ORDER", "ASC", "DESC"
    ]);

    const UNSUPPORTED = new Set([
        "SELECT", "HAVING", "LIMIT"
    ]);

    return {
        SUPPORTED,
        UNSUPPORTED
    };

})();
