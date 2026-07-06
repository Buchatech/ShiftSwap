(function attachClaimsModule(global) {
  const Utils = global.ShiftSwapUtils;

  function app() {
    return global.ShiftSwapApp;
  }

  function claimShift(shiftId, fromDetails = false) {
    const state = app().getState();
    const user = app().getCurrentUser();
    const shift = state.shifts.find((item) => item.id === shiftId);

    if (!shift) {
      Utils.showToast("Shift not found.", "error");
      return;
    }

    if (shift.status !== "open") {
      Utils.showToast("This shift is no longer open.", "error");
      return;
    }

    if (shift.postedBy === user.id) {
      Utils.showToast("You cannot claim your own shift.", "error");
      return;
    }

    shift.status = "claimed";
    shift.claimStatus = "pending";
    shift.claimedBy = user.id;
    shift.overtimeRisk = Math.random() < 0.45;
    app().saveState(state);
    app().upsertAudit("shift_claimed", shift.id, `${user.name} claimed shift`, user.name);
    Utils.showToast("Shift claimed. Pending manager approval.", "success");

    if (fromDetails) {
      global.location.reload();
      return;
    }
    global.ShiftSwapShifts.refreshPageData();
  }

  function cancelClaim(shiftId, fromDetails = false) {
    const state = app().getState();
    const user = app().getCurrentUser();
    const shift = state.shifts.find((item) => item.id === shiftId);

    if (!shift) {
      Utils.showToast("Shift not found.", "error");
      return;
    }

    const canCancel = shift.status === "claimed" && shift.claimStatus === "pending" && shift.claimedBy === user.id;
    if (!canCancel) {
      Utils.showToast("Claim can only be cancelled while pending approval.", "error");
      return;
    }

    shift.status = "open";
    shift.claimStatus = null;
    shift.claimedBy = null;
    shift.overtimeRisk = false;
    app().saveState(state);
    app().upsertAudit("claim_cancelled", shift.id, `${user.name} cancelled pending claim`, user.name);
    Utils.showToast("Claim cancelled. Shift is open again.", "success");

    if (fromDetails) {
      global.location.reload();
      return;
    }
    global.ShiftSwapShifts.refreshPageData();
  }

  function getClaimStatus(shift) {
    if (!shift) {
      return "unknown";
    }
    if (shift.status === "open") {
      return "open";
    }
    return shift.claimStatus || shift.status;
  }

  global.ShiftSwapClaims = {
    claimShift,
    cancelClaim,
    getClaimStatus,
  };
})(window);
