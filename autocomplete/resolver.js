SNQL.autocompleteResolver = (function () {

    async function resolveTable(baseTable, path) {
        let table = baseTable;

        for (const field of path) {
            const cols = await SNQL.metadata.getColumns(table);
            const col = cols.find(c => c.name === field);

            if (!col || !col.reference) return null;
            table = col.reference;
        }

        return table;
    }

    return { resolveTable };

})();
