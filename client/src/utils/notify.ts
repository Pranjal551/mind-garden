export async function safeNotify(title: string, body: string): Promise<void> {
  // Request permission if not granted
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  }

  // Trigger vibration if available
  if ("vibrate" in navigator) {
    navigator.vibrate(200);
  }
}

export function toast(message: string, type: "success" | "error" | "info" = "info") {
  // Simple toast implementation
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
    type === "success" ? "bg-green-600" :
    type === "error" ? "bg-red-600" :
    "bg-blue-600"
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}
