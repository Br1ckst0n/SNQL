SNQL.autocompleteSuggestions = (function () {

    async function forContext(ctx) {
        const {
            context,
            currentTable,
            dotContext
        } = ctx;

        // -------- VALUE --------
        if (context === "VALUE") {
            const suggestions = [];

            if (ctx.leftOperand?.table && ctx.leftOperand?.column) {
                const { table, column } = ctx.leftOperand;

                const choices = await SNQL.metadata.getChoices(table, column);

                for (const c of choices) {
                    suggestions.push({
                        name: c.value,
                        label: c.label,
                        kind: "choice",
                        insertText: c.value
                    });
                }
            }

            const macros = SNQL.macros.getForContext(ctx) || [];
            for (const m of macros) {
                suggestions.push({
                    name: m.display,
                    label: m.label,
                    description: m.description,
                    kind: "macro",
                    insertText: m.display
                });
            }

            return suggestions;
        }

        // -------- TABLE --------
        if (context === "FROM") {

            const tables = await SNQL.metadata.getTables();

            return tables.map(t => ({
                name: t.name,
                label: t.label || t.name,
                kind: "table",
                insertText: t.name
            }));
        }

        // -------- COLUMN --------
        if (context === "WHERE" && currentTable) {
            const resolved =
                await SNQL.autocompleteResolver.resolveTable(
                    currentTable,
                    dotContext.path
                );

            if (!resolved) return [];

            const cols = await SNQL.metadata.getColumns(resolved);

            return cols.map(c => ({
                ...c,
                kind: "column",
                insertText: dotContext.path.length
                    ? [...dotContext.path, c.name].join(".")
                    : c.name
            }));
        }

        return [];
    }

    return { forContext };

})();
