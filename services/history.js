SNQL.history = (function () {

    const STORAGE_KEY = "snql.history";
    const MAX_ENTRIES = 25;

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function save(entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }

    function add(query) {
        if (!query || !query.trim()) return;

        const normalized = query.trim();
        let entries = load();

        entries = entries.filter(e => e.query !== normalized);

        entries.unshift({
            query: normalized,
            ts: Date.now()
        });

        if (entries.length > MAX_ENTRIES) {
            entries.length = MAX_ENTRIES;
        }

        save(entries);
    }

    function getAll() {
        return load();
    }

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return {
        add,
        getAll,
        clear
    };

})();
