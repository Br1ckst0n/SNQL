SNQL.highlighter = (function () {

    const { SUPPORTED, UNSUPPORTED } = SNQL.keywords;

    function escapeHtml(s) {
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    let getCurrentTable = () => null;

    function setTableResolver(fn) {
        if (typeof fn === "function") {
            getCurrentTable = fn;
        }
    }

    function isKnownColumn(name) {
        try {
            const table = getCurrentTable();
            if (!table) return true;

            const cols = SNQL.metadata?.getColumnsSync?.(table);
            if (!Array.isArray(cols)) return true;

            return cols.some(c => c.name === name);
        } catch {
            return true;
        }
    }

    function isMacro(tok) {
        return typeof SNQL.macros?.resolve === "function"
            && SNQL.macros.resolve(tok) !== null;
    }

    function highlight(text) {
        if (!text) return "";

        const tokens = SNQL.tokens.tokenizeWithSpaces(text);

        return tokens.map(tok => {
            if (/^\s+$/.test(tok)) return tok;

            const safe = escapeHtml(tok);
            const upper = tok.toUpperCase();

            if (
                (tok.startsWith("'") && !tok.endsWith("'")) ||
                (tok.startsWith('"') && !tok.endsWith('"'))
            ) {
                return `<span class="str err">${safe}</span>`;
            }

            if (
                (tok.startsWith("'") && tok.endsWith("'")) ||
                (tok.startsWith('"') && tok.endsWith('"'))
            ) {
                return `<span class="str">${safe}</span>`;
            }

            if (/^\d+$/.test(tok)) {
                return `<span class="num">${safe}</span>`;
            }

            if (/^(>=|<=|!=|=|>|<)$/.test(tok)) {
                return `<span class="op">${safe}</span>`;
            }

            if (SUPPORTED.has(upper)) {
                return `<span class="kw">${safe}</span>`;
            }

            if (UNSUPPORTED.has(upper)) {
                return `<span class="err">${safe}</span>`;
            }

            if (isMacro(tok)) {
                return `<span class="macro">${safe}</span>`;
            }

            if (!isKnownColumn(tok)) {
                return `<span class="err">${safe}</span>`;
            }

            return `<span class="ident">${safe}</span>`;
        }).join("");
    }

    return {
        highlight,
        setTableResolver
    };

})();
