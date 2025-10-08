chrome.runtime.onStartup.addListener(() => {
  console.log("🔄 Extension restarted — background active again");
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "PING") return;

  if (message.type === "SAVE_CLIPBOARD_ITEM") {
    const newItem = message.payload;
    const result = await chrome.storage.local.get("items");
    const items = result.items || [];

    if (items.some((i) => i.text === newItem.text)) return;

    items.unshift(newItem);
    await chrome.storage.local.set({ items });
    console.log("✅ Saved new clipboard item:", newItem);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^https?:/.test(tab.url)) {
    chrome.scripting.executeScript(
      { target: { tabId }, files: ["src/content/contentScript.js"] },
      () => {
        if (chrome.runtime.lastError) {
          console.warn("Script injection failed:", chrome.runtime.lastError.message);
        } else {
          console.log("📄 Content script injected into", tab.url);
        }
      }
    );
  }
});
