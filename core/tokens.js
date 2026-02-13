SNQL.tokens = (function () {

    const WORD    = /[a-zA-Z_][a-zA-Z0-9_.]*/;
    const NUMBER  = /\d+/;
    const STRING = /'(?:[^']*'|[^']*$)|"(?:[^"]*"|[^"]*$)/;
    const SYMBOLS = /[(),=<>!]/;

    const TOKEN_REGEX = new RegExp(
        [
            STRING.source,
            NUMBER.source,
            WORD.source,
            SYMBOLS.source
        ].join("|"),
        "gi"
    );

    function tokenize(input) {
        if (!input) return [];
        return input.match(TOKEN_REGEX) || [];
    }

    function tokenizeWithSpaces(input) {
        if (!input) return [];

        const regex = new RegExp(
            `(\\s+|${TOKEN_REGEX.source})`,
            "gi"
        );

        const out = [];
        let m;
        while ((m = regex.exec(input)) !== null) {
            out.push(m[1]);
        }
        return out;
    }

    return {
        tokenize,
        tokenizeWithSpaces
    };

})();
