SNQL.modal = (function () {

    /* ================================
       STATE
    ================================= */

    let state = {
        table: null
    };

    let unsubscribeStatus = null;
    let styleEl = null;
    let handleGlobalKey = null;

    let dom = {};

    const $ = (sel) => dom.root?.querySelector(sel);
    const $$ = (sel) => [...(dom.root?.querySelectorAll(sel) || [])];

    /* ================================
       OPEN / CLOSE
    ================================= */

    function open() {

        if (document.getElementById("snql-modal")) return;

        ensureMetadataInit();

        const root = document.documentElement;
        const modalHtml = root.dataset.snqlModalHtml;
        const modalCss  = root.dataset.snqlModalCss;

        if (!modalHtml || !modalCss) {
            console.error("SNQL modal assets not found");
            return;
        }

        fetch(modalHtml)
            .then(r => r.text())
            .then(html => {

                document.body.insertAdjacentHTML("beforeend", html);

                styleEl = document.createElement("link");
                styleEl.rel = "stylesheet";
                styleEl.href = modalCss;
                document.head.appendChild(styleEl);

                cacheDom();
                refreshState();
                bind();
                render();

                /* Overlay click closes modal */
                dom.overlay?.addEventListener("click", close);

                /* Global Escape closes modal */
                handleGlobalKey = function (e) {
                    if (e.key === "Escape") {
                        close();
                    }
                };

                document.addEventListener("keydown", handleGlobalKey);

                dom.input.focus();
            });
    }

    function close() {

        dom.root?.remove();
        dom.overlay?.remove();
        styleEl?.remove();

        unsubscribeStatus?.();

        if (handleGlobalKey) {
            document.removeEventListener("keydown", handleGlobalKey);
            handleGlobalKey = null;
        }

        styleEl = null;
        dom = {};
    }

    /* ================================
       METADATA
    ================================= */

    let metadataInitialized = false;

    function ensureMetadataInit() {

        if (metadataInitialized) return;

        SNQL.metadata.init({
            url: location.origin,
            token: window.g_ck || window.NOW?.g_ck
        });

        metadataInitialized = true;
    }

    /* ================================
       DOM
    ================================= */

    function cacheDom() {

        dom.root       = document.getElementById("snql-modal");
        dom.overlay    = document.getElementById("snql-overlay");

        dom.input      = $("#snql-input");
        dom.highlight  = $("#snql-highlight");
        dom.label      = $("#snql-table");
        dom.status     = $("#snql-status");
        dom.openMacros = $("#snql-open-macros");
        dom.run        = $("#snql-run");
    }

    /* ================================
       STATE
    ================================= */

    function refreshState() {
        state.table = SNQL.context.getTable?.() || null;
    }

    /* ================================
       RENDER
    ================================= */

    function render() {

        dom.label.textContent =
            state.table ? `[${state.table}]` : `[no table]`;

        renderStatus(SNQL.status.get());
        unsubscribeStatus = SNQL.status.subscribe(renderStatus);

        syncHighlight();
    }

    function renderStatus(status) {

        dom.status.dataset.state = status;

        const titles = {
            idle: "Idle",
            initializing: "Initializing metadata…",
            ready: "Metadata ready",
            error: "Metadata error",
            offline: "No authentication token"
        };

        dom.status.title = titles[status] || status;
    }

    function syncHighlight() {

        dom.highlight.innerHTML =
            SNQL.highlighter.highlight(dom.input.value) + "\n";

        dom.highlight.scrollTop = dom.input.scrollTop;
    }

    /* ================================
       RUN LOGIC
    ================================= */

    function runQuery({ newTab = false } = {}) {

        const query = dom.input.value.trim();
        if (!query) return;

        SNQL.history.add(query);

        const url = SNQL.navigation.buildUrl(query, state.table);
        if (!url) return;

        if (newTab) {
            window.postMessage({
                type: "SNQL_OPEN_TAB",
                url
            }, "*");
        } else {
            window.top.location.href = url;
        }

        close();
    }

    /* ================================
       BIND
    ================================= */

    function bind() {

        SNQL.autocompleteView.init(dom.input, state.table);
        SNQL.historyNav.init(dom.input);

        dom.input.addEventListener("input", syncHighlight);

        dom.input.addEventListener("scroll", () => {
            dom.highlight.scrollTop = dom.input.scrollTop;
        });

        dom.input.addEventListener("keydown", onKeyDown);

        dom.openMacros?.addEventListener("click", () => {
            SNQL.macrosModal.open();
        });

        dom.run?.addEventListener("click", (e) => {
            runQuery({
                newTab: e.shiftKey || e.ctrlKey || e.metaKey
            });
        });
    }

    function onKeyDown(e) {

        if (e.key === "Enter") {
            e.preventDefault();
            runQuery({
                newTab: e.shiftKey || e.ctrlKey || e.metaKey
            });
        }

        if (e.key === "Escape") {
            close();
        }
    }

    return { open };

})();
