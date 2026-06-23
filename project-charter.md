# Project Charter: ShiftSwap MVP (Sprint 1)

## Project Purpose
ShiftSwap will provide a lightweight web app for hourly employees to post shifts they cannot cover and claim open shifts from coworkers, with manager approval required before any swap is finalized. The MVP focuses on reducing last-minute staffing gaps and replacing ad hoc text/email coordination with a clear, auditable workflow.

## Objectives
1. Deliver a usable MVP in one 2-week sprint for shift posting, claiming, and manager approval.
2. Enable employees to quickly publish "needs coverage" requests and browse available open shifts.
3. Provide managers a simple approve/deny flow with status tracking visible to employees.
4. Capture a basic audit trail of request, claim, and approval decisions for operations and HR visibility.

## Stakeholders & Roles
| Stakeholder | Role in Project |
|---|---|
| Operations Manager | Product owner proxy; defines shift workflow and acceptance priorities. |
| HR Director | Policy/governance stakeholder; validates compliance with scheduling and fairness expectations. |
| Dev Lead | Technical owner; leads architecture, implementation, and sprint delivery. |
| Frontline Employees | Primary end users; provide usability feedback and validate workflow fit. |

## Success Criteria
1. Employees can post a shift for coverage, view open shifts, and submit a pickup request.
2. Managers can approve or deny pickup requests, and final status is visible to all relevant users.
3. At least one end-to-end swap scenario is completed in UAT without manual back-channel coordination.
4. Sprint 1 MVP is demo-ready by sprint end with no Sev-1 defects in the core workflow.

## High-Level Timeline
| Timebox (Sprint 1) | Focus |
|---|---|
| Days 1-2 | Finalize MVP scope, user stories, acceptance criteria, and UX wireflow. |
| Days 3-8 | Build core flows: authentication (basic), shift posting/listing, claim submission, manager approval. |
| Days 9-10 | UAT, defect fixes, final demo prep, and go/no-go recommendation for pilot rollout. |

## Assumptions & Constraints
- Single sprint duration is fixed at 2 weeks; scope is constrained to MVP functionality only.
- Manager approval is mandatory before a swap is considered final.
- Initial release targets web browsers (desktop/mobile responsive), not native mobile apps.
- Integration with external scheduling/payroll systems is out of scope for Sprint 1.
- Team capacity and stakeholder availability are sufficient for rapid feedback during the sprint.
