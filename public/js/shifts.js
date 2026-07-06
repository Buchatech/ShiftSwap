(function attachShiftModules(global) {
  const Utils = global.ShiftSwapUtils;

  function getApp() {
    return global.ShiftSwapApp;
  }

  function enrichShift(shift) {
    const app = getApp();
    const postedBy = app.getUserById(shift.postedBy);
    const claimedBy = shift.claimedBy ? app.getUserById(shift.claimedBy) : null;
    return {
      ...shift,
      postedByName: postedBy?.name || "Unknown",
      claimedByName: claimedBy?.name || "—",
    };
  }

  function listShifts() {
    const app = getApp();
    return app.getState().shifts.map(enrichShift);
  }

  function persistShifts(nextShifts) {
    const app = getApp();
    const state = app.getState();
    state.shifts = nextShifts;
    app.saveState(state);
  }

  function openShiftCard(shift) {
    return `
      <article class="card-panel">
        <div class="mb-2 flex items-start justify-between gap-2">
          <h3 class="font-semibold text-slate-900">${shift.roleName}</h3>
          ${Utils.renderStatusBadge(shift.status)}
        </div>
        <dl class="space-y-1 text-sm text-slate-600">
          <div><dt class="inline font-medium text-slate-700">Date:</dt> <dd class="inline">${Utils.formatDate(shift.shiftDate)}</dd></div>
          <div><dt class="inline font-medium text-slate-700">Time:</dt> <dd class="inline">${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)}</dd></div>
          <div><dt class="inline font-medium text-slate-700">Location:</dt> <dd class="inline">${shift.location || "—"}</dd></div>
          <div><dt class="inline font-medium text-slate-700">Posted by:</dt> <dd class="inline">${shift.postedByName}</dd></div>
        </dl>
        <div class="mt-3 flex gap-2">
          <a href="./shift-details.html?id=${encodeURIComponent(shift.id)}" class="btn-secondary">Details</a>
          <button class="btn-primary claim-shift-btn" data-shift-id="${shift.id}">Claim Shift</button>
        </div>
      </article>
    `;
  }

  function renderEmployeeDashboard() {
    const app = getApp();
    const currentUser = app.getCurrentUser();
    const shifts = listShifts();

    const openContainer = document.getElementById("open-shifts-list");
    if (openContainer) {
      const open = shifts.filter((shift) => shift.status === "open" && shift.postedBy !== currentUser.id);
      openContainer.innerHTML = open.length ? open.map(openShiftCard).join("") : `<p class="card-panel text-sm text-slate-600">No open shifts available right now.</p>`;
      openContainer.querySelectorAll(".claim-shift-btn").forEach((button) => {
        button.addEventListener("click", () => global.ShiftSwapClaims.claimShift(button.dataset.shiftId));
      });
    }

    const postedTable = document.getElementById("posted-shifts-table");
    if (postedTable) {
      const mine = shifts.filter((shift) => shift.postedBy === currentUser.id);
      postedTable.innerHTML = mine.length
        ? mine.map((shift) => `
            <tr>
              <td>${Utils.formatDate(shift.shiftDate)}</td>
              <td>${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)}</td>
              <td>${shift.roleName}</td>
              <td>${shift.location || "—"}</td>
              <td>${Utils.renderStatusBadge(shift.status)}</td>
              <td><a class="btn-secondary" href="./shift-details.html?id=${encodeURIComponent(shift.id)}">View</a></td>
            </tr>
          `).join("")
        : `<tr><td colspan="6" class="text-slate-500">No posted shifts found.</td></tr>`;
    }

    const claimedTable = document.getElementById("claimed-shifts-table");
    if (claimedTable) {
      const myClaims = shifts.filter((shift) => shift.claimedBy === currentUser.id);
      claimedTable.innerHTML = myClaims.length
        ? myClaims.map((shift) => `
            <tr>
              <td>${Utils.formatDate(shift.shiftDate)}</td>
              <td>${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)}</td>
              <td>${shift.roleName}</td>
              <td>${Utils.renderStatusBadge(shift.status)}</td>
              <td>${Utils.renderStatusBadge(shift.claimStatus || "pending")}</td>
              <td class="space-x-2">
                <a class="btn-secondary" href="./shift-details.html?id=${encodeURIComponent(shift.id)}">View</a>
                ${shift.status === "claimed" && shift.claimStatus === "pending" ? `<button class="btn-danger cancel-claim-btn" data-shift-id="${shift.id}">Cancel Claim</button>` : ""}
              </td>
            </tr>
          `).join("")
        : `<tr><td colspan="6" class="text-slate-500">No claimed shifts found.</td></tr>`;
      claimedTable.querySelectorAll(".cancel-claim-btn").forEach((button) => {
        button.addEventListener("click", () => global.ShiftSwapClaims.cancelClaim(button.dataset.shiftId));
      });
    }
  }

  function validateShiftPayload(payload) {
    if (!payload.shiftDate || !payload.startTime || !payload.endTime || !payload.roleName || !payload.location) {
      return "Please complete all required fields.";
    }
    const start = new Date(`${payload.shiftDate}T${payload.startTime}`);
    const end = new Date(`${payload.shiftDate}T${payload.endTime}`);
    if (end <= start) {
      return "End time must be later than start time.";
    }
    return null;
  }

  function attachPostShiftForm() {
    const form = document.getElementById("post-shift-form");
    if (!form) {
      return;
    }

    const app = getApp();
    const user = app.getCurrentUser();
    const message = document.getElementById("post-shift-message");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        shiftDate: String(data.shiftDate || ""),
        startTime: String(data.startTime || ""),
        endTime: String(data.endTime || ""),
        roleName: String(data.roleName || "").trim(),
        location: String(data.location || "").trim(),
        notes: String(data.notes || "").trim(),
      };

      const validationError = validateShiftPayload(payload);
      if (validationError) {
        message.textContent = validationError;
        message.className = "mt-4 text-sm text-red-700";
        Utils.showToast(validationError, "error");
        return;
      }

      const state = app.getState();
      const newShift = {
        id: `S-${Date.now()}`,
        postedBy: user.id,
        status: "open",
        claimStatus: null,
        claimedBy: null,
        overtimeRisk: false,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      state.shifts.unshift(newShift);
      app.saveState(state);
      app.upsertAudit("shift_posted", newShift.id, `Shift posted for ${newShift.shiftDate}`, user.name);

      form.reset();
      message.textContent = "Shift posted successfully.";
      message.className = "mt-4 text-sm text-green-700";
      Utils.showToast("Shift posted successfully.", "success");
    });
  }

  function renderShiftDetails() {
    const detailsCard = document.getElementById("shift-details-card");
    if (!detailsCard) {
      return;
    }

    const app = getApp();
    const params = new URLSearchParams(global.location.search);
    const shiftId = params.get("id");
    const shift = listShifts().find((item) => item.id === shiftId);

    if (!shift) {
      detailsCard.innerHTML = `<p class="text-red-700">Shift not found.</p>`;
      return;
    }

    detailsCard.innerHTML = `
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="text-xl font-semibold text-slate-900">${shift.roleName}</h2>
        ${Utils.renderStatusBadge(shift.status)}
      </div>
      <dl class="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
        <div><dt class="font-medium text-slate-800">Shift ID</dt><dd>${shift.id}</dd></div>
        <div><dt class="font-medium text-slate-800">Date</dt><dd>${Utils.formatDate(shift.shiftDate)}</dd></div>
        <div><dt class="font-medium text-slate-800">Time</dt><dd>${Utils.formatTime(shift.startTime)} - ${Utils.formatTime(shift.endTime)}</dd></div>
        <div><dt class="font-medium text-slate-800">Location</dt><dd>${shift.location || "—"}</dd></div>
        <div><dt class="font-medium text-slate-800">Posted by</dt><dd>${shift.postedByName}</dd></div>
        <div><dt class="font-medium text-slate-800">Claimed by</dt><dd>${shift.claimedByName}</dd></div>
      </dl>
      <p class="mt-4 text-sm text-slate-600">${shift.notes || "No additional notes."}</p>
    `;

    const actionContainer = document.getElementById("shift-action-controls");
    const currentUser = app.getCurrentUser();
    const manager = ["manager", "admin"].includes(currentUser.role);

    const actionButtons = [];
    if (shift.status === "open" && shift.postedBy !== currentUser.id) {
      actionButtons.push(`<button class="btn-primary" id="detail-claim-btn" data-shift-id="${shift.id}">Claim Shift</button>`);
    }
    if (shift.status === "claimed" && shift.claimStatus === "pending" && shift.claimedBy === currentUser.id) {
      actionButtons.push(`<button class="btn-danger" id="detail-cancel-btn" data-shift-id="${shift.id}">Cancel Claim</button>`);
    }
    if (manager && shift.status === "claimed") {
      actionButtons.push(`
        <div class="flex flex-wrap gap-2">
          <button class="btn-primary" id="detail-approve-btn" data-shift-id="${shift.id}">Approve</button>
          <button class="btn-danger" id="detail-reject-btn" data-shift-id="${shift.id}">Reject</button>
        </div>
      `);
    }

    const overtimeWarning = shift.overtimeRisk
      ? `<div class="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Overtime risk warning: approval may push this employee over 40 hours/week.</div>`
      : "";

    actionContainer.innerHTML = `
      <h2 class="section-title">Actions</h2>
      ${overtimeWarning}
      <div class="flex flex-wrap gap-3">
        ${actionButtons.length ? actionButtons.join("") : `<span class="text-sm text-slate-500">No actions available for your role.</span>`}
      </div>
    `;

    const claimBtn = document.getElementById("detail-claim-btn");
    if (claimBtn) {
      claimBtn.addEventListener("click", () => global.ShiftSwapClaims.claimShift(shift.id, true));
    }

    const cancelBtn = document.getElementById("detail-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => global.ShiftSwapClaims.cancelClaim(shift.id, true));
    }

    const approveBtn = document.getElementById("detail-approve-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", () => global.ShiftSwapApprovals.approveShift(shift.id, true));
    }

    const rejectBtn = document.getElementById("detail-reject-btn");
    if (rejectBtn) {
      rejectBtn.addEventListener("click", () => global.ShiftSwapApprovals.rejectShift(shift.id, true));
    }

    renderShiftAudit(shift.id);
  }

  function renderShiftAudit(shiftId) {
    const app = getApp();
    const table = document.getElementById("shift-audit-table");
    if (!table) {
      return;
    }

    const records = app.getState().audit.filter((row) => row.shiftId === shiftId);
    table.innerHTML = records.length
      ? records.map((row) => `
          <tr>
            <td>${Utils.formatDateTime(row.timestamp)}</td>
            <td>${row.actorName}</td>
            <td>${row.action}</td>
            <td>${row.details || "—"}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="text-slate-500">No audit records found.</td></tr>`;
  }

  function renderReports() {
    const tableBody = document.getElementById("audit-table-body");
    if (!tableBody) {
      return;
    }

    const app = getApp();
    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");

    const draw = () => {
      const from = fromInput?.value ? new Date(`${fromInput.value}T00:00:00`) : null;
      const to = toInput?.value ? new Date(`${toInput.value}T23:59:59`) : null;
      const rows = app.getState().audit.filter((entry) => {
        const ts = new Date(entry.timestamp);
        const fromOk = !from || ts >= from;
        const toOk = !to || ts <= to;
        return fromOk && toOk;
      });

      tableBody.innerHTML = rows.length
        ? rows.map((row) => `
            <tr>
              <td>${Utils.formatDateTime(row.timestamp)}</td>
              <td>${row.actorName}</td>
              <td>${row.action}</td>
              <td>${row.shiftId || "—"}</td>
              <td>${row.details || "—"}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="5" class="text-slate-500">No records found for selected date range.</td></tr>`;
    };

    const filterBtn = document.getElementById("apply-report-filters-btn");
    if (filterBtn) {
      filterBtn.addEventListener("click", draw);
    }

    const exportBtn = document.getElementById("export-csv-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const records = app.getState().audit;
        const rows = [
          ["timestamp", "actor", "action", "shift_id", "details"],
          ...records.map((row) => [row.timestamp, row.actorName, row.action, row.shiftId || "", row.details || ""]),
        ];
        Utils.downloadCsv(`shiftswap-audit-${new Date().toISOString().slice(0, 10)}.csv`, rows);
        app.upsertAudit("audit_exported", null, "CSV export generated");
        Utils.showToast("CSV export generated.", "success");
      });
    }

    draw();
  }

  function refreshPageData() {
    const page = document.body.dataset.page;
    if (page === "employee-dashboard") {
      renderEmployeeDashboard();
    }
    if (page === "shift-details") {
      renderShiftDetails();
    }
    if (page === "manager-dashboard") {
      global.ShiftSwapApprovals.renderManagerDashboard();
    }
    if (page === "reports") {
      renderReports();
    }
  }

  function updateShift(shiftId, updater) {
    const shifts = listShifts();
    const next = shifts.map((item) => (item.id === shiftId ? updater({ ...item }) : item)).map((shift) => ({
      id: shift.id,
      postedBy: shift.postedBy,
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      roleName: shift.roleName,
      location: shift.location,
      notes: shift.notes,
      status: shift.status,
      claimStatus: shift.claimStatus || null,
      claimedBy: shift.claimedBy || null,
      overtimeRisk: Boolean(shift.overtimeRisk),
      createdAt: shift.createdAt,
    }));
    persistShifts(next);
  }

  global.ShiftSwapShifts = {
    listShifts,
    refreshPageData,
    updateShift,
    renderShiftDetails,
  };

  global.addEventListener("shiftswap:ready", () => {
    const app = getApp();
    if (!app) {
      return;
    }
    refreshPageData();
    attachPostShiftForm();
  });
})(window);
