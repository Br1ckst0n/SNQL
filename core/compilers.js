SNQL.compilers = SNQL.compilers || {};

SNQL.compilers.serviceNow = function compileServiceNow(parsed, options = {}) {
    const parts = [];

    if (parsed.where) {
        parts.push(parsed.where);
    }

    if (parsed.groupBy?.length) {
        parsed.groupBy.forEach(f => {
            if (f) parts.push("GROUPBY" + f);
        });
    }

    if (parsed.orderBy?.length) {
        parsed.orderBy.forEach(o => {
            if (!o.field) return;
            parts.push(
                o.dir === "DESC"
                    ? "ORDERBYDESC" + o.field
                    : "ORDERBY" + o.field
            );
        });
    }

    return parts.join("^");
};
