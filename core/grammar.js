SNQL.grammar = (function () {

    function inferTable(tokens) {
        let lastKeyword = null;

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i]?.trim();
            if (!t) continue;

            const upper = t.toUpperCase();

            if (lastKeyword === "FROM") {
                return t;
            }

            if (upper === "FROM") {
                lastKeyword = "FROM";
                continue;
            }

            if (
                !lastKeyword &&
                /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t) &&
                upper !== "WHERE"
            ) {
                return t;
            }
        }

        return null;
    }


    function getContext(tokens) {
        let context = "START";

        for (const raw of tokens) {
            const t = raw.trim();
            if (!t) continue;

            const upper = t.toUpperCase();

            if (upper === "FROM") {
                context = "FROM";
                continue;
            }

            if (upper === "WHERE") {
                context = "WHERE";
                continue;
            }

            if (
                context === "WHERE" &&
                /^(=|!=|>=|<=|>|<|IN|IS)$/i.test(upper)
            ) {
                context = "VALUE";
            }
        }

        return context;
    }

    function parseDotContext(word) {
        if (!word.includes(".")) {
            return { path: [], prefix: word };
        }

        const parts = word.split(".");
        return {
            path: parts.slice(0, -1),
            prefix: parts[parts.length - 1]
        };
    }

    return {
        inferTable,
        getContext,
        parseDotContext
    };

})();
