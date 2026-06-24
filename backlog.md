# ShiftSwap Project Backlog

## Sprint 1 Goal
Employees can post and claim open shifts, and managers can approve or reject swaps before finalization.

## Sprint 1 Backlog (MVP)
| ID | User Story | Priority | Notes / Acceptance Focus |
| --- | --- | --- | --- |
| PB-01 | As an employee, I can post a shift I need covered so teammates can pick it up. | Must | Capture shift details and show as **Open**. |
| PB-02 | As an employee, I can view open shifts so I can choose one to cover. | Must | Open shifts list is visible and filterable by basic fields (date/time/team). |
| PB-03 | As an employee, I can claim an open shift so I can take responsibility for it. | Must | Claimed shift moves to **Pending Approval**. |
| PB-04 | As a manager, I can approve or reject claimed shifts so swaps are controlled. | Must | Approval is required before final status becomes **Approved**. |
| PB-05 | As a user, I can see swap status so I know where each request stands. | Must | Statuses: **Open**, **Pending Approval**, **Approved**, **Rejected**. |
| PB-06 | As a manager, I can see a queue of pending approvals so I can act quickly. | Should | Pending items are grouped in one manager view. |
| PB-07 | As a manager/HR stakeholder, I can review basic swap history so actions are traceable. | Should | Include who posted, who claimed, and who approved/rejected with timestamps. |
| PB-08 | As the product team, we can run an MVP demo of the end-to-end happy path. | Must | Demo covers post → claim → manager decision flow. |

## Post-MVP Backlog (Out of Scope for Sprint 1)
| ID | Item | Why Deferred |
| --- | --- | --- |
| PB-L1 | Third-party scheduling/payroll integrations (e.g., ADP/UKG/Workday) | External dependencies and integration risk are too high for a 2-week MVP. |
| PB-L2 | SSO / enterprise identity federation | Security, provisioning, and IT coordination effort would consume Sprint 1 capacity. |
| PB-L3 | Automated payroll/overtime processing | Compliance-sensitive logic needs deeper policy validation beyond MVP timeline. |
| PB-L4 | Native mobile apps and push notifications | Web-first pilot is sufficient for MVP learning with lower build/test overhead. |
| PB-L5 | Advanced rule engine for site/union exceptions | Requires policy discovery and validation after initial pilot feedback. |
