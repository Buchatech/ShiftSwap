# ShiftSwap MVP Scope (Sprint 1)

## In Scope (MVP)
1. Employee ability to post a shift they need covered.
2. Employee ability to view open shifts and request to pick one up.
3. Manager approval/denial workflow before any swap is finalized.
4. Basic status visibility for employees and managers (e.g., Open, Pending Approval, Approved, Denied).
5. Minimal audit trail of who posted, requested, and approved/denied each shift action.
6. Core web app usability for internal desktop/mobile browser access.

## Out of Scope (v1)
1. **Third-party scheduling/payroll integrations** (e.g., UKG, ADP, Workday): deferred to avoid external dependency risk and keep Sprint 1 focused on validating core workflow behavior first.
2. **Enterprise SSO and advanced identity federation** (e.g., SAML/OIDC with full org IAM): deferred because integration and security hardening effort is high relative to MVP validation needs.
3. **Automated payroll rule calculations and compliance automation** (overtime, premiums, jurisdiction-specific labor logic): deferred due to policy complexity and testing overhead that could jeopardize 2-week delivery.
4. **Native iOS/Android apps**: deferred to reduce platform scope and deliver faster through a single responsive web experience.

## Sprint 1 Goal
Deliver a usable internal MVP that enables frontline employees to post and claim shift coverage requests, while ensuring manager approval is the required control point before swaps are finalized.
