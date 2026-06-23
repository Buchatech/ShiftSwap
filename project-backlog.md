# ShiftSwap Project Backlog (Sprint 1 MVP)

## Sprint Goal
Employees can post and claim open shifts, and managers can approve or deny swap requests before finalization.

## Product Backlog (Prioritized)
| Priority | Backlog Item | Type | Description | Acceptance Highlights |
|---|---|---|---|---|
| P1 | Employee login (Employee ID) | User Story | As an employee, I can log in with my employee ID so I can access ShiftSwap quickly. | User can sign in/out; session is role-aware (employee/manager). |
| P1 | Post shift for coverage | User Story | As an employee, I can post a shift I cannot cover so others can claim it. | Shift details saved; status set to Open; visible in open-shift list. |
| P1 | Browse and claim open shifts | User Story | As an employee, I can view available shifts and claim one. | Open shifts list is filterable by date/team; claim sets status to Pending Approval. |
| P1 | Cancel claim before approval | User Story | As a claimer, I can cancel my claim before manager approval. | Cancellation returns shift to Open; action is logged with timestamp. |
| P1 | Manager approve/deny workflow | User Story | As a manager, I can approve or deny claimed shifts before they become final. | Approve sets status to Approved; deny sets status to Denied/Open per policy; decisions are timestamped. |
| P1 | Status visibility for all parties | User Story | As an employee or manager, I can see current swap status. | Status lifecycle visible: Open, Pending Approval, Approved, Denied. |
| P1 | Audit trail logging | Compliance | As HR/Ops, I need an audit trail of posting, claim, cancellation, and approval actions. | Records include actor + action + timestamp for each event. |
| P1 | 90-day CSV export | Compliance | As HR, I can export swap history for trailing 90 days. | CSV export includes required audit fields and date filter. |
| P2 | Overtime risk flag (non-blocking) | User Story | As a manager, I can see if an approved swap may exceed 40 hours/week. | Flag appears in approval view; does not block decision. |
| P2 | Unclaimed shift escalation alert | User Story | As a manager, I get alerted when a shift remains unclaimed near start time. | Default alert when still Open 4 hours before shift start. |
| P2 | Notification baseline (web/app status updates) | Technical Story | As a user, I receive core status-change notifications in-app/web. | Post/claim/approval events generate visible notifications. |

## Deferred Backlog (Out of Scope for v1)
| Item | Why Deferred |
|---|---|
| Third-party scheduling/payroll integrations | High integration risk and validation overhead in a 2-week MVP window. |
| Enterprise SSO (SAML/OIDC) | Security and identity integration complexity is disproportionate for Sprint 1. |
| Native iOS/Android apps | Web-first delivery is faster and sufficient for MVP validation. |

