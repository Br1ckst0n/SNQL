SNQL.utils.dom = (function () {

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text != null) e.textContent = text;
        return e;
    }

    function clear(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function on(el, type, fn, opts) {
        el.addEventListener(type, fn, opts);
        return () => el.removeEventListener(type, fn, opts);
    }

    return {
        el,
        clear,
        on
    };

})();
