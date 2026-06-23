# ShiftSwap Requirements (Structured from Unstructured Inputs)

## User Stories

### 1. Shift Posting
As an employee, I want to post a shift I cannot cover, so that qualified coworkers can pick it up.

**Acceptance Criteria**
- Employee can create an open shift posting with date, time, role/team, and location.
- New postings are visible in the open-shift list immediately after submission.
- Posted shifts default to **Open** status.
- Only eligible users (employee/manager roles) can create or view postings per role permissions.

### 2. Open Shift Claiming
As an employee, I want to browse and claim open shifts, so that uncovered shifts can be filled quickly.

**Acceptance Criteria**
- Employees can view a list of open shifts with key details (date, time, team/role).
- Employee can claim an open shift that is still available.
- Claiming changes the shift status to **Pending Approval**.
- Original poster and manager are associated to the pending claim for follow-up and approval.

### 3. Claim Cancellation Before Approval
As a claiming employee, I want to cancel my claim before manager approval, so that I am not locked into a shift if my availability changes.

**Acceptance Criteria**
- Claimer can cancel only while status is **Pending Approval**.
- Cancellation returns the shift to **Open** status.
- Cancellation is disallowed once a manager has approved or denied.
- Cancellation action is logged with actor and timestamp.

### 4. Manager Approval Workflow
As a manager, I want to approve or deny claimed shifts, so that swaps are controlled and policy-compliant before becoming final.

**Acceptance Criteria**
- Managers can see all claims awaiting decision in one place.
- Manager can approve or deny each pending claim.
- No shift swap is finalized unless manager approves.
- Decision updates shift status and records actor/timestamp.

### 5. Status Visibility
As an employee or manager, I want to see current shift-swap status, so that everyone knows what action is pending or complete.

**Acceptance Criteria**
- System shows clear lifecycle states: **Open**, **Pending Approval**, **Approved**, **Denied**.
- Employees can view status of shifts they posted or claimed.
- Managers can view status across team-related shifts.
- Status changes are visible promptly after actions.

### 6. Audit Trail
As an HR stakeholder, I want a complete action history for each shift swap, so that payroll and compliance audits are supported.

**Acceptance Criteria**
- Audit log captures posting, claim, cancellation, approval, and denial events.
- Each event includes actor identity, action type, and timestamp.
- Audit history can be retrieved by shift and date range.
- Audit records are retained for at least the trailing 90 days.

### 7. 90-Day CSV Export
As an HR stakeholder, I want to export swap history to CSV for the trailing 90 days, so that I can support audits and reporting.

**Acceptance Criteria**
- User can export shift-swap records as CSV.
- Export supports a default filter for trailing 90 days.
- Export includes core audit fields (shift, actor, action, timestamp, status).
- Export output is downloadable and readable in standard spreadsheet tools.

### 8. Overtime Risk Flag
As a manager, I want to see when a potential swap may push an employee over 40 hours in a week, so that I can make informed approval decisions.

**Acceptance Criteria**
- During review, manager sees a non-blocking overtime risk indicator.
- Indicator is based on weekly scheduled/worked hours plus the claimed shift.
- Overtime warning does not automatically prevent approve/deny actions.
- Overtime flag presence is captured in the approval context for traceability.

### 9. Simple Employee-ID Login
As a user, I want to log in with employee ID (without enterprise SSO), so that access is quick for the first release.

**Acceptance Criteria**
- Users can authenticate using employee ID flow defined for v1.
- Session grants role-appropriate access (employee vs manager).
- SSO/federated login is not required for v1 operation.
- Login is usable in the target internal environment.

### 10. Notifications for Shift Activity
As an employee, I want to receive timely notifications about open shifts and claim/approval updates, so that I do not miss shift changes.

**Acceptance Criteria**
- New open shifts trigger notifications to relevant users.
- Claim/approval status changes trigger notifications to impacted users.
- SMS is supported for v1 baseline notifications.
- Notification events are logged for supportability.

### 11. Unclaimed Shift Escalation
As a manager, I want an alert when a shift remains unclaimed near start time, so that I can intervene manually before coverage fails.

**Acceptance Criteria**
- System checks whether an open shift remains unclaimed near shift start.
- Default escalation trigger is 4 hours before shift start.
- Escalation sends a manager alert for manual intervention.
- Alert event is captured in the audit/notification record.

## Conflicts & Open Questions

1. **Source file naming mismatch:** Request references `/Un-structured/02-unstructured-inputs-pack.md`, but repository contains `Un-structured/unstructured-inputs-pack.md`. Confirm if a second source file exists.
2. **Notification channel priority:** Inputs mention push, email, SMS, and app notifications; later discussion prioritizes SMS for v1 but does not fully resolve whether email remains in scope for v1.
3. **Eligibility rules for claiming shifts:** Inputs say "anyone on the team can claim it" but do not define qualification logic (same role, certification, location constraints).
4. **Manager acting on behalf of employees:** Sticky note raises this capability, but later discussions do not confirm inclusion/exclusion.
5. **Overtime flag data source:** Team agrees to non-blocking overtime flag, but source of hour totals (scheduled vs worked, and integration assumptions) is not fully specified.
6. **Escalation policy details:** Default "4 hours before shift start" is proposed, but no confirmation on whether threshold is configurable by team/site.

## Deferred / Out of Scope

- **Slack integration for shift posts/notifications** — explicitly deprioritized to later phase (Sticky Notes: "later??"; Slack thread, 9:31 AM and 9:32 AM; Requirements Session end discussion).
- **Direct payroll integration/sync in first release** — explicitly deferred due to risk (Email #2 item 4; Slack thread, 9:14 AM and 9:32 AM; Kickoff transcript).
- **Enterprise SSO / advanced identity federation for v1** — intentionally excluded in favor of simple employee-ID login (Sticky Notes; Slack thread, 9:33 AM; Requirements Session login discussion).
- **Push notifications as core MVP channel** — treated as secondary/bonus vs SMS-first for v1 (Requirements Session, notifications discussion; Slack thread, 9:30 AM).
