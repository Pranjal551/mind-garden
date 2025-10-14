import type { AI4HState } from "../types";

let broadcastChannel: BroadcastChannel | null = null;
const STORAGE_KEY = "ai4h_state";
const TAB_KEY = "ai4h_lastTab";

export function initBroadcast(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  
  try {
    if (!broadcastChannel && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("ai4h");
    }
    return broadcastChannel;
  } catch (error) {
    console.warn("BroadcastChannel not supported");
    return null;
  }
}

export function broadcastState(state: AI4HState): void {
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  // Broadcast to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "STATE_UPDATE", state });
  } else {
    // Fallback: trigger storage event
    window.dispatchEvent(new StorageEvent("storage", {
      key: STORAGE_KEY,
      newValue: JSON.stringify(state),
    }));
  }
}

export function loadStoredState(): AI4HState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Failed to load stored state");
    return null;
  }
}

export function saveLastTab(tab: string): void {
  localStorage.setItem(TAB_KEY, tab);
}

export function loadLastTab(): string {
  return localStorage.getItem(TAB_KEY) || "user";
}

export function onStateUpdate(callback: (state: AI4HState) => void): () => void {
  const channel = initBroadcast();
  
  const handlers: Array<() => void> = [];
  
  if (channel) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "STATE_UPDATE") {
        callback(event.data.state);
      }
    };
    channel.addEventListener("message", handleMessage);
    handlers.push(() => channel.removeEventListener("message", handleMessage));
  }
  
  // Fallback: listen to storage events
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const state = JSON.parse(event.newValue);
        callback(state);
      } catch (error) {
        console.warn("Failed to parse storage state");
      }
    }
  };
  window.addEventListener("storage", handleStorage);
  handlers.push(() => window.removeEventListener("storage", handleStorage));
  
  return () => handlers.forEach(cleanup => cleanup());
}
