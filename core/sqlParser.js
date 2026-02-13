SNQL.sqlParser = (function () {

    function sqlTokenize(input) {
        const tokens = [];
        const regex =
            /\bNOT\s+IN\b|\bNOT\s+LIKE\b|\bIS\s+NOT\s+NULL\b|\bIS\s+NULL\b|\bAND\b|\bOR\b|\bLIKE\b|\bIN\b|!=|>=|<=|=|>|<|\(|\)|,|'[^']*'|"[^"]*"|\d+|[a-zA-Z_][a-zA-Z0-9_.]*/gi;

        let match;
        while ((match = regex.exec(input)) !== null) {
            tokens.push(match[0]);
        }

        return tokens;
    }

    function stripQuotes(v) {
        return v.replace(/^['"]|['"]$/g, "");
    }

    function splitCsv(text) {
        return text
            .split(",")
            .map(v => stripQuotes(v.trim()))
            .filter(Boolean);
    }

    function parseAtomicCondition(tokens) {
        const text = tokens.join(" ").trim();
        let m;

        const FIELD = "([\\w.]+)";

        m = text.match(new RegExp(`^${FIELD}\\s+IS\\s+NOT\\s+NULL$`, "i"));
        if (m) return `${m[1]}!=`;

        m = text.match(new RegExp(`^${FIELD}\\s+IS\\s+NULL$`, "i"));
        if (m) return `${m[1]}=`;

        m = text.match(new RegExp(`^${FIELD}\\s+NOT\\s+IN\\s*\\(([^)]+)\\)$`, "i"));
        if (m) {
            const field = m[1];
            const values = splitCsv(m[2]);
            return values.map(v => `${field}!=${v}`).join("^OR");
        }

        m = text.match(new RegExp(`^${FIELD}\\s+IN\\s*\\(([^)]+)\\)$`, "i"));
        if (m) {
            const values = splitCsv(m[2]);
            return `${m[1]}IN${values.join(",")}`;
        }

        m = text.match(new RegExp(`^${FIELD}\\s+NOT\\s+LIKE\\s+(.+)$`, "i"));
        if (m) {
            const field = m[1];
            let value = stripQuotes(m[2]).trim();
            value = value.replace(/^%|%$/g, "");
            return `${field}NOT LIKE${value}`;
        }

        m = text.match(new RegExp(`^${FIELD}\\s+LIKE\\s+(.+)$`, "i"));
        if (m) {
            const field = m[1];
            let value = stripQuotes(m[2]).trim();

            const startsWithPct = value.startsWith("%");
            const endsWithPct = value.endsWith("%");

            value = value.replace(/^%|%$/g, "");

            if (startsWithPct && endsWithPct) {
                return `${field}LIKE${value}`;
            }

            if (endsWithPct) {
                return `${field}STARTSWITH${value}`;
            }

            if (startsWithPct) {
                return `${field}ENDSWITH${value}`;
            }

            return `${field}LIKE${value}`;
        }

        m = text.match(new RegExp(`^${FIELD}\\s*(=|!=|>=|<=|>|<)\\s*(.+)$`));
        if (m) {
            return `${m[1]}${m[2]}${stripQuotes(m[3])}`;
        }

        throw new Error("Invalid condition: " + text);
    }

    function parseWhere(whereText, ctx = {}) {

        if (!whereText) return "";
        whereText = whereText.trim().replace(/^WHERE\s+/i, "");

        const tokens = sqlTokenize(whereText);

        const conditions = [];
        const operators = [];
        let buffer = [];
        let depth = 0;

        for (const token of tokens) {
            if (token === "(") depth++;
            if (token === ")") depth--;

            if (depth < 0) throw new Error("Unbalanced parentheses");

            const upper = token.toUpperCase();
            if ((upper === "AND" || upper === "OR") && depth === 0) {
                conditions.push(buffer);
                operators.push(upper);
                buffer = [];
            } else {
                buffer.push(token);
            }
        }

        if (depth !== 0) throw new Error("Unbalanced parentheses");
        if (buffer.length) conditions.push(buffer);
        if (!conditions.length) return "";

        let encoded = parseAtomicCondition(conditions[0]);

        for (let i = 0; i < operators.length; i++) {
            const next = parseAtomicCondition(conditions[i + 1]);
            encoded += operators[i] === "AND"
                ? "^" + next
                : "^OR" + next;
        }

        return SNQL.macros.compileWhere(encoded, ctx);
    }

    function parseGroupBy(text) {
        return text
            ? text.split(",").map(s => s.trim()).filter(Boolean)
            : [];
    }

    function parseOrderBy(text) {
        return text
            ? text.split(",").map(part => {
                const [field, dir] = part.trim().split(/\s+/);
                return {
                    field,
                    dir: dir && dir.toUpperCase() === "DESC" ? "DESC" : "ASC"
                };
            })
            : [];
    }

    function parse(sql, defaultTable) {
        const text = sql.trim();
        const upper = text.toUpperCase();

        let table = defaultTable;
        const fromMatch = text.match(/\bFROM\s+(\w+)/i);
        if (fromMatch) {
            table = fromMatch[1];
        } else {
            const implicitTableMatch = text.match(/^(\w+)\s+WHERE\b/i);
            if (implicitTableMatch) {
                table = implicitTableMatch[1];
            }
        }

        const whereIdx = upper.indexOf(" WHERE ");
        const groupIdx = upper.indexOf(" GROUP BY ");
        const orderIdx = upper.indexOf(" ORDER BY ");

        const end = text.length;
        const sectionEnd = (...idxs) =>
            Math.min(...idxs.filter(i => i !== -1), end);

        let whereText = null;

        if (whereIdx !== -1) {
            whereText = text.slice(
                whereIdx + 7,
                sectionEnd(groupIdx, orderIdx)
            ).trim();
        } else {
            const implicit = text.slice(0, sectionEnd(groupIdx, orderIdx)).trim();
            if (implicit && !implicit.toUpperCase().startsWith("FROM")) {
                whereText = implicit;
            }
        }

        return {
            table,
            where: whereText ? parseWhere(whereText, { table }) : "",
            groupBy:
                groupIdx !== -1
                    ? parseGroupBy(text.slice(groupIdx + 10, orderIdx === -1 ? end : orderIdx))
                    : [],
            orderBy:
                orderIdx !== -1
                    ? parseOrderBy(text.slice(orderIdx + 10))
                    : []
        };
    }

    return { parse };

})();
