(function () {
    if (window.__SNQL_PAGE_LISTENER__) return;
    window.__SNQL_PAGE_LISTENER__ = true;


    function isModalOpen() {
        return !!document.querySelector(".snql-modal");
    }

    function openOnce() {
        if (isModalOpen()) {
            return;
        }

        SNQL.modal.open({});
    }

    window.addEventListener("message", e => {
        if (
            e.source !== window ||
            e.data?.type !== "OPEN_MODAL"
        ) return;

        requestAnimationFrame(openOnce);
    });
})();
