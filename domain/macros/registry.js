SNQL.macrosRegistry = (function () {

    const MACROS = [];
    const MAX_RECURSION = 10;

    // ---------------- validation ----------------

    function validateName(name) {
        if (!name) {
            throw new Error("Macro must have a name.");
        }

        const lower = name.toLowerCase();

        if (!/^[a-z_][a-z0-9_]*$/.test(lower)) {
            throw new Error(`Invalid macro name "${name}".`);
        }

        const reserved = new Set([
            ...[...SNQL.keywords.SUPPORTED].map(k => k.toLowerCase()),
            ...[...SNQL.keywords.UNSUPPORTED].map(k => k.toLowerCase()),
            "on", "before", "after",
            "orderby", "orderbydesc", "groupby"
        ]);

        if (reserved.has(lower)) {
            throw new Error(`Macro name "${lower}" is reserved and not allowed.`);
        }

        return lower;
    }

    // ---------------- registry ops ----------------

    function define(macro) {
        const name = validateName(macro?.name);

        MACROS.push({
            scope: "value", // default
            ...macro,
            name
        });
    }

    function remove(name) {
        const lower = name?.toLowerCase();
        const idx = MACROS.findIndex(m => m.name === lower);
        if (idx !== -1) {
            MACROS.splice(idx, 1);
        }
    }

    function clear() {
        MACROS.length = 0;
    }

    function list() {
        return [...MACROS];
    }

    function resolve(name) {
        if (!name) return null;
        return MACROS.find(m => m.name === name.toLowerCase()) || null;
    }

    // ---------------- autocomplete filtering ----------------

    function getForContext(ctx = {}) {

        const {
            context,
            currentTable,
            leftOperand,
            operator,
            prefix
        } = ctx;

        const fieldType = leftOperand?.type;
        const referenceTable = leftOperand?.reference;
        const lowerPrefix = prefix?.toLowerCase();

        return MACROS.filter(m => {

            // VALUE suggestions only show value macros
            if (context === "VALUE" && m.scope !== "value") {
                return false;
            }

            if (lowerPrefix) {
                const matchName = m.name.startsWith(lowerPrefix);
                const matchDisplay = m.display?.toLowerCase().startsWith(lowerPrefix);

                if (!matchName && !matchDisplay) {
                    return false;
                }
            }

            const a = m.appliesTo || {};

            if (m.scope === "value") {

                if (a.type && (!fieldType || !a.type.includes(fieldType))) {
                    return false;
                }

                if (a.reference && (!referenceTable || !a.reference.includes(referenceTable))) {
                    return false;
                }

                if (a.operator && (!operator || !a.operator.includes(operator))) {
                    return false;
                }

                if (a.table && (!currentTable || !a.table.includes(currentTable))) {
                    return false;
                }
            }

            return true;
        });
    }

    // ---------------- requires validation ----------------

    function validateRequires(macro, ctx) {
        // const requires = macro.requires;
        // if (!requires) return;

        // if (requires.fields) {
        //     const fields = ctx?.availableFields || [];

        //     for (const f of requires.fields) {
        //         if (!fields.includes(f)) {
        //             throw new Error(
        //                 `Macro "${macro.name}" requires field "${f}" which is not available.`
        //             );
        //         }
        //     }
        // }
    }

    // ---------------- compile helpers ----------------

    function isQuoted(str) {
        return (
            (str.startsWith("'") && str.endsWith("'")) ||
            (str.startsWith('"') && str.endsWith('"'))
        );
    }

    // ---------------- compile ----------------

    function expandWhereMacros(sql, ctx = {}, depth = 0) {

        if (!sql || typeof sql !== "string") return sql;
        if (depth > MAX_RECURSION) {
            throw new Error("Macro recursion depth exceeded.");
        }

        return sql.replace(/\b[a-z_]+\b/gi, token => {

            const macro = resolve(token);
            if (!macro || macro.scope !== "where") {
                return token;
            }

            validateRequires(macro, ctx);

            const compiled = macro.compile
                ? macro.compile(ctx)
                : macro.template;

            return expandWhereMacros(compiled, ctx, depth + 1);
        });
    }

    function compileWhere(where, ctx = {}, depth = 0) {

        if (!where || typeof where !== "string") return where;

        if (depth > MAX_RECURSION) {
            throw new Error("Macro recursion depth exceeded.");
        }

        const parts = where.split(/('(?:\\'|[^'])*')/g);

        for (let i = 0; i < parts.length; i++) {

            if (isQuoted(parts[i])) continue;

            parts[i] = parts[i].replace(/\b[a-z_]+\b/gi, token => {

                const macro = resolve(token);
                if (!macro) return token;

                validateRequires(macro, ctx);

                const compiled = macro.compile
                    ? macro.compile(ctx)
                    : macro.template;

                // WHERE macro injects full condition
                if (macro.scope === "where") {
                    return compileWhere(compiled, ctx, depth + 1);
                }

                // VALUE macro
                return "@@" + compileWhere(compiled, ctx, depth + 1);
            });
        }

        return parts.join("")
            .replace(/=\s*@@(ON[A-Za-z]*)/g, "$1")
            .replace(/@@/g, "");
    }

    return {
        define,
        remove,
        clear,
        list,
        resolve,
        getForContext,
        compileWhere,
        expandWhereMacros
    };

})();
