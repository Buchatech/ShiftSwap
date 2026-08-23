# ShiftSwap — Unstructured Inputs Pack

Use these as the raw, messy "before" material for Demo 2. They're intentionally inconsistent, repetitive, and missing structure — that's the point. Some ideas conflict (on purpose), some are duplicated in different words, and a few are clearly out of scope. A good requirements-extraction prompt should catch all of that.

---

## 1. Sticky Notes (from a kickoff brainstorm session)

> Pretend these were photographed off a whiteboard. Keep them as a raw, unordered list when feeding them to GenAI — don't clean them up first.

- "Need approval before a swap goes live"
- "What about night shift folks who don't check email?"
- "Send a text reminder when someone claims your shift"
- "Manager should see all swaps in one place"
- "Some employees still use flip phones!! Can't assume everyone has the app"
- "Watch out for overtime if someone picks up too many shifts"
- "HR needs a record of who actually worked what shift"
- "Has to work on mobile, most floor staff don't have a laptop"
- "Keep login simple — just use employee ID, no fancy SSO"
- "Slack integration would be cool" (circled, with "later??" written next to it)
- "What happens if nobody claims the open shift?"
- "Can a manager swap shifts on behalf of an employee?"
- "Need to see swap history for the last 90 days"

---

## 2. Email #1

**From:** Maria Chen (Operations Manager)
**To:** Steve (Project Lead)
**Subject:** shift coverage app - quick thoughts before our call

Hey Steve,

Excited to get this moving! Quick brain dump before we talk Thursday.

Biggest pain point right now: when someone can't make a shift, they text 5 people individually and hope someone responds. I want one place where they post "I need this shift covered" and anyone qualified can grab it.

A few things I'd love:
- Employee posts an open shift, anyone on the team can claim it
- I (or another manager) get to approve before it's official — I don't want people just swapping without me knowing
- Some kind of notification so people actually see new open shifts. Push notification, text, email, whatever works
- Bonus: could this eventually sync with our Slack channel so shifts post there too?
- Would also be amazing if it auto-flagged when someone's about to go into overtime, but I know that's probably a phase 2 thing

Also — not everyone on my team is glued to their phone for apps. A few of our older staff use basic phones. Just flagging that in case it changes how we build this.

Let's talk Thursday,
Maria

---

## 3. Email #2

**From:** David Okafor (HR Director)
**To:** Steve (Project Lead), Maria Chen
**Subject:** RE: shift coverage app - HR requirements

Steve, Maria,

Thanks for looping me in. From an HR/compliance standpoint, a few non-negotiables before this goes anywhere near production:

1. We need a complete audit trail of every shift swap — who posted it, who claimed it, who approved it, and timestamps for each step. This will get pulled during payroll audits.
2. No swap should be considered final without manager approval. I know Maria mentioned this too, just confirming it's a hard requirement, not a nice-to-have.
3. We need to be able to export swap history (CSV is fine) for at least the trailing 90 days.
4. Please do NOT connect this directly to payroll systems in the first release. I want to see how it performs before we talk about that integration — too much risk of paying people incorrectly if there's a bug.
5. One more thing: legally we need to track if a swap pushes someone over 40 hours/week, even if we're not blocking it automatically yet. Just flag it for manager review.

Happy to jump on a call if useful, otherwise this should be enough to get started.

David

---

## 4. Slack Thread (#shiftswap-planning)

**Maria Chen** 9:14 AM
ok so I talked to David, he's got some HR musts — audit trail, 90 day export, no payroll integration yet

**Priya Nair** 9:16 AM
yeah saw his email. the audit trail stuff is easy, it's basically just logging. export to CSV also not bad

**Steve** 9:17 AM
what about the overtime flagging he mentioned

**Priya Nair** 9:18 AM
that one's more work bc we'd need shift totals per week per employee. doable but let's not boil the ocean for v1

**Maria Chen** 9:19 AM
fine by me, as long as it's flagged for manager review somehow, even manually for now

**Jordan Lee** 9:24 AM
can we talk about the phone thing? like genuinely half the warehouse crew does not have smartphones. if this is app-only we're going to have a problem

**Steve** 9:25 AM
noted — what do people currently use to communicate shift stuff?

**Jordan Lee** 9:26 AM
texting mostly, some people don't even have data plans, just calls/texts

**Priya Nair** 9:30 AM
ok so SMS notifications might actually be more important than push notifications for v1. that's kind of a flip from what I assumed

**Maria Chen** 9:31 AM
agreed, can we deprioritize the Slack integration idea then? that was kind of a nice to have anyway

**Steve** 9:32 AM
yeah I think Slack + payroll sync both move to "later", SMS notification + approval workflow + audit trail are the real v1

**Priya Nair** 9:33 AM
+1. login should be dead simple too, just employee ID, no need for SSO for an internal tool this small

**Maria Chen** 9:40 AM
one more thing — what if literally nobody claims an open shift? do we need an escalation, like notify the manager directly after X hours?

**Steve** 9:41 AM
good catch, let's bring that up in the requirements meeting Thursday

---

## 5. Meeting Transcript — Kickoff Meeting (Zoom)

**ShiftSwap Kickoff — Tuesday 10:00 AM**
*Attendees: Steve (Project Lead), Maria Chen (Ops), David Okafor (HR), Priya Nair (Dev Lead)*

**Steve:** Thanks everyone for making time. Let's just go around — Maria, can you frame the problem for us?

**Maria:** Sure. Right now when someone can't work a shift, it's all word of mouth — group texts, asking around in person. Stuff falls through the cracks and sometimes shifts just go uncovered. I want a simple system where people post the shift, someone else claims it, and I sign off.

**David:** And from my side, whatever gets built needs to be auditable. We get payroll audits twice a year and I need to be able to show exactly who worked what and who approved any changes.

**Priya:** Makes sense. Is this a brand new system or does it need to talk to anything we already have? Timeclock system, payroll, anything like that?

**David:** Not yet. I'd actually prefer we keep it standalone for the first release. Once we trust it, we can talk about syncing with payroll.

**Maria:** Agreed, keep it simple for now.

**Steve:** Okay. Rough timeline — I'd like to get an MVP defined this week, and have something workable in about two sprints, so four weeks-ish.

**Priya:** That's tight but doable if we keep scope tight. What's actually in the MVP versus nice-to-have?

**Steve:** That's what I want to nail down in our follow-up. For now, can everyone send me your top priorities before Thursday's session?

**Maria:** Will do.

**David:** Sounds good, I'll send something today actually.

**Steve:** Perfect, thanks all.

---

## 6. Meeting Transcript — Requirements & Scoping Session (Teams)

**ShiftSwap Requirements Session — Thursday 2:00 PM**
*Attendees: Steve, Maria Chen, Priya Nair, Jordan Lee*

**Steve:** Okay, based on the emails, the sticky notes from kickoff, and the Slack thread, I want to nail down what's actually in v1. Let's start with the core flow.

**Priya:** Core flow as I understand it: employee posts an open shift, another employee claims it, manager approves, and then it's official. Did I miss anything?

**Maria:** That's the heart of it, yeah.

**Jordan:** What if I claim a shift and then change my mind?

**Steve:** Good question — should there be a way to un-claim before manager approval?

**Maria:** Yeah I think so, otherwise people will be stuck if their plans change again.

**Priya:** Okay, we'll add that — claimer can cancel before approval, but not after.

**Steve:** Next — notifications. Jordan, you raised the phone issue.

**Jordan:** Right, a lot of the floor staff don't have the app or even smartphones. Texting is really the only reliable channel.

**Priya:** So SMS for new open shifts and approval status, push notification as a bonus if we have time, but don't build the MVP around push.

**Maria:** Agreed.

**Steve:** What about the unclaimed shift scenario — if nobody picks it up?

**Maria:** I'd like the manager to get notified after some number of hours, so they can handle it manually — call someone, whatever.

**Steve:** Let's say 4 hours before the shift starts as a default, manager gets an alert if it's still unclaimed.

**Priya:** That's reasonable to build.

**Steve:** Login — David wasn't able to join today but his email said employee ID only, no SSO, for v1.

**Priya:** Fine by me, that's actually simpler to build anyway.

**Steve:** Audit trail and export — also from David's email, that's a hard requirement: every action timestamped, exportable as CSV for the trailing 90 days.

**Maria:** Yes, and don't forget the overtime flag — doesn't need to block anything, just needs to show up for the manager to review if a swap would put someone over 40 hours.

**Priya:** We can compute that based on existing shift data, should be manageable.

**Steve:** Last thing — Slack integration and payroll sync. Sounds like both are explicitly "later," not v1?

**Maria:** Correct, later.

**Steve:** Great, I think that's enough to draft requirements. I'll have something to review by tomorrow.
