# Project Charter: ShiftSwap MVP (Sprint 1)

## Project Purpose
Deliver a simple web app MVP that helps hourly employees request shift coverage and pick up available shifts, with manager approval required before any swap is finalized. The goal is to reduce manual coordination, improve schedule coverage, and provide a transparent approval workflow.

## Objectives
1. Enable employees to post a shift they need covered.
2. Enable employees to view and claim open shifts from coworkers.
3. Provide managers with an approval step to accept or reject requested swaps.
4. Maintain basic visibility of swap status (open, pending approval, approved, rejected).
5. Deliver an MVP that can be demoed and evaluated at the end of a single 2-week Sprint 1.

## Stakeholders & Roles
| Stakeholder | Role in Project |
| --- | --- |
| Operations Manager | Product owner proxy; defines operational needs and approves MVP fit for scheduling workflow. |
| HR Director | Policy/governance stakeholder; validates compliance with labor and HR rules. |
| Dev Lead | Technical lead; owns solution design, implementation quality, and sprint delivery. |
| Frontline Employees | Primary end users; provide usability feedback and validate real-world workflow. |

## Success Criteria
1. Employees can create an open shift request and coworkers can claim it.
2. A manager can approve or reject each claimed shift before it becomes final.
3. End-to-end swap flow works reliably for core happy paths in MVP demo.
4. Stakeholders agree MVP meets Sprint 1 acceptance expectations for pilot readiness.

## High-Level Timeline
| Week | Focus |
| --- | --- |
| Week 1 (Sprint Days 1-5) | Finalize MVP scope and UX flow, implement core posting/claiming features, begin manager approval workflow. |
| Week 2 (Sprint Days 6-10) | Complete approval workflow, polish core experience, fix critical defects, run stakeholder demo and sprint review. |

## Assumptions & Constraints
- Single sprint (2 weeks) with a strict MVP scope; non-core features are out of scope for Sprint 1.
- Manager approval is mandatory before any shift swap is finalized.
- Initial release targets web app usage for a small pilot group.
- Existing scheduling/payroll integrations are assumed out of scope for Sprint 1 unless trivial.
- Team capacity and stakeholder availability are sufficient for rapid feedback within the sprint.
