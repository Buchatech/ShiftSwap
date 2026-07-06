(function attachShiftSwapApp(global) {
  const Utils = global.ShiftSwapUtils;

  function seedDemoState() {
    const now = new Date();
    const plusHours = (hours) => new Date(now.getTime() + hours * 60 * 60 * 1000);
    const datePart = (date) => date.toISOString().slice(0, 10);
    const timePart = (date) => date.toTimeString().slice(0, 5);

    return {
      users: [
        { id: "u-emp-1", employeeId: "E1001", name: "Alex Rivera", role: "employee", canToggleDemo: true },
        { id: "u-emp-2", employeeId: "E1002", name: "Jordan Lee", role: "employee", canToggleDemo: false },
        { id: "u-mgr-1", employeeId: "M2001", name: "Morgan Chen", role: "manager", canToggleDemo: true },
        { id: "u-mgr-2", employeeId: "M2002", name: "Taylor Kim", role: "manager", canToggleDemo: true },
      ],
      shifts: [
        { id: "S-1001", postedBy: "u-emp-1", shiftDate: datePart(plusHours(26)), startTime: "08:00", endTime: "16:00", roleName: "RN", location: "Unit A", notes: "Need coverage for family event", status: "open", claimStatus: null, claimedBy: null, overtimeRisk: false, createdAt: new Date().toISOString() },
        { id: "S-1002", postedBy: "u-emp-2", shiftDate: datePart(plusHours(3)), startTime: timePart(plusHours(3)), endTime: timePart(plusHours(11)), roleName: "Lab Tech", location: "Lab 2", notes: "Escalation candidate", status: "open", claimStatus: null, claimedBy: null, overtimeRisk: false, createdAt: new Date().toISOString() },
        { id: "S-1003", postedBy: "u-emp-1", shiftDate: datePart(plusHours(30)), startTime: "10:00", endTime: "18:00", roleName: "Cashier", location: "Front Desk", notes: "Pending approval", status: "claimed", claimStatus: "pending", claimedBy: "u-emp-2", overtimeRisk: true, createdAt: new Date().toISOString() },
        { id: "S-1004", postedBy: "u-emp-2", shiftDate: datePart(plusHours(-24)), startTime: "12:00", endTime: "20:00", roleName: "RN", location: "Unit C", notes: "Approved historical shift", status: "approved", claimStatus: "approved", claimedBy: "u-emp-1", overtimeRisk: false, createdAt: new Date().toISOString() },
        { id: "S-1005", postedBy: "u-emp-1", shiftDate: datePart(plusHours(-12)), startTime: "06:00", endTime: "14:00", roleName: "Support", location: "Clinic East", notes: "Rejected historical shift", status: "rejected", claimStatus: "rejected", claimedBy: "u-emp-2", overtimeRisk: false, createdAt: new Date().toISOString() },
        { id: "S-1006", postedBy: "u-emp-1", shiftDate: datePart(plusHours(40)), startTime: "09:00", endTime: "17:00", roleName: "RN", location: "Unit B", notes: "Cancelled by poster", status: "cancelled", claimStatus: "cancelled", claimedBy: null, overtimeRisk: false, createdAt: new Date().toISOString() },
      ],
      audit: [
        { id: "A-1", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), actorName: "Alex Rivera", action: "shift_posted", shiftId: "S-1004", details: "Posted shift request" },
        { id: "A-2", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(), actorName: "Jordan Lee", action: "shift_claimed", shiftId: "S-1004", details: "Claim submitted" },
        { id: "A-3", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), actorName: "Morgan Chen", action: "claim_approved", shiftId: "S-1004", details: "Approved by manager" },
        { id: "A-4", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), actorName: "System", action: "shift_escalated", shiftId: "S-1002", details: "Unclaimed within 4 hours" },
      ],
    };
  }

  function getDemoMode() {
    const configMode = typeof global.APP_CONFIG?.DEMO_MODE === "boolean" ? global.APP_CONFIG.DEMO_MODE : null;
    if (configMode !== null) {
      Utils.writeStorage(Utils.DEMO_MODE_KEY, configMode);
      return configMode;
    }

    const storedMode = Utils.readStorage(Utils.DEMO_MODE_KEY, null);
    if (typeof storedMode === "boolean") {
      return storedMode;
    }

    Utils.writeStorage(Utils.DEMO_MODE_KEY, true);
    return true;
  }

  function setDemoMode(enabled) {
    Utils.writeStorage(Utils.DEMO_MODE_KEY, Boolean(enabled));
  }

  function getState() {
    let state = Utils.readStorage(Utils.APP_STATE_KEY, null);
    if (!state) {
      state = seedDemoState();
      saveState(state);
    }
    return state;
  }

  function saveState(state) {
    Utils.writeStorage(Utils.APP_STATE_KEY, state);
  }

  function getCurrentUser() {
    const session = Utils.readStorage(Utils.SESSION_KEY, null);
    if (!session?.userId) {
      return null;
    }
    const state = getState();
    return state.users.find((user) => user.id === session.userId) || null;
  }

  function getUserById(userId) {
    return getState().users.find((user) => user.id === userId) || null;
  }

  function upsertAudit(action, shiftId, details, actorName) {
    const state = getState();
    state.audit.unshift({
      id: `A-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: actorName || getCurrentUser()?.name || "System",
      action,
      shiftId,
      details,
    });
    saveState(state);
  }

  function routeForRole(role) {
    return role === "manager" || role === "admin" ? "./pages/manager-dashboard.html" : "./pages/employee-dashboard.html";
  }

  function readRequiredRole() {
    const requiredRole = document.body?.dataset?.requiredRole || "";
    return requiredRole.toLowerCase();
  }

  function isAllowedRole(userRole, requiredRole) {
    if (!requiredRole) {
      return true;
    }
    if (requiredRole === "manager") {
      return ["manager", "admin"].includes(userRole);
    }
    return userRole === requiredRole;
  }

  function attachHeader() {
    const header = document.getElementById("global-header");
    if (!header) {
      return;
    }
    const user = getCurrentUser();
    const isManager = ["manager", "admin"].includes(user?.role);
    const page = document.body.dataset.page;
    const employeeLink = "./employee-dashboard.html";
    const managerLink = "./manager-dashboard.html";
    const reportsLink = "./reports.html";

    const navLink = (href, label, show = true) => {
      if (!show) {
        return "";
      }
      const active = page && href.includes(page) ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100";
      return `<a href="${href}" class="rounded-md px-3 py-2 text-sm font-medium ${active}">${label}</a>`;
    };

    header.className = "border-b border-slate-200 bg-white";
    header.innerHTML = `
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div class="flex items-center gap-4">
          <a href="${isManager ? managerLink : employeeLink}" class="text-lg font-bold text-slate-900">ShiftSwap</a>
          <nav class="flex flex-wrap items-center gap-1" aria-label="Main navigation">
            ${navLink(employeeLink, "Employee")}
            ${navLink(managerLink, "Manager", isManager)}
            ${navLink(reportsLink, "Reports", isManager)}
            ${navLink("./post-shift.html", "Post Shift")}
          </nav>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900">${user?.name || "Guest"} (${user?.role || "—"})</span>
          <button id="logout-btn" class="btn-secondary">Logout</button>
        </div>
      </div>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        Utils.writeStorage(Utils.SESSION_KEY, null);
        global.location.href = "../index.html";
      });
    }
  }

  function updateDemoBanner() {
    const banner = document.getElementById("demo-mode-banner");
    if (!banner) {
      return;
    }
    const enabled = getDemoMode();
    banner.classList.toggle("hidden", !enabled);
    banner.textContent = enabled ? "DEMO MODE • Using sample users and mock shift activity. Actions stay local and safe." : "";
  }

  function attachDemoModeControls() {
    const toggle = document.getElementById("demo-mode-toggle");
    const description = document.getElementById("demo-mode-description");
    if (!toggle) {
      return;
    }
    const user = getCurrentUser();
    const allowed = !user || user.canToggleDemo || ["manager", "admin"].includes(user.role);
    toggle.checked = getDemoMode();
    toggle.disabled = !allowed;

    if (description) {
      description.textContent = allowed
        ? "Uses realistic sample data and safe local actions for training/testing."
        : "Only managers or permitted users can switch demo mode in this environment.";
    }

    toggle.addEventListener("change", () => {
      if (!allowed) {
        Utils.showToast("You do not have permission to switch demo mode.", "error");
        toggle.checked = getDemoMode();
        return;
      }
      setDemoMode(toggle.checked);
      updateDemoBanner();
      Utils.showToast(`Demo mode ${toggle.checked ? "enabled" : "disabled"}.`, "success");
    });
  }

  function guardPageAccess() {
    const requiresAuth = document.body.dataset.requiresAuth === "true";
    const currentUser = getCurrentUser();
    const page = document.body.dataset.page;
    const isRoot = page === "login";
    if (!requiresAuth) {
      if (isRoot && currentUser) {
        global.location.href = routeForRole(currentUser.role);
      }
      return true;
    }

    if (!currentUser) {
      global.location.href = "../index.html";
      return false;
    }

    const requiredRole = readRequiredRole();
    if (!isAllowedRole(currentUser.role, requiredRole)) {
      Utils.showToast("You are not authorized for this page.", "error");
      global.location.href = "./employee-dashboard.html";
      return false;
    }

    return true;
  }

  function attachLoginHandler() {
    const form = document.getElementById("login-form");
    if (!form) {
      return;
    }
    const message = document.getElementById("login-message");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const employeeId = String(new FormData(form).get("employeeId") || "").trim().toUpperCase();
      const state = getState();
      const user = state.users.find((item) => item.employeeId.toUpperCase() === employeeId);

      if (!user) {
        if (message) {
          message.textContent = "Employee ID not found.";
          message.className = "mt-3 text-sm text-red-700";
        }
        Utils.showToast("Login failed. Check employee ID.", "error");
        return;
      }

      Utils.writeStorage(Utils.SESSION_KEY, { userId: user.id, role: user.role, employeeId: user.employeeId });
      if (message) {
        message.textContent = `Welcome ${user.name}. Redirecting...`;
        message.className = "mt-3 text-sm text-green-700";
      }
      upsertAudit("user_logged_in", null, `User ${user.employeeId} signed in`, user.name);
      global.setTimeout(() => {
        global.location.href = routeForRole(user.role);
      }, 350);
    });
  }

  function init() {
    updateDemoBanner();
    attachDemoModeControls();
    if (!guardPageAccess()) {
      return;
    }
    attachHeader();
    attachLoginHandler();

    global.ShiftSwapApp = {
      getState,
      saveState,
      getCurrentUser,
      getUserById,
      getDemoMode,
      setDemoMode,
      upsertAudit,
    };

    global.dispatchEvent(new CustomEvent("shiftswap:ready", { detail: { page: document.body.dataset.page || "" } }));
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
