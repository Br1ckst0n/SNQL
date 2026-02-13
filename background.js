console.log("[SNQL] background loaded");

chrome.commands.onCommand.addListener(command => {
    console.log("[SNQL] command received:", command);

    if (command !== "open-snql") return;

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        console.log("[SNQL] active tabs:", tabs);

        if (!tabs?.length) return;

        chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "SNQL_OPEN_MODAL" },
            () => {
                console.log("[SNQL] message sent to tab", tabs[0].id);
                if (chrome.runtime.lastError) {
                    console.warn("[SNQL] sendMessage error:", chrome.runtime.lastError);
                }
            }
        );
    });
});
