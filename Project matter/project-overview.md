# Demo Project: ShiftSwap

## One-sentence pitch
A small web app that lets hourly employees post a shift they need covered and pick up open shifts from coworkers, with manager approval before the swap is final.

## Why this project works for the course
- Small enough to fully scope in one sitting.
- Has natural scope-creep bait (SMS, payroll integration, Slack notifications) so your charter/scope demo has real decisions to make on camera.
- Has at least three stakeholders with slightly conflicting priorities (Ops Manager wants speed and simplicity, HR wants compliance and audit trail, Devs want to avoid overtime/payroll complexity) — this is what makes the "unstructured inputs → requirements" demo interesting instead of trivial.
- Fits a 2-week sprint cadence with an obvious MVP cut line.

## Cast of characters (used consistently across all the fake inputs)
- **Maria Chen** — Operations Manager, the main requester, somewhat informal, prone to scope creep.
- **David Okafor** — HR Director, formal, cares about compliance, payroll accuracy, audit trail.
- **You / "Steve"** — Product/Project lead running the GenAI-assisted planning.
- **Priya Nair** — Dev Lead, pragmatic, pushes back on complexity.
- **Jordan Lee** — Frontline employee rep, raises the "not everyone has a smartphone/laptop" reality.

## Agile framing
- Run this as a lightweight Scrum/Kanban hybrid: a single Product Backlog in GitHub Projects, a 2-week Sprint 1 focused on MVP, everything else pushed to a "Later" column.
- Sprint Goal for Sprint 1 (you'll have GenAI help draft this in Demo 1): *"Employees can post and claim open shifts; managers can approve or deny them."*
- Explicitly out of scope for v1 (this is intentional — it's what your demos will surface and resolve): SMS notifications, payroll/overtime integration, Slack integration.

## How the two demos use this project
- **Demo 1 (Charter & Scope)** uses just the project pitch + a short discovery conversation to get GenAI to draft a Project Charter and a Scope statement (in/out of scope, MVP definition, Sprint Goal).
- **Demo 2 (Unstructured → Requirements)** uses the full inputs pack (sticky notes, emails, Slack thread, meeting transcripts) to get GenAI to extract, de-duplicate, and structure requirements into user stories with acceptance criteria — then convert those into GitHub Issues on a Project board.
