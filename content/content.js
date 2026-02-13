(function () {

    const root = document.documentElement;

    root.dataset.snqlModalHtml = chrome.runtime.getURL("ui/modal.html");
    root.dataset.snqlModalCss  = chrome.runtime.getURL("ui/modal.css");


    function inject(files) {
        return files.reduce((p, file) => {
            return p.then(() => new Promise(resolve => {
                const s = document.createElement("script");
                s.src = chrome.runtime.getURL(file);
                s.type = "text/javascript";
                s.onload = () => {
                    s.remove();
                    resolve();
                };
                document.documentElement.appendChild(s);
            }));
        }, Promise.resolve());
    }

    inject([
        "content/snql.namespace.js",
        "core/tokens.js",
        "core/keywords.js",
        "core/grammar.js",
        "core/sqlParser.js",
        "core/compilers.js",
        "utils/caret.js",
        "utils/collections.js",
        "utils/dom.js",
        "utils/escape.js",
        "services/metadata.js",
        "services/navigation.js",
        "services/history.js",
        "autocomplete/context.js",
        "autocomplete/resolver.js",
        "autocomplete/preload.js",
        "autocomplete/suggestions.js",
        "autocomplete/index.js",
        "ui/autocompleteView.js",
        "ui/historyNav.js",
        "ui/highlighter.js",
        "ui/modal.js",
        "ui/macros.js",
        "content/tableDetector.js",
        "content/shortcut.js"
    ]);

})();


chrome.runtime.onMessage.addListener(msg => {

    if (msg.type !== "SNQL_OPEN_MODAL") return;
    if (window !== window.top) return;

    window.postMessage({ type: "OPEN_MODAL" }, "*");
});


if (window === window.top) {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("content/shortcut.js");
    document.documentElement.appendChild(s);
    s.remove();
}