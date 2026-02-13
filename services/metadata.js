SNQL.metadata = (function () {

    let instanceUrl = null;
    let g_ck = null;

    let tables = null;
    let columns = Object.create(null);
    let choices = Object.create(null);

    let tablesPromise = null;
    let columnsPromise = Object.create(null);
    let choicesPromise = Object.create(null);

    const CACHE_PREFIX = "snql:metadata:";
    const TTL_MS = 24 * 60 * 60 * 1000;

    function cacheKey(key) {
        return `${CACHE_PREFIX}${instanceUrl}:${key}`;
    }

    function loadCache(key) {
        try {
            const raw = localStorage.getItem(cacheKey(key));
            if (!raw) return null;

            const { ts, data } = JSON.parse(raw);
            if (Date.now() - ts > TTL_MS) {
                localStorage.removeItem(cacheKey(key));
                return null;
            }
            return data;
        } catch {
            return null;
        }
    }

    function saveCache(key, data) {
        try {
            localStorage.setItem(
                cacheKey(key),
                JSON.stringify({ ts: Date.now(), data })
            );
        } catch {}
    }

    function clearCache() {
        Object.keys(localStorage)
            .filter(k => k.startsWith(CACHE_PREFIX + instanceUrl))
            .forEach(k => localStorage.removeItem(k));
    }

    function init({ url, token }) {
        instanceUrl = url ? url.replace(/\/$/, "") : null;
        g_ck = token || null;

        getTables().catch(() => {});
    }

    function isAuthenticated() {
        return !!(instanceUrl && g_ck);
    }

    // -------- async read-through API --------

    async function getTables() {
        if (!isAuthenticated()) return [];

        if (tables) return tables;
        if (tablesPromise) return tablesPromise;

        const cached = loadCache("tables");
        if (cached) {
            tables = cached;
            return cached;
        }

        tablesPromise = fetchTables()
            .then(r => {
                tables = r;
                saveCache("tables", r);
                return r;
            })
            .catch(() => []);

        return tablesPromise;
    }

    async function getColumns(table) {
        if (!isAuthenticated() || !table) return [];

        if (columns[table]) return columns[table];
        if (columnsPromise[table]) return columnsPromise[table];

        const cached = loadCache("columns:" + table);
        if (cached) {
            columns[table] = cached;
            return cached;
        }

        columnsPromise[table] = resolveColumnsWithInheritance(table)
            .then(r => {
                columns[table] = r;
                saveCache("columns:" + table, r);
                return r;
            })
            .catch(() => []);

        return columnsPromise[table];
    }

    async function getChoices(table, column) {
        if (!isAuthenticated() || !table || !column) return [];

        const key = `${table}.${column}`;

        if (choices[key]) return choices[key];
        if (choicesPromise[key]) return choicesPromise[key];

        const cached = loadCache("choices:" + key);
        if (cached) {
            choices[key] = cached;
            return cached;
        }

        choicesPromise[key] = resolveChoiceTables(table)
            .then(async tables => {
                for (const t of tables) {
                    const result = await fetchChoices(t, column);
                    if (result.length) return result;
                }
                return [];
            })
            .then(r => {
                choices[key] = r;
                saveCache("choices:" + key, r);
                return r;
            })
            .catch(() => []);

        return choicesPromise[key];
    }

    async function resolveChoiceTables(table) {
        table = table.toLowerCase();

        const allTables = await getTables();

        const byName = Object.create(null);
        const byId = Object.create(null);

        allTables.forEach(t => {
            byName[t.name.toLowerCase()] = t;
            byId[t.sys_id] = t;
        });

        const chain = [];
        let current = byName[table];

        while (current) {
            chain.push(current.name);
            current = current.super_sys_id
                ? byId[current.super_sys_id]
                : null;
        }

        return chain;
    }

    // -------- fetch helpers --------

    function snFetch(path) {
        if (!isAuthenticated())
            return Promise.resolve({ result: [] });

        return fetch(instanceUrl + path, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-UserToken": g_ck
            },
            credentials: "same-origin"
        })
            .then(r => (r.ok ? r.json() : { result: [] }))
            .catch(() => ({ result: [] }));
    }

    function fetchTables() {
        return snFetch(
            "/api/now/table/sys_db_object" +
            "?sysparm_fields=sys_id,name,label,super_class"
        ).then(r =>
            (r.result || []).map(t => ({
                sys_id: t.sys_id,
                name: t.name,
                label: t.label || t.name,
                super_sys_id: t.super_class?.value || null
            }))
        );
    }

    function fetchColumnsDirect(table) {
        return snFetch(
            "/api/now/table/sys_dictionary" +
            "?sysparm_fields=element,column_label,internal_type,reference" +
            "&sysparm_query=name=" + table +
            "^internal_type!=collection"
        ).then(r =>
            (r.result || [])
                .filter(c => c.element)
                .map(c => ({
                    name: c.element,
                    label: c.column_label || c.element,
                    type: c.internal_type?.value || null,
                    reference: c.reference?.value || null
                }))
        );
    }

    function fetchChoices(table, column) {
        return snFetch(
            "/api/now/table/sys_choice" +
            "?sysparm_fields=value,label,sequence" +
            "&sysparm_query=" +
            "name=" + table +
            "^element=" + column +
            "^inactive=false" +
            "&sysparm_order_by=sequence"
        ).then(r => (r.result || [])
            .sort((a, b) => Number(a.sequence) - Number(b.sequence))
            .map(c => ({
                value: c.value,
                label: c.label || c.value,
                sequence: Number(c.sequence)
            }))
        );
    }

    // -------- inheritance --------

    async function resolveColumnsWithInheritance(table) {
        table = table.toLowerCase();

        const allTables = await getTables();

        const byName = Object.create(null);
        const byId = Object.create(null);

        allTables.forEach(t => {
            byName[t.name.toLowerCase()] = t;
            byId[t.sys_id] = t;
        });

        const chain = [];
        let current = byName[table];

        while (current) {
            chain.push(current.name);
            current = current.super_sys_id
                ? byId[current.super_sys_id]
                : null;
        }

        chain.reverse();

        const results = await Promise.all(
            chain.map(fetchColumnsDirect)
        );

        return dedupeColumns(results.flat());
    }

    function dedupeColumns(cols) {
        const seen = new Set();
        return cols.filter(c => {
            if (seen.has(c.name)) return false;
            seen.add(c.name);
            return true;
        });
    }

    function clear() {
        tables = null;
        columns = Object.create(null);
        choices = Object.create(null);

        tablesPromise = null;
        columnsPromise = Object.create(null);
        choicesPromise = Object.create(null);

        clearCache();
    }

    return {
        init,
        isAuthenticated,
        getTables,
        getColumns,
        getChoices,
        clear
    };

})();
