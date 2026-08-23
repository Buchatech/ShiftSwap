# Scope: ShiftSwap Sprint 1 MVP

## Sprint Goal (Sprint 1)
Deliver a usable MVP that enables hourly employees to post and claim shift coverage requests, with manager approval as the final control before a swap is confirmed.

## In Scope (MVP)
- Employee can post a shift they need covered.
- Coworker can view open shifts and request to pick one up.
- Manager can approve or reject a requested shift pickup before final confirmation.
- System displays clear status for each request (open, pending approval, approved, rejected).
- Basic web interface suitable for a small internal pilot.

## Out of Scope (v1)
- **Third-party scheduling/payroll integrations** (e.g., ADP, UKG, Workday): deferred to avoid external dependency complexity and protect Sprint 1 delivery speed.
- **Single Sign-On (SSO) and advanced identity federation**: deferred because enterprise auth setup and security reviews can consume disproportionate effort for a 2-week MVP.
- **Automated payroll impact processing** (hours, overtime, premium rules): deferred due to policy complexity and compliance risk; MVP will focus only on swap workflow validation.
- **Native mobile apps and push notifications**: deferred to keep implementation focused on one web channel and reduce QA surface area.
- **Complex rule engine for union/site-specific exceptions**: deferred until pilot feedback confirms which rules provide highest operational value.
