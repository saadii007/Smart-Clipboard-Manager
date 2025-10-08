import React, { useEffect, useState } from "react";
import {
  Clipboard,
  Pin,
  PinOff,
  Trash2,
  Copy,
  Clock,
  Search,
  Link2,
} from "lucide-react";

export default function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    chrome.storage.local.get("items", (result) => {
      setItems(result.items || []);
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.items) setItems(changes.items.newValue || []);
    });
  }, []);

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const togglePin = (id) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, pinned: !i.pinned } : i
    );
    saveItems(updated);
  };

  const deleteItem = (id) => {
    saveItems(items.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    saveItems([]);
  };

  const saveItems = (data) => {
    chrome.storage.local.set({ items: data });
    setItems(data);
  };

  const copyCurrentURL = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const newItem = {
        id: Date.now(),
        text: tab.url,
        timestamp: new Date().toISOString(),
      };
      const updated = [newItem, ...items];
      saveItems(updated);
      await navigator.clipboard.writeText(tab.url);
    }
  };

  const filtered = items.filter((i) =>
    i.text.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedItems = filtered
    .filter((i) => i.pinned)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const recentItems = filtered
    .filter((i) => !i.pinned)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="w-[380px] h-[460px] bg-[#1e1e2e] text-gray-200 font-sans rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 bg-[#2a2a3c] border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-xl font-extrabold tracking-wide">
            <Clipboard size={22} /> Smart Clipboard
          </div>
          <button
            onClick={copyCurrentURL}
            title="Copy current page URL"
            className="p-1 rounded-md hover:bg-indigo-600/30"
          >
            <Link2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#252538] rounded-lg px-2 py-1 border border-gray-700 mb-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search clipboard..."
            className="bg-transparent w-full text-sm focus:outline-none text-gray-200 placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center mb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`text-xs px-2 py-1 rounded-md ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pinned")}
              className={`text-xs px-2 py-1 rounded-md ${
                filter === "pinned"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Pinned
            </button>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-400 hover:text-red-500 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

{/* Clipboard List */}
<div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
  {filtered.length === 0 ? (
    <p className="text-sm text-gray-500 text-center mt-4">
      No items yet. Copy something!
    </p>
  ) : (
    <>
      {/* 📌 Pinned section */}
      {(filter === "all" || filter === "pinned") && pinnedItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1 px-1 flex items-center gap-1">
            📌 <span>Pinned</span>
          </p>
          <div className="space-y-2">
            {pinnedItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <ClipboardItem
                  item={item}
                  onCopy={handleCopy}
                  onPin={togglePin}
                  onDelete={deleteItem}
                />
                {idx < pinnedItems.length - 1 && (
                  <div className="border-t border-gray-700/40 my-1"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 🕒 Recent section */}
      {filter === "all" && recentItems.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1 px-1 flex items-center gap-1">
            🕒 <span>Recent</span>
          </p>
          <div className="space-y-2">
            {recentItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <ClipboardItem
                  item={item}
                  onCopy={handleCopy}
                  onPin={togglePin}
                  onDelete={deleteItem}
                />
                {idx < recentItems.length - 1 && (
                  <div className="border-t border-gray-700/40 my-1"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </>
  )}
</div>
    </div>
  );
}

const ClipboardItem = ({ item, onCopy, onPin, onDelete }) => {
  const detectType = (text) => {
    const urlPattern = /(https?:\/\/[^\s]+)/;
    const codePattern = /[{}();=\[\]]|function|const|let|=>|<.*>/;
    if (urlPattern.test(text)) return "Link";
    if (codePattern.test(text)) return "Code";
    return "Text";
  };

  const typeColors = {
    Text: "bg-blue-600/40 text-blue-100 border border-blue-400/30",
    Link: "bg-yellow-500/30 text-yellow-100 border border-yellow-400/30",
    Code: "bg-purple-600/40 text-purple-100 border border-purple-400/30",
  };

  const type = detectType(item.text);

  const timeAgo = (timestamp) => {
    const diff = (Date.now() - new Date(timestamp).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="group bg-[#2a2a3c] p-3 rounded-xl border border-gray-700 hover:border-indigo-500 transition-all duration-150 flex justify-between items-start">
      <div className="w-4/5">
<p
  className="text-sm break-words leading-tight"
  style={{
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  }}
>
  {item.text}
</p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] ${typeColors[type]}`}
          >
            {type}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(item.timestamp)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onCopy(item.text)}
          title="Copy"
          className="p-1 rounded-md hover:bg-indigo-600/30"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onPin(item.id)}
          title={item.pinned ? "Unpin" : "Pin"}
          className="p-1 rounded-md hover:bg-yellow-500/30"
        >
          {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="p-1 rounded-md hover:bg-red-600/30"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
