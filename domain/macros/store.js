SNQL.macrosStore = (function () {

    const STORAGE_KEY = "snql.macros";

    function loadRaw() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveRaw(macros) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(macros));
    }

    function reloadRegistry() {

        SNQL.macrosRegistry.clear();
        SNQL.macrosDefaults.register();

        const userMacros = loadRaw();

        userMacros.forEach(m => {

            SNQL.macrosRegistry.define({
                ...m,
                compile(ctx) {
                    return this.template;
                }
            });
        });
    }

    function create(macro) {

        const macros = loadRaw();

        if (macros.some(m => m.name === macro.name)) {
            throw new Error("Macro already exists.");
        }

        macros.push(macro);
        saveRaw(macros);
        reloadRegistry();
    }

    function update(name, updated) {

        const macros = loadRaw();
        const idx = macros.findIndex(m => m.name === name);

        if (idx === -1) {
            throw new Error("Macro not found.");
        }

        macros[idx] = updated;
        saveRaw(macros);
        reloadRegistry();
    }

    function remove(name) {

        const macros = loadRaw()
            .filter(m => m.name !== name);

        saveRaw(macros);
        reloadRegistry();
    }

    function listUser() {
        return loadRaw();
    }

    function init() {
        reloadRegistry();
    }

    return {
        init,
        create,
        update,
        remove,
        listUser
    };

})();

SNQL.macrosStore.init();
