SNQL.modal = (function () {

    let initialized = false;

    function ensureMetadataInit() {
        if (initialized) return;

        SNQL.metadata.init({
            url: location.origin,
            token: window.g_ck || window.NOW?.g_ck
        });

        initialized = true;
    }

    function open() {
        if (document.getElementById("snql-modal")) return;

        ensureMetadataInit();

        const root = document.documentElement;
        const modalHtml = root.dataset.snqlModalHtml;
        const modalCss  = root.dataset.snqlModalCss;

        if (!modalHtml || !modalCss) {
            console.error("SNQL assets not found");
            return;
        }

        fetch(modalHtml)
            .then(r => r.text())
            .then(html => {
                document.body.insertAdjacentHTML("beforeend", html);

                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = modalCss;
                document.head.appendChild(link);

                const input     = document.getElementById("snql-input");
                const highlight = document.getElementById("snql-highlight");
                const label     = document.getElementById("snql-table");

                const defaultTable = SNQL.context.getTable?.() || null;

                SNQL.autocompleteView.init(input, defaultTable);
                SNQL.historyNav.init(input);

                label.textContent =
                    defaultTable ? `[${defaultTable}]` : `[no table]`;

                function syncHighlight() {
                    highlight.innerHTML =
                        SNQL.highlighter.highlight(input.value) + "\n";
                    highlight.scrollTop = input.scrollTop;
                }

                input.addEventListener("input", syncHighlight);
                input.addEventListener("scroll", () => {
                    highlight.scrollTop = input.scrollTop;
                });

                syncHighlight();
                input.focus();

                // --- keyboard handling ---
                input.addEventListener("keydown", e => {
                    if (e.key === "Enter") {
                        e.preventDefault();

                        const query = input.value.trim();
                        if (query) {
                            SNQL.history.add(query);
                        }

                        SNQL.navigation.openList(
                            query,
                            defaultTable
                        );

                        close();
                    }

                    if (e.key === "Escape") {
                        close();
                    }
                });
            });
    }

    function close() {
        document.getElementById("snql-modal")?.remove();
        document.getElementById("snql-overlay")?.remove();
    }

    return { open };

})();
