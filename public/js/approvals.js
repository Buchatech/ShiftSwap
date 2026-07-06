(function attachApprovalsModule(global) {
  const Utils = global.ShiftSwapUtils;

  function app() {
    return global.ShiftSwapApp;
  }

  function approveShift(shiftId, fromDetails = false) {
    const state = app().getState();
    const user = app().getCurrentUser();
    const shift = state.shifts.find((item) => item.id === shiftId);

    if (!shift || shift.status !== "claimed") {
      Utils.showToast("Only pending claimed shifts can be approved.", "error");
      return;
    }

    shift.status = "approved";
    shift.claimStatus = "approved";
    app().saveState(state);
    app().upsertAudit("claim_approved", shift.id, `${user.name} approved claim`, user.name);
    Utils.showToast("Shift claim approved.", "success");

    if (fromDetails) {
      global.location.reload();
      return;
    }
    renderManagerDashboard();
  }

  function rejectShift(shiftId, fromDetails = false) {
    const state = app().getState();
    const user = app().getCurrentUser();
    const shift = state.shifts.find((item) => item.id === shiftId);

    if (!shift || shift.status !== "claimed") {
      Utils.showToast("Only pending claimed shifts can be rejected.", "error");
      return;
    }

    shift.status = "rejected";
    shift.claimStatus = "rejected";
    app().saveState(state);
    app().upsertAudit("claim_rejected", shift.id, `${user.name} rejected claim`, user.name);
    Utils.showToast("Shift claim rejected.", "success");

    if (fromDetails) {
      global.location.reload();
      return;
    }
    renderManagerDashboard();
  }

  function renderPendingApprovals(shifts) {
    const container = document.getElementById("pending-approvals-list");
    if (!container) {
      return;
    }
    const pending = shifts.filter((shift) => shift.status === "claimed" && shift.claimStatus === "pending");

    container.innerHTML = pending.length
      ? pending.map((shift) => `
          <article class="card-panel">
            <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
              <h3 class="font-semibold text-slate-900">${shift.roleName} • ${Utils.formatDate(shift.shiftDate)}</h3>
              ${Utils.renderStatusBadge(shift.claimStatus)}
            </div>
            <p class="text-sm text-slate-600">Posted by <span class="font-medium text-slate-700">${shift.postedByName}</span> • Claimed by <span class="font-medium text-slate-700">${shift.claimedByName}</span></p>
            <p class="mt-2 text-sm text-slate-600">${shift.location} • ${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)}</p>
            ${shift.overtimeRisk ? `<div class="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-medium text-amber-800">Overtime risk flagged for this claim.</div>` : ""}
            <div class="mt-3 flex flex-wrap gap-2">
              <button class="btn-primary manager-approve-btn" data-shift-id="${shift.id}">Approve</button>
              <button class="btn-danger manager-reject-btn" data-shift-id="${shift.id}">Reject</button>
              <a class="btn-secondary" href="./shift-details.html?id=${encodeURIComponent(shift.id)}">Details</a>
            </div>
          </article>
        `).join("")
      : `<p class="card-panel text-sm text-slate-600">No pending approvals at this time.</p>`;

    container.querySelectorAll(".manager-approve-btn").forEach((button) => {
      button.addEventListener("click", () => approveShift(button.dataset.shiftId));
    });

    container.querySelectorAll(".manager-reject-btn").forEach((button) => {
      button.addEventListener("click", () => rejectShift(button.dataset.shiftId));
    });
  }

  function renderEscalations(shifts) {
    const container = document.getElementById("escalation-alerts");
    if (!container) {
      return;
    }

    const alerts = shifts.filter((shift) => shift.status === "open" && Utils.isWithinHours(shift.shiftDate, shift.startTime, 4));
    container.innerHTML = alerts.length
      ? alerts.map((shift) => `
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p class="font-semibold">Coverage risk: ${shift.roleName} at ${shift.location}</p>
            <p>${Utils.formatDate(shift.shiftDate)} • ${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)} • Shift ${shift.id}</p>
          </div>
        `).join("")
      : `<p class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">No active escalations.</p>`;
  }

  function renderOvertimeIndicators(shifts) {
    const container = document.getElementById("overtime-indicators");
    if (!container) {
      return;
    }

    const risks = shifts.filter((shift) => shift.overtimeRisk && shift.claimedByName !== "—");
    container.innerHTML = risks.length
      ? risks.map((shift) => `
          <article class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p class="font-semibold">${shift.claimedByName}</p>
            <p>${shift.roleName} • ${Utils.formatDate(shift.shiftDate)}</p>
            <p>Risk: weekly total may exceed 40 hours.</p>
          </article>
        `).join("")
      : `<p class="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">No overtime warnings right now.</p>`;
  }

  function renderAllShifts(shifts) {
    const table = document.getElementById("all-shifts-table");
    if (!table) {
      return;
    }
    const statusFilter = String(document.getElementById("manager-status-filter")?.value || "all");
    const search = String(document.getElementById("manager-search-filter")?.value || "").trim().toLowerCase();

    const filtered = shifts.filter((shift) => {
      const statusMatch = statusFilter === "all" || shift.status === statusFilter;
      const searchMatch = !search || shift.roleName.toLowerCase().includes(search) || (shift.location || "").toLowerCase().includes(search);
      return statusMatch && searchMatch;
    });

    table.innerHTML = filtered.length
      ? filtered.map((shift) => `
          <tr>
            <td>${Utils.formatDate(shift.shiftDate)}</td>
            <td>${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)}</td>
            <td>${shift.roleName}</td>
            <td>${shift.location || "—"}</td>
            <td>${shift.postedByName}</td>
            <td>${Utils.renderStatusBadge(shift.status)}</td>
            <td><a href="./shift-details.html?id=${encodeURIComponent(shift.id)}" class="btn-secondary">Open</a></td>
          </tr>
        `).join("")
      : `<tr><td colspan="7" class="text-slate-500">No shifts match the active filters.</td></tr>`;
  }

  function renderManagerDashboard() {
    if (document.body.dataset.page !== "manager-dashboard") {
      return;
    }
    const shifts = global.ShiftSwapShifts.listShifts();
    renderPendingApprovals(shifts);
    renderEscalations(shifts);
    renderOvertimeIndicators(shifts);
    renderAllShifts(shifts);
  }

  function attachDashboardFilters() {
    const statusFilter = document.getElementById("manager-status-filter");
    const searchFilter = document.getElementById("manager-search-filter");
    if (statusFilter) {
      statusFilter.addEventListener("change", renderManagerDashboard);
    }
    if (searchFilter) {
      searchFilter.addEventListener("input", renderManagerDashboard);
    }
  }

  global.ShiftSwapApprovals = {
    renderManagerDashboard,
    approveShift,
    rejectShift,
  };

  global.addEventListener("shiftswap:ready", () => {
    attachDashboardFilters();
    renderManagerDashboard();
  });
})(window);
