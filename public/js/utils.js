(function attachShiftSwapUtils(global) {
  const APP_STATE_KEY = "shiftswap_state_v1";
  const DEMO_MODE_KEY = "shiftswap_demo_mode";
  const SESSION_KEY = "shiftswap_session_v1";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function readStorage(key, fallback = null) {
    const raw = global.localStorage.getItem(key);
    return raw ? safeJsonParse(raw, fallback) : fallback;
  }

  function writeStorage(key, value) {
    global.localStorage.setItem(key, JSON.stringify(value));
  }

  async function apiRequest(url, options = {}, fallback) {
    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      if (typeof fallback === "function") {
        return fallback(error);
      }
      throw error;
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "—";
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function formatTime(timeString) {
    if (!timeString) {
      return "—";
    }
    const [hours, minutes] = String(timeString).split(":");
    const date = new Date();
    date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDateTime(dateTimeString) {
    if (!dateTimeString) {
      return "—";
    }
    const date = new Date(dateTimeString);
    if (Number.isNaN(date.getTime())) {
      return dateTimeString;
    }
    return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function isWithinHours(dateString, timeString, thresholdHours) {
    if (!dateString || !timeString) {
      return false;
    }
    const target = new Date(`${dateString}T${timeString}`);
    if (Number.isNaN(target.getTime())) {
      return false;
    }
    const diffHours = (target.getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours <= thresholdHours && diffHours >= 0;
  }

  function statusLabel(status) {
    if (!status) {
      return "Unknown";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function renderStatusBadge(status) {
    const normalized = String(status || "").toLowerCase();
    const className = ["open", "claimed", "pending", "approved", "rejected", "cancelled"].includes(normalized) ? normalized : "cancelled";
    return `<span class="badge badge-${className}" aria-label="Status ${statusLabel(className)}">${statusLabel(className)}</span>`;
  }

  function ensureToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = "info") {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    global.setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map((item) => `"${String(item || "").replace(/"/g, "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  global.ShiftSwapUtils = {
    APP_STATE_KEY,
    DEMO_MODE_KEY,
    SESSION_KEY,
    apiRequest,
    readStorage,
    writeStorage,
    formatDate,
    formatTime,
    formatDateTime,
    isWithinHours,
    renderStatusBadge,
    showToast,
    downloadCsv,
  };
})(window);
