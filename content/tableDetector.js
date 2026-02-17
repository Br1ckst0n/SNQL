SNQL.context = (function () {

    /* ================================
       PUBLIC API
    ================================= */

    function getTable() {
        return (
            fromForm() ||
            fromList() ||
            fromWrappedUrl() ||
            fromDirectUrl() ||
            fromSysparm() ||
            null
        );
    }

    /* ================================
       SOURCES
    ================================= */

    function fromForm() {
        return window.g_form?.getTableName?.() || null;
    }

    function fromList() {
        return window.g_list?.tableName || null;
    }

    function fromWrappedUrl() {
        // /now/nav/ui/classic/params/target/<encoded_url>
        const match = location.pathname.match(/target\/(.+)$/);
        if (!match) return null;

        try {
            const decoded = decodeURIComponent(match[1]);
            return extractTable(decoded);
        } catch {
            return null;
        }
    }

    function fromDirectUrl() {
        return extractTable(location.pathname);
    }

    function fromSysparm() {
        const params = new URLSearchParams(location.search);
        return params.get("sysparm_table");
    }

    /* ================================
       UTIL
    ================================= */

    function extractTable(path) {
        const match = path.match(/\/?([^\/?]+?)(?:_list)?\.do/);
        return match ? match[1] : null;
    }

    return { getTable };

})();
