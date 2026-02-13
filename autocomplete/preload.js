SNQL.autocompletePreload = (function () {

    let running = false;

    async function warmup(table) {
        if (!table || running) return;
        running = true;

        try {
            await SNQL.metadata.getColumns(table);
        } finally {
            running = false;
        }
    }

    return { warmup };

})();
