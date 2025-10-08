console.log("Smart Clipboard content script loaded ✅");

document.addEventListener("copy", async () => {
  const text = window.getSelection().toString().trim();
  if (!text) return;

  const newItem = {
    id: Date.now(),
    text,
    timestamp: new Date().toISOString(),
  };

  try {
    const result = await chrome.storage.local.get("items");
    const items = result.items || [];

    if (items.some((i) => i.text === text)) return;

    items.unshift(newItem);
    await chrome.storage.local.set({ items });
    console.log("✅ Text saved:", newItem);
  } catch (err) {
    console.warn("Clipboard save failed:", err);
  }
});
