SNQL.autocompleteView = (function () {

    let input, editor, box, list;
    let items = [];
    let activeIndex = 0;
    let visible = false;
    let rafPending = false;

    function init(textarea, defaultTable) {
        input = textarea;
        editor = textarea.closest(".snql-editor");

        SNQL.autocomplete.init(textarea, defaultTable);

        box = document.createElement("div");
        box.className = "snql-autocomplete";
        box.style.display = "none";

        list = document.createElement("ul");
        box.appendChild(list);
        editor.appendChild(box);

        input.addEventListener("input", update);
        input.addEventListener("keydown", onKey);
        input.addEventListener("blur", hide);
        input.addEventListener("scroll", hide);
    }

    async function update() {

        if (SNQL.historyNav?.isNavigating?.()) {
            hide();
            return;
        }

        const suggestions = await SNQL.autocomplete.getSuggestions();
        if (!suggestions || !suggestions.length) {
            hide();
            return;
        }

        items = suggestions;
        activeIndex = 0;
        render();
        schedulePosition();
        show();
    }

    // ---------------- rendering ----------------

    function render() {
        list.innerHTML = "";

        items.forEach((s, i) => {
            const li = document.createElement("li");
            if (i === activeIndex) li.classList.add("active");

            const label = document.createElement("div");
            label.className = "snql-item-label";
            label.textContent = s.label || s.name;

            const meta = document.createElement("div");
            meta.className = "snql-item-meta";

            if (s.kind !== "macro") {
                const name = document.createElement("span");
                name.className = "snql-meta-name";
                name.textContent = `[${s.name}]`;
                meta.appendChild(name);
            }

            if (s.type) {
                const type = document.createElement("span");
                type.className = `snql-type snql-type-${s.type}`;
                type.textContent = s.type;
                meta.appendChild(type);
            }

            if (s.kind === "macro") {
                const m = document.createElement("span");
                m.className = "snql-macro";
                m.textContent = "macro";
                meta.appendChild(m);
            }

            li.appendChild(label);
            li.appendChild(meta);

            if (s.description) {
                const desc = document.createElement("div");
                desc.className = "snql-item-desc";
                desc.textContent = s.description;
                li.appendChild(desc);
            }

            li.addEventListener("mousedown", e => {
                e.preventDefault();
                commit(s);
            });

            list.appendChild(li);
        });
    }

    // ---------------- commit ----------------

    function commit(s, suffix = "") {
        const pos = input.selectionStart;

        const left = input.value
            .slice(0, pos)
            .replace(/[a-zA-Z_\.]+$/, "");

        const insert = (s.insertText || s.name) + suffix;

        input.value = left + insert;
        input.selectionStart = input.selectionEnd = input.value.length;

        input.dispatchEvent(new Event("input", { bubbles: true }));
        hide();
    }

    // ---------------- keyboard ----------------

    function onKey(e) {
        if (!visible) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            updateActive();
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            activeIndex =
                (activeIndex - 1 + items.length) % items.length;
            updateActive();
            return;
        }

        if (e.key === "Tab") {
            e.preventDefault();
            commit(items[activeIndex], " ");
            return;
        }

        if (e.key === "ArrowRight") {
            e.preventDefault();

            const s = items[activeIndex];
            const suffix = s.type === "reference" ? "." : " ";

            commit(s, suffix);
            return;
        }

        if (e.key === "Enter") {
            return;
        }

        if (e.key === "Escape") {
            hide();
        }
    }


    function updateActive() {
        [...list.children].forEach((li, i) =>
            li.classList.toggle("active", i === activeIndex)
        );

        list.children[activeIndex]?.scrollIntoView({
            block: "nearest"
        });
    }

    // ---------------- positioning ----------------

    function schedulePosition() {
        if (rafPending) return;
        rafPending = true;

        requestAnimationFrame(() => {
            rafPending = false;
            if (visible) position();
        });
    }

    function position() {
        const { x, y, height } =
            SNQL.utils.caret.getCaretCoords(input, editor);

        box.style.left = `${x}px`;
        box.style.top  = `${y + height + 4}px`;
    }

    // ---------------- visibility ----------------

    function show() {
        box.style.display = "block";
        visible = true;
    }

    function hide() {
        box.style.display = "none";
        visible = false;
    }

   function isOpen() {
        if (!box) return false;
        return window.getComputedStyle(box).display !== "none";
    }

    return {
        init,
        isOpen
    };

})();
