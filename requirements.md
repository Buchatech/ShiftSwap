# ShiftSwap Requirements (V1)

## User Stories & Acceptance Criteria

### 1) Shift Posting
**User Story:** As an employee, I want to post a shift I cannot work, so that qualified teammates can cover it.

**Acceptance Criteria:**
- A logged-in employee can create an open-shift request with shift date, time, and role/location details.
- Open shifts are visible to eligible team members in a shared list.
- The posting employee can see current status (open, claimed, approved, cancelled).
- If no one has claimed the shift yet, the posting employee can cancel the request.

### 2) Shift Claiming
**User Story:** As an employee, I want to claim an open shift, so that I can take available extra work.

**Acceptance Criteria:**
- Eligible employees can claim an open shift that is not already approved.
- The system records who claimed the shift and when.
- Once claimed, the shift status changes to pending manager approval.
- The original poster and manager are notified that a claim was made.

### 3) Claim Cancellation (Before Approval)
**User Story:** As an employee who claimed a shift, I want to un-claim it before approval, so that I am not locked into a shift when plans change.

**Acceptance Criteria:**
- A claimer can cancel their claim only while status is pending manager approval.
- After manager approval, the claim can no longer be cancelled by the employee in-app.
- On cancellation, the shift returns to open status.
- The posting employee and manager receive cancellation notification.

### 4) Manager Approval Workflow
**User Story:** As a manager, I want to approve or reject shift swaps before they are final, so that staffing changes remain controlled.

**Acceptance Criteria:**
- No swap is finalized without explicit manager approval.
- Managers can approve or reject each claimed shift.
- Approval and rejection actions are timestamped and attributed to the acting manager.
- Employees involved are notified of the decision.

### 5) Unclaimed Shift Escalation
**User Story:** As a manager, I want to be alerted when a shift remains unclaimed, so that I can intervene before coverage fails.

**Acceptance Criteria:**
- If a shift is still unclaimed 4 hours before shift start, the assigned manager receives an alert.
- The default escalation threshold is 4 hours before start time.
- The escalation alert includes shift details and current status.
- Escalation is logged in the audit trail.

### 6) Notifications (SMS-First)
**User Story:** As a shift participant, I want reliable notifications through channels I actually use, so that I do not miss swap actions.

**Acceptance Criteria:**
- V1 sends SMS notifications for key events: new open shift, claim made, approval/rejection, and claim cancellation.
- Notification delivery does not require a smartphone app.
- Push notifications may be implemented only if time allows and are not required for MVP completion.
- Notification channel used for each event is recorded for troubleshooting/audit.

### 7) Simple Internal Login
**User Story:** As an employee, I want to sign in with my employee ID, so that access is fast and simple.

**Acceptance Criteria:**
- Users can authenticate using employee ID for V1.
- SSO is not required for V1.
- Access is limited to authorized internal users.
- User identity is associated with all actions they perform in the system.

### 8) Audit Trail & Shift History
**User Story:** As an HR director, I want a complete audit trail of swap activity, so that payroll and compliance audits can be satisfied.

**Acceptance Criteria:**
- The system logs who posted, claimed, approved/rejected, cancelled, and escalated each swap.
- Each logged action includes a timestamp.
- Managers can view swap history for at least the trailing 90 days.
- Audit data supports reconstruction of who actually worked each affected shift.

### 9) CSV Export (Trailing 90 Days)
**User Story:** As an HR director, I want to export swap history to CSV, so that I can support payroll audits and reporting.

**Acceptance Criteria:**
- Authorized users can export swap records as CSV.
- Export includes at least the trailing 90 days of swap history.
- Export data includes core audit fields (actor, action, timestamp, shift reference, approval outcome).
- Export operation is auditable (who exported and when).

### 10) Overtime Risk Flag
**User Story:** As a manager, I want to see when a swap may push someone over 40 hours per week, so that I can make informed approval decisions.

**Acceptance Criteria:**
- During review, the system flags swaps that may push the claimer above 40 hours/week.
- The flag does not automatically block approval in V1.
- Overtime risk visibility is included in manager review context.
- Overtime-flag events are retained in audit/history records.

### 11) Manager Visibility Dashboard
**User Story:** As a manager, I want to see all swap requests in one place, so that I can quickly manage approvals and coverage risk.

**Acceptance Criteria:**
- Managers can view open, claimed/pending, approved, rejected, and escalated swaps in one interface.
- Each item shows current status, key timestamps, and responsible users.
- Managers can filter or scan items requiring immediate action (for example, pending approvals or unclaimed escalations).
- The view includes enough detail to act without opening external tools.

## Conflicts & Open Questions

1. **Notification channel scope is partially unresolved.** Inputs align on SMS priority for V1, but push notification appears as an optional add-on if time permits; exact MVP boundary should be confirmed.  
   **Sources:** Email #1 ("push/text/email, whatever works"), Slack thread 9:30 AM, Requirements Session (SMS required; push as bonus).

2. **"Anyone on the team can claim" vs. "qualified can claim."** Some inputs say anyone on the team; others imply qualification constraints. Eligibility rules are not defined.  
   **Sources:** Email #1 ("anyone on the team can claim"), Email #1 problem framing ("anyone qualified can grab it"), Kickoff transcript.

3. **Manager acting on behalf of employees is unconfirmed.** A sticky note asks whether managers can swap for employees, but no later source resolves it for V1.  
   **Sources:** Sticky notes ("Can a manager swap shifts on behalf of an employee?"), no explicit decision in Slack or meetings.

4. **What happens after post-approval change requests is unclear.** Claim cancellation before approval is agreed, but behavior after approval (reversal/correction flow) is not specified.  
   **Sources:** Requirements Session (cancel allowed before approval, not after), no defined post-approval exception process.

## Deferred / Out of Scope

- **Slack integration** — explicitly deferred to later phases.  
  **Source:** Sticky notes ("later??"), Slack thread 9:31 AM and 9:32 AM, Requirements Session ("later, not v1").

- **Payroll system integration/sync** — explicitly excluded from first release.  
  **Source:** Email #2 requirement #4, Kickoff transcript (standalone first), Slack thread 9:32 AM.

- **Automatic overtime blocking logic** — not required in V1; only manager-visible flagging is in scope.  
  **Source:** Email #2 requirement #5, Slack thread 9:18 AM and 9:19 AM, Requirements Session (flag only).
