SNQL.status = (function () {

    let state = "idle";
    const listeners = new Set();

    function set(newState) {
        if (state === newState) return;
        state = newState;
        listeners.forEach(fn => fn(state));
    }

    function get() {
        return state;
    }

    function subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    return {
        set,
        get,
        subscribe
    };

})();
