SNQL.navigation = (function () {

    function openList(sql, defaultTable, { newTab } = {}) {
        let parsed;

        try {
            parsed = SNQL.sqlParser.parse(sql, defaultTable);
        } catch (e) {
            alert("SNQL error:\n" + e.message);
            return;
        }

        const table = parsed.table || defaultTable;
        if (!table) {
            alert("SNQL could not determine a table.");
            return;
        }

        const query =
            SNQL.compilers.serviceNow(parsed, { table });

        const url =
            "/" + table +
            "_list.do?sysparm_query=" +
            encodeURIComponent(query);

        newTab
            ? window.open(url, "_blank")
            : location.href = url;
    }

    return { openList };

})();
