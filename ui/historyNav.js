SNQL.historyNav = (function () {

    let input;

    let entries = [];
    let index = null;
    let draft = "";
    let internalUpdate = false;
    let navigating = false;

    function init(textarea) {
        input = textarea;

        input.addEventListener("keydown", onKey);
        input.addEventListener("input", onInput);
    }

    function onKey(e) {

        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        if (SNQL.autocompleteView?.isOpen?.()) {
            return;
        }

        e.preventDefault();

        if (e.key === "ArrowUp") {
            navigateUp();
        }

        if (e.key === "ArrowDown") {
            navigateDown();
        }
    }

    function startNavigation() {

        entries = SNQL.history.getAll();
        if (!entries.length) return false;

        draft = input.value;
        index = -1;
        navigating = true;

        return true;
    }

    function navigateUp() {

        if (index === null) {
            if (!startNavigation()) return;
        }

        if (index < entries.length - 1) {
            index++;
            apply(entries[index].query);
        }
    }

    function navigateDown() {

        if (index === null) return;

        if (index > 0) {
            index--;
            apply(entries[index].query);
        } else {
            exitNavigation();
        }
    }

    function exitNavigation() {
        index = null;
        navigating = false;
        apply(draft);
    }

    function apply(value) {

        internalUpdate = true;

        input.value = value;
        input.selectionStart = input.selectionEnd = value.length;

        input.dispatchEvent(new Event("input", { bubbles: true }));

        internalUpdate = false;
    }

    function onInput() {

        if (internalUpdate) return;

        index = null;
        navigating = false;
    }

    function isNavigating() {
        return navigating;
    }

    return { init, isNavigating };

})();
