SNQL.autocompleteContext = (function () {

    const {
        inferTable,
        getContext,
        parseDotContext
    } = SNQL.grammar;

    function getActiveClause(tokens) {
        let depth = 0;
        let start = 0;

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i]?.trim();
            if (!t) continue;

            if (t === "(") depth++;
            else if (t === ")") depth--;

            if (
                depth === 0 &&
                (t.toUpperCase() === "AND" || t.toUpperCase() === "OR")
            ) {
                start = i + 1;
            }
        }

        while (tokens[start] && !tokens[start].trim()) {
            start++;
        }

        return tokens.slice(start);
    }

    async function resolveLeftOperand(tokens, currentTable) {
        const expr = tokens.join("").trim();

        const match = expr.match(
            /([a-zA-Z_][a-zA-Z0-9_.]*)\s*(=|!=|>|<|>=|<=|IN|LIKE)\s*$/i
        );

        if (!match) return null;

        const parts = match[1].split(".");

        let table, column;

        if (parts.length === 1) {
            table = currentTable;
            column = parts[0];
        } else if (parts.length === 2) {
            table = parts[0];
            column = parts[1];
        } else {
            return null;
        }

        const columns = await SNQL.metadata.getColumns(table);
        const meta = columns.find(c => c.name === column);

        if (!meta) {
            return { table, column };
        }

        return {
            table,
            column,
            type: meta.type,
            reference: meta.reference
        };
    }

    function isInsideWhere(tokens) {
        return tokens.some(t => t?.toUpperCase?.() === "WHERE");
    }

    async function get(text, cursor, defaultTable) {
        const before = text.slice(0, cursor);
        const tokens = SNQL.tokens.tokenizeWithSpaces(before);

        const activeTokens = getActiveClause(tokens);

        const wordMatch = before.match(/([a-zA-Z_][a-zA-Z0-9_.]*)$/);
        const word = wordMatch ? wordMatch[1] : "";

        const inferredTable = inferTable(tokens);
        const currentTable = inferredTable || defaultTable || null;

        let context = getContext(activeTokens);

        if (context === "START" && isInsideWhere(tokens)) {
            context = "WHERE";
        }

        const ctx = {
            tokens,
            activeTokens,
            word,
            context,
            currentTable,
            dotContext: parseDotContext(word)
        };

        if (context === "VALUE" && currentTable) {
            ctx.leftOperand = await resolveLeftOperand(activeTokens, currentTable);
        }

        return ctx;
    }

    return { get };

})();
