SNQL.macros = (function () {

    // ---------------- registry ----------------

    const MACROS = [];

    function define(macro) {

        if (!macro || !macro.name) {
            throw new Error("Macro must have a name.");
        }

        const name = macro.name.toLowerCase();

        if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
            throw new Error(`Invalid macro name "${macro.name}".`);
        }

        const reserved = new Set([
            ...[...SNQL.keywords.SUPPORTED].map(k => k.toLowerCase()),
            ...[...SNQL.keywords.UNSUPPORTED].map(k => k.toLowerCase()),
            "on", "before", "after",
            "orderby", "orderbydesc", "groupby"
        ]);

        if (reserved.has(name)) {
            throw new Error(`Macro name "${name}" is reserved and not allowed.`);
        }

        if (MACROS.some(m => m.name === name)) {
            throw new Error(`Macro "${name}" is already defined.`);
        }

        MACROS.push({
            ...macro,
            name
        });
    }

    // ---------------- helpers ----------------

    function isQuoted(str) {
        return (
            (str.startsWith("'") && str.endsWith("'")) ||
            (str.startsWith('"') && str.endsWith('"'))
        );
    }

    // ---------------- public API ----------------

    function resolve(name) {
        if (!name) return null;
        return MACROS.find(m => m.name === name.toLowerCase()) || null;
    }

    function getForContext(ctx = {}) {

        const {
            currentTable,
            leftOperand,
            operator,
            prefix
        } = ctx;

        const fieldType = leftOperand?.type;
        const referenceTable = leftOperand?.reference;

        const lowerPrefix = prefix?.toLowerCase();

        return MACROS.filter(m => {

            if (lowerPrefix && !m.name.startsWith(lowerPrefix)) {
                return false;
            }

            const a = m.appliesTo || {};

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

            return true;
        });
    }

    function compileWhere(where, ctx = {}) {
        if (!where || typeof where !== "string") return where;

        const parts = where.split(/('(?:\\'|[^'])*')/g);

        for (let i = 0; i < parts.length; i++) {
            if (isQuoted(parts[i])) continue;

            parts[i] = parts[i].replace(/\b[a-z_]+\b/gi, token => {
                const macro = MACROS.find(m => m.name === token.toLowerCase());
                if (!macro) return token;

                return "@@" + macro.compile(ctx);
            });
        }

        return parts.join("")
            .replace(/=\s*@@(ON[A-Za-z]*)/g, "$1")
            .replace(/@@/g, "");
    }

    return {
        define,
        getForContext,
        compileWhere,
        resolve,
    };

})();

SNQL.macros.define({
    name: "today",
    label: "Today",
    display: "today",
    appliesTo: {
        type: ["glide_date", "glide_date_time"]
    },
    compile() {
        return "ONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()";
    }
});

SNQL.macros.define({
    name: "yesterday",
    label: "Yesterday",
    display: "yesterday",
    appliesTo: {
        type: ["glide_date", "glide_date_time"]
    },
    compile() {
        return "ONYesterday@javascript:gs.beginningOfYesterday()@javascript:gs.endOfYesterday()";
    }
});

SNQL.macros.define({
    name: "this_week",
    label: "This week",
    display: "this_week",
    appliesTo: {
        type: ["glide_date", "glide_date_time"]
    },
    compile() {
        return "ONThis Week@javascript:gs.beginningOfThisWeek()@javascript:gs.endOfThisWeek()";
    }
});

SNQL.macros.define({
    name: "this_month",
    label: "This month",
    display: "this_month",
    appliesTo: {
        type: ["glide_date", "glide_date_time"]
    },
    compile() {
        return "ONThis Month@javascript:gs.beginningOfThisMonth()@javascript:gs.endOfThisMonth()";
    }
});

SNQL.macros.define({
    name: "me",
    label: "Me",
    display: "me",
    appliesTo: {
        reference: ["sys_user"]
    },
    compile() {
        return "javascript:gs.getUserID()";
    }
});
