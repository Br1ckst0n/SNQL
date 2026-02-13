SNQL.autocomplete = (function () {

    let textarea = null;
    let defaultTable = null;

    function init(el, table) {
        textarea = el;
        defaultTable = table;
    }

    /* -----------------------------
       Normalization Utilities
    ----------------------------- */

    function normalize(str) {
        return (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function tokenize(str) {
        return normalize(str).split(/\s+/).filter(Boolean);
    }

    function acronym(label) {
        return tokenize(label)
            .map(w => w[0])
            .join("");
    }

    /* -----------------------------
       Matching + Scoring
    ----------------------------- */

    function scoreSuggestion(s, rawPrefix) {

        if (!rawPrefix) return 1000;

        const prefix = normalize(rawPrefix);
        const name = normalize(s.name);
        const label = normalize(s.label || "");

        // 1️⃣ Exact name match
        if (name === prefix) return 0;

        // 2️⃣ Name prefix
        if (name.startsWith(prefix))
            return 10 + (name.length - prefix.length);

        // 3️⃣ Acronym prefix (Short Description → sd)
        const acro = acronym(label);
        if (acro.startsWith(prefix))
            return 40 + (acro.length - prefix.length);

        // 4️⃣ Full label prefix
        if (label.startsWith(prefix))
            return 70 + (label.length - prefix.length);

        // 5️⃣ Token prefix (Description in Short Description)
        const tokens = tokenize(label);
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].startsWith(prefix)) {
                return 100 + i * 5;
            }
        }

        return Infinity; // no match
    }

    function matchesSuggestion(s, prefix) {
        return scoreSuggestion(s, prefix) !== Infinity;
    }

    /* -----------------------------
       Main Suggestion Logic
    ----------------------------- */

    async function getSuggestions() {

        if (!textarea) return [];

        const ctx = await SNQL.autocompleteContext.get(
            textarea.value,
            textarea.selectionStart,
            defaultTable
        );

        SNQL.autocompletePreload.warmup(ctx.currentTable);

        const suggestions =
            await SNQL.autocompleteSuggestions.forContext(ctx);

        const prefix = ctx.dotContext.prefix;

        if (!prefix) {
            return suggestions.slice(0, 6);
        }

        return suggestions
            .filter(s => matchesSuggestion(s, prefix))
            .map(s => ({
                item: s,
                score: scoreSuggestion(s, prefix)
            }))
            .sort((a, b) => a.score - b.score)
            .map(r => r.item)
            .slice(0, 6);
    }

    return {
        init,
        getSuggestions
    };

})();
