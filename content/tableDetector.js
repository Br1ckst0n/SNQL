SNQL.context = (function () {
    function getTable() {
        return (
            window.g_form?.getTableName?.() ||
            window.g_list?.tableName ||
            null
        );
    }

    return { getTable };
})();
