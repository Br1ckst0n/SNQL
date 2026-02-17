SNQL.navigation = (function () {

    function buildUrl(sql, defaultTable) {

        let parsed;

        try {
            parsed = SNQL.sqlParser.parse(sql, defaultTable);
        } catch (e) {
            alert("SNQL error:\n" + e.message);
            return null;
        }

        const table = parsed.table || defaultTable;
        if (!table) {
            alert("SNQL could not determine a table.");
            return null;
        }

        const query =
            SNQL.compilers.serviceNow(parsed, { table });

        return location.origin + "/" + table + "_list.do?sysparm_query=" + encodeURIComponent(query);

    }

    return { buildUrl };

})();
