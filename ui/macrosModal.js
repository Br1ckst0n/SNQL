SNQL.macrosModal = (function () {

    /* ================================
       STATE
    ================================= */

    let state = {
        editing: null,
        defaults: [],
        users: [],
        filter: ""
    };

    let originalSnapshot = null;
    let styleEl = null;

    let dom = {};

    const $ = (sel) => dom.root?.querySelector(sel);
    const $$ = (sel) => [...(dom.root?.querySelectorAll(sel) || [])];

    function setState(patch = {}) {
        state = { ...state, ...patch };
        renderList();
    }

    /* ================================
       OPEN / CLOSE
    ================================= */

    function open() {

        if (document.getElementById("snql-macros-modal")) return;

        const root = document.documentElement;
        const modalHtml = root.dataset.snqlMacrosModalHtml;
        const modalCss = root.dataset.snqlMacrosModalCss;

        if (!modalHtml || !modalCss) {
            console.error("SNQL macros modal assets not found");
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

                dom.overlay?.classList.remove("hidden");
                dom.root?.classList.remove("hidden");

                refreshState();
                bind();
                renderList();
            });
    }

    function close() {
        dom.root?.remove();
        dom.overlay?.remove();
        styleEl?.remove();
        styleEl = null;
        dom = {};
    }

    function cacheDom() {
        dom.root = document.getElementById("snql-macros-modal");
        dom.overlay = document.getElementById("snql-macros-overlay");

        dom.list = $("#snql-macros-list");
        dom.editor = $("#snql-macros-editor");

        dom.search = $("#snql-macros-search");
        dom.scopeToggle = $("#macro-scope-toggle");
        dom.scopeLabel = $("#macro-scope-label");
        dom.requiresSection = $("#macro-requires");
        dom.appliesSection = $(".applies-to");

        dom.saveBtn = $("#snql-macros-save");
        dom.deleteBtn = $("#snql-macros-delete");
        dom.cancelBtn = $("#snql-macros-cancel");
        dom.newBtn = $("#snql-macros-new");
        dom.closeBtn = $("#snql-macros-close");
        dom.title = $("#snql-macros-editor-title");
    }

    /* ================================
       STATE REFRESH
    ================================= */

    function refreshState() {

        const runtime = SNQL.macrosRegistry.list();
        state.users = SNQL.macrosStore.listUser();

        const defaultNames = new Set(
            SNQL.macrosDefaults.list().map(m => m.name)
        );

        state.defaults = runtime.filter(m =>
            defaultNames.has(m.name)
        );
    }

    /* ================================
       BINDING
    ================================= */

    function bind() {

        dom.search?.addEventListener("input", e =>
            setState({ filter: e.target.value.trim().toLowerCase() })
        );

        dom.scopeToggle?.addEventListener("change", onScopeChange);

        dom.closeBtn?.addEventListener("click", close);
        dom.newBtn?.addEventListener("click", createNew);
        dom.saveBtn?.addEventListener("click", save);
        dom.deleteBtn?.addEventListener("click", remove);
        dom.cancelBtn?.addEventListener("click", resetView);

        $$("#snql-macros-editor input, #snql-macros-editor textarea")
            .forEach(el =>
                el.addEventListener("input", updateSaveState)
            );
    }

    /* ================================
       LIST
    ================================= */

    function renderList() {

        if (!dom.list) return;

        dom.list.innerHTML = "";

        const defaultMap = new Map(state.defaults.map(m => [m.name, m]));
        const userMap = new Map(state.users.map(m => [m.name, m]));
        const names = new Set([...defaultMap.keys(), ...userMap.keys()]);

        names.forEach(name => {

            const macro = userMap.get(name) || defaultMap.get(name);
            if (!macro) return;
            if (!matchesFilter(name, macro)) return;

            const li = document.createElement("li");

            li.innerHTML = `
                <span class="macro-name">${name}</span>
                <span class="macro-chips">
                    ${badge(macro.scope)}
                    ${typeBadge(name)}
                </span>
            `;

            if (state.editing === name) {
                li.classList.add("active");
            }

            li.addEventListener("click", () => edit(name));

            dom.list.appendChild(li);
        });
    }

    function matchesFilter(name, macro) {
        if (!state.filter) return true;

        return [name, macro.label, macro.display]
            .join(" ")
            .toLowerCase()
            .includes(state.filter);
    }

    function badge(scope) {
        return `<span class="macro-badge scope ${scope}">${scope}</span>`;
    }

    function typeBadge(name) {
        const isDefault = !!SNQL.macrosDefaults.get(name);
        const isUser = state.users.some(m => m.name === name);

        if (isDefault && !isUser)
            return `<span class="macro-badge">default</span>`;
        if (isDefault && isUser)
            return `<span class="macro-badge">override</span>`;
        return "";
    }

    /* ================================
       NEW (FIXED BUG HERE)
    ================================= */

    function createNew() {

        setState({ editing: null });

        clearEditor();

        dom.title.textContent = "New Macro";
        dom.editor.classList.remove("hidden");

        originalSnapshot = null;
        dom.saveBtn.disabled = false;
        dom.deleteBtn.style.display = "none";
    }

    /* ================================
       EDIT
    ================================= */

    function edit(name) {

        setState({ editing: name });

        const macro = [...state.defaults, ...state.users]
            .find(m => m.name === name);

        if (!macro) return;

        fillEditor(macro);

        const isDefault = !!SNQL.macrosDefaults.get(name);
        const isUser = state.users.some(m => m.name === name);

        dom.title.textContent = isDefault
            ? `View Default: ${name}`
            : `Edit: ${name}`;

        $("#macro-name").disabled = isDefault && !isUser;
        dom.deleteBtn.style.display = isUser ? "inline-block" : "none";
        dom.saveBtn.textContent =
            isDefault && !isUser ? "Override" : "Save";

        dom.editor.classList.remove("hidden");

        originalSnapshot = JSON.stringify(readEditor());
        updateSaveState();
    }

    function resetView() {
        setState({ editing: null });
        dom.editor.classList.add("hidden");
    }

    /* ================================
       SAVE / DELETE
    ================================= */

    function save() {

        const macro = readEditor();
        if (!macro.name) {
            alert("Macro name required.");
            return;
        }

        const exists =
            state.users.some(m => m.name === macro.name);

        exists
            ? SNQL.macrosStore.update(macro.name, macro)
            : SNQL.macrosStore.create(macro);

        SNQL.macrosRegistry.define({
            ...macro,
            compile() { return macro.template; }
        }, { override: true });

        refreshState();
        edit(macro.name);
    }

    function remove() {

        if (!state.editing) return;
        if (!confirm("Delete this macro?")) return;

        SNQL.macrosStore.remove(state.editing);

        const def = SNQL.macrosDefaults.get(state.editing);
        if (def) {
            SNQL.macrosRegistry.define(def, { override: true });
        }

        refreshState();
        resetView();
    }

    /* ================================
       EDITOR
    ================================= */

    function clearEditor() {
        $$("#snql-macros-editor input, #snql-macros-editor textarea")
            .forEach(el => el.value = "");

        dom.scopeToggle.checked = false;
        onScopeChange();
    }

    function fillEditor(m) {

        $("#macro-name").value = m.name;
        $("#macro-label").value = m.label || "";
        $("#macro-display").value = m.display || "";
        $("#macro-template").value = m.template || "";

        $("#macro-types").value = join(m.appliesTo?.type);
        $("#macro-references").value = join(m.appliesTo?.reference);
        $("#macro-operators").value = join(m.appliesTo?.operator);
        $("#macro-tables").value = join(m.appliesTo?.table);
        $("#macro-requires-fields").value = join(m.requires?.fields);

        dom.scopeToggle.checked = (m.scope === "where");
        onScopeChange();
    }

    function readEditor() {

        const isWhere = dom.scopeToggle.checked;

        const macro = {
            name: $("#macro-name").value.trim(),
            label: $("#macro-label").value.trim(),
            display: $("#macro-display").value.trim(),
            template: $("#macro-template").value.trim(),
            scope: isWhere ? "where" : "value"
        };

        if (!isWhere) {
            macro.appliesTo = {
                type: split("#macro-types"),
                reference: split("#macro-references"),
                operator: split("#macro-operators"),
                table: split("#macro-tables")
            };
        } else {
            macro.requires = {
                fields: split("#macro-requires-fields")
            };
        }

        return macro;
    }

    function split(sel) {
        const v = $(sel)?.value;
        return v
            ? v.split(",").map(s => s.trim()).filter(Boolean)
            : undefined;
    }

    function join(arr) {
        return arr ? arr.join(",") : "";
    }

    function updateSaveState() {

        if (!originalSnapshot) {
            dom.saveBtn.disabled = false;
            return;
        }

        const current = JSON.stringify(readEditor());
        dom.saveBtn.disabled = (current === originalSnapshot);
    }

    function onScopeChange() {

        const isWhere = dom.scopeToggle.checked;

        dom.scopeLabel.textContent =
            isWhere ? "Where Macro" : "Value Macro";

        dom.appliesSection?.classList.toggle("hidden", isWhere);
        dom.requiresSection?.classList.toggle("hidden", !isWhere);

        updateSaveState();
    }

    return { open };

})();
