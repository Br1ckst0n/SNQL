SNQL.utils = SNQL.utils || {};

SNQL.utils.caret = (function () {

    function getCaretCoords(textarea, editor) {
        const taRect = textarea.getBoundingClientRect();
        const style = getComputedStyle(textarea);

        const div = document.createElement("div");

        [
            "boxSizing",
            "width",
            "height",
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
            "borderTopWidth",
            "borderRightWidth",
            "borderBottomWidth",
            "borderLeftWidth",
            "fontFamily",
            "fontSize",
            "fontWeight",
            "fontStyle",
            "lineHeight",
            "letterSpacing",
            "whiteSpace",
            "wordWrap"
        ].forEach(p => {
            div.style[p] = style[p];
        });

        div.style.position = "absolute";
        div.style.visibility = "hidden";
        div.style.left = `${taRect.left}px`;
        div.style.top = `${taRect.top}px`;
        div.style.whiteSpace = "pre-wrap";
        div.style.wordWrap = "break-word";

        div.textContent = textarea.value.substring(0, textarea.selectionStart);

        const span = document.createElement("span");
        span.textContent = "\u200b";
        div.appendChild(span);

        document.body.appendChild(div);

        const spanRect = span.getBoundingClientRect();
        document.body.removeChild(div);

        const editorRect = editor.getBoundingClientRect();

        return {
            x: spanRect.left - editorRect.left,
            y: spanRect.top  - editorRect.top,
            height: spanRect.height
        };
    }

    return { getCaretCoords };

})();
