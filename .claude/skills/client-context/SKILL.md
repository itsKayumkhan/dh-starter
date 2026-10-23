---
name: client-context
description: Turn client chat (Fiverr base-chat file at project root, plus later Fiverr/WhatsApp messages) into a reliable, versioned project knowledge base under docs/project/. Extracts requirements, business rules, decisions, deadlines, scope and pending items, then diffs them against the existing context to detect NEW / CHANGED / CONFLICT / REJECTED / SUPERSEDED items. Use when the user pastes client messages or says "client chat", "yeh chat padho", "update project context", "client ne kya bola", "chat se context banao", "add this to project context", "what changed since last chat", or shares meeting notes that must become project memory. Works on every project and stack.
---

# Client Chat to Project Context

This is **not** a chat summarizer. The output is a living project memory that a developer, designer, PM, or another AI can trust as the source of truth for future work.

Every run must answer: what is the project, what is confirmed right now, what rules must be followed, what changed, what was rejected, what is still pending, what the deadlines are, and why decisions were made.

## Ground rules (never break these)

1. **Never silently overwrite a decision.** The old value moves to `decisions.md` and `change-log.md`; it is never deleted.
2. **Never silently resolve a conflict.** If the messages do not clearly resolve it, flag `CONFLICT / NEEDS CONFIRMATION`.
3. **Never invent** dates, years, budgets, features, technical details, or deadlines.
4. **Never store secrets in the documentation.** No passwords, API keys, tokens, private keys, OTPs, 2FA codes, session cookies, card numbers, recovery codes in any file under `docs/`. Those files record only that access is required and where to obtain it. Every credential found in the chat is written to `.env` at the project root instead, see **Credential handling**.
5. **Never promote an assumption, suggestion, or question to CONFIRMED** without explicit evidence.
6. **A developer suggestion is not client approval.** A client question is not a client decision. A client promise ("I will send feedback in 48 hours") is a PENDING item, not a confirmed requirement.
7. **The main context file describes the CURRENT state only.** No two contradictory active statements. History lives in `decisions.md` / `change-log.md`.
8. Rejected requirements leave the active requirements list. Superseded decisions stop being active rules.
9. If nothing meaningful changed, say so: `No material project changes detected.` Do not manufacture changes from reworded text.

---

## Inputs

There are two kinds of input. Handle both, never confuse them.

### 1. Base chat (a file, never pasted)

The original client conversation lives as a **file at the project root**. The user will not paste it.

On every run, locate it before anything else. Scan the project root (and one level down) for a chat-looking file: `.md`, `.txt`, `.pdf`, `.docx`, `.html`, `.json`, `.csv`, with names containing `chat`, `conversation`, `messages`, `client`, `brief`, `fiverr`, `inbox`, the client's username, or an obvious export name. A single PDF at the root of an otherwise empty project is the base chat. Read it fully (use the `pdf` / `docx` skills for those formats).

- The base chat is normally a **Fiverr** conversation. It is the origin of the project.
- **The user re-exports it.** The "Digital Heroes x <client>" export is regenerated and dropped in again (same name overwritten, or a new file next to the old one) every time the conversation grows. A re-export is the normal way new Fiverr messages arrive, not an edge case.
- **Change detection is by hash, not memory.** `docs/project/.ingest-state.json` stores the file name, SHA-256, size and last ingested message timestamp. Every run: hash the file(s) and compare. Same hash = nothing new from the base chat. Different hash or a new export file = read it and ingest **only messages after `last_message`**. Never skip this check because "it was ingested before".
- After ingesting, rewrite `.ingest-state.json` and the Base Chat block in `sources.md` (size, SHA-256, last message).
- If no base chat file is found, say so plainly and continue with whatever was supplied. Do not guess its contents.

**Image-only PDFs.** The Fiverr export is printed with "Microsoft Print to PDF", which has **no text layer**: `pdftotext` and `pypdf` return empty strings, and the Read tool cannot render pages without poppler. Do not conclude the file is empty. Render pages with PyMuPDF (one-time setup: `pip install pymupdf`; if Python or PyMuPDF is missing, tell the user that exact command instead of guessing the content) and read the PNGs:

```bash
python -c "import fitz,sys;d=fitz.open(sys.argv[1]);[p.get_pixmap(dpi=110).save(f'{sys.argv[2]}/page{i+1}.png') for i,p in enumerate(d)]" chat.pdf <scratchpad>
```

**Export layout (Digital Heroes Fiverr export).** Skip the leading `DEFAULT PROJECT RULES` box (agency boilerplate, not client input) and the seller's sales-pitch messages (Top Rated, YouTube, portfolio). The trailing `REQUIREMENTS / ORDER UPDATES` block is buyer input: ingest it. Fiverr strips prices from the export (for example "I was hoping to stay under ."), so never reconstruct an amount: write `amount not visible in export`.

### 2. Incremental messages (pasted)

Later changes arrive after the base chat, usually via **WhatsApp** or as fresh **Fiverr** messages, and are pasted into the conversation. These contain changes that are **not** in the base chat, so they almost always win over it on any overlap.

Fiverr pastes look like this:

```
C
client_username

15 Sept, 12:15
Morning, I should have all the feedback over in 48 hours. I have received the attached email from hostinger.

All the best


Screenshot_20260915-074305.png

(220.82 kB)
```

Parse it as: avatar initial line (ignore) -> **sender username** -> blank -> **date, time** -> message body (may be multiple paragraphs).

Noise to skip: greetings and sign-offs like "All the best".

Trailing attachment lines (a filename followed by a file size in parentheses) are **not** noise: record the filename, size, date, and the context the client gave it, in the `sources.md` Attachments Referenced table, and in `project-context.md` under Attachments Referenced when it matters for the work. The actual image or file is never stored, copied, or opened here, that is separate work. The name is context, the file is not. Never guess what is inside it.

WhatsApp pastes use the usual `[15/09/26, 10:23 pm] Name:` or `15/09/2026, 22:23 - Name:` forms. Parse sender, timestamp, body the same way.

If a paste has no sender names at all (a screenshot of a chat, a forwarded block), see **Speaker attribution** below.

### Reference links

**Every URL the client sends is kept.** Never drop one. Capture the URL, the date, and what the client said it was for.

This covers the client's own website, design references and inspiration sites, competitor sites, Figma, Drive, Loom, docs, dashboards, hosting panels, social profiles, and anything else linked.

- All of them are logged in the `sources.md` Reference Links table.
- Any link that carries meaning for the work also goes into `project-context.md` under **Reference Links**, grouped by what it is for (client website, design reference, competitor, asset source, tool). A design inspiration link additionally belongs under Design Requirements.
- Keep the URL exactly as sent. Do not shorten it, do not clean tracking parameters, do not follow it unless the task actually needs the page.

---

## Credential handling

Credentials are never lost and never documented. They go to `.env`.

When the chat contains a password, API key, token, hosting login, FTP/SSH detail,
database credential, SMTP password, licence key, or any other secret:

In a dh-starter project, `.env` and `.env.example` already hold the app's own keys: append client credentials under a `# --- client access (from chat) ---` section at the end of both files, never between app or module keys. Reading `.env` asks the user for permission (team setting); that is expected.

1. **Write it to `.env` at the project root.** Use a clear uppercase key named after the
   service, for example `HOSTINGER_EMAIL`, `HOSTINGER_PASSWORD`, `WP_ADMIN_PASSWORD`,
   `QUOTE_API_KEY`, `GOOGLE_MAPS_API_KEY`. Group the keys by service with a comment
   line giving the service, its login URL, and the date and channel it arrived on.
   Never overwrite an existing value silently: if the value changed, keep the old one
   on a commented line above with its date, then set the new one.
2. **Create `.env.example`** alongside it with the same keys and empty values, plus keys
   for credentials that are still pending. That file is safe to commit.
3. **Create or update `.gitignore`** so it contains `.env`, `.env.*`, `!.env.example`,
   and the base chat file. Do this before anything is committed.
4. **Redact the secret in the base chat file**, replacing the value with
   `[REDACTED - stored in .env as <KEY>]`. The surrounding context, the username and the
   message stay intact so chronology and attribution still work.
5. **In `docs/`, record only the pointer.** In `pending-items.md` under Pending Access
   write `Access required: <service>. Credential location: .env (<KEY>). Received <date>.`
   Never the value itself, not even partially, not even masked.
6. **Report it in the Chat Analysis** under a `Credentials Received` line naming the
   service and the `.env` key only, plus a note if it should be rotated because it was
   sent over chat.

A credential sent over chat should normally be rotated, and a sub-account requested in
place of an owner login. Flag that in `docs/PRODUCTION_CHECKLIST.md`.

Never print a credential value back into the conversation, a commit message, a client
message, or any generated report.

## Speaker attribution

Before extracting anything, identify who is who.

1. Read the participant names from `docs/project/sources.md` if it already records them (for example client Fiverr username `client_username`, plus the team member as the seller/developer side).
2. Otherwise infer them from the base chat and record them in `sources.md` on this run.
3. Every extracted item carries which side said it. The whole source-of-truth priority depends on this.
4. **If attribution is unclear, the item is `ASSUMPTION`, never `CONFIRMED`.** No exceptions, including unattributed screenshots and forwarded blocks.

---

## Source-of-truth priority

When information conflicts, resolve in this order:

1. Latest explicit client confirmation
2. Latest explicit project/team decision
3. Earlier confirmed client decision
4. Existing project documentation
5. Developer/team assumption
6. Unconfirmed suggestion or speculation

Channel does not decide priority; **recency and explicitness do**. A WhatsApp message from the client outranks an older Fiverr message, and vice versa. If two messages conflict and their order cannot be established, that is a `CONFLICT`.

If the latest message is ambiguous, it does not become a confirmed rule.

---

## Chronology rules (read before flagging any conflict)

- Process all messages of a batch **in chronological order**, oldest first, carrying a running state.
- **A later explicit message in the same batch is a CHANGE, not a conflict.** If the client says Stripe at 10:15 and PayPal at 16:40 on the same day, the result is: PayPal CONFIRMED, Stripe SUPERSEDED, one `change-log.md` entry. Do not flag CONFLICT.
- A conflict is only real when: order is unknown, or both statements are equally recent and explicit, or a later message contradicts an existing confirmed decision **without acknowledging it** and the intent is genuinely unclear.
- When the base chat and an incremental message disagree, the incremental message wins (it is later by definition). Record it as CHANGED with the base chat value as previous.
- A large base chat is processed in chronological chunks. Earlier chunks build the state, later chunks amend it. Only the final state is written to `project-context.md`.

## Date and deadline rules

- Resolve a date only against a known message timestamp. Show the derivation once: `"in 48 hours" from 15 Sept 12:15 -> 17 Sept 12:15`.
- Fiverr timestamps like `15 Sept, 12:15` carry no year. Take the year from the base chat's own dates or from today's date when that is unambiguous. If it is genuinely ambiguous, write `year not confirmed` and move on.
- If a relative date cannot be resolved, write it exactly as said: `Deadline: Friday - exact date not confirmed.`
- Never invent a deadline, and never harden a soft promise into a commitment. "I should have feedback over in 48 hours" is `PENDING`, expected 17 Sept, not a confirmed milestone.

## Idempotency

Re-pasting the same or overlapping messages must not duplicate anything.

- `docs/project/sources.md` records every ingested batch: date processed, channel, sender, first and last message timestamp, message count.
- Before writing, drop any message already covered by a recorded batch.
- Before appending to `change-log.md`, check that the same change is not already logged. A repeat confirmation of an existing decision is not a new change, it is evidence; at most update the source date on the existing entry.

---

## Status vocabulary

Tag every meaningful item with exactly one:

`CONFIRMED` `NEW` `CHANGED` `PENDING` `REJECTED` `SUPERSEDED` `ASSUMPTION` `CONFLICT`

Calibration on the polite client English that shows up in Fiverr and WhatsApp:

| Message                                                                               | Status                                                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "Yes, please add Apple Pay." / "Go ahead with it." / "Approved."                      | CONFIRMED                                                                   |
| "Maybe we can add Apple Pay." / "We were thinking about..." / "Would be nice to have" | PENDING                                                                     |
| "Can you do X?" / "Is X possible?"                                                    | QUESTION, not a decision. Answer it, do not record it as a requirement      |
| "I should have all the feedback over in 48 hours."                                    | PENDING (client-side commitment, with derived date)                         |
| "Let me check with my partner and come back."                                         | PENDING, blocked on client                                                  |
| "Remove Apple Pay." / "Drop that page."                                               | REJECTED / REMOVED                                                          |
| "I don't love the green." (no replacement given)                                      | REJECTED for the current option, and a PENDING decision on what replaces it |
| Developer or team member proposing an approach                                        | ASSUMPTION until the client confirms                                        |

---

## Run order

1. **Read existing context** in `docs/project/` (then `project/`). If absent, this is the first run: copy the templates from `templates/` next to this skill and create the folder.
2. **Read `sources.md`** to learn participants and what has already been ingested.
3. **Locate the base chat file and hash it** against `docs/project/.ingest-state.json`, per **Inputs**. First run ingests it fully; a changed hash or a new export file means ingest the messages after `last_message`; same hash means skip it.
4. **Parse the pasted incremental messages**, if any.
5. **Order everything chronologically** and drop already-ingested messages.
6. **Extract** using the checklist below, tagging each item with sender and status.
7. **Diff** against the existing context: NEW / CHANGED / CONFLICT / CONFIRMED / REJECTED / SUPERSEDED / PENDING.
8. **Emit the Chat Analysis report in chat first**, before touching files.
9. **Update files** in this order: `project-context.md` (bump `Last updated` and `Last chat message ingested`) -> `project-rules.md` -> `requirements.md` -> `decisions.md` -> prepend to `change-log.md` -> `pending-items.md` -> `sources.md` -> `.ingest-state.json`.
10. **Feed the other global rules:** anything that must change before go-live (test keys, sandbox configs, placeholder content, temporary hosting) also gets an entry in `docs/PRODUCTION_CHECKLIST.md` in the same commit.
11. **Re-check for contradictions.** No unresolved contradiction may remain that a later explicit client message already settled.
12. Run the quality check, then commit (stage and commit, never push). If the project is not a git repo yet, `git init` first (branch `main`) so the context has history.

## Keeping the context fresh (the files are useless if they go stale)

A one-time run is not the job. The context must track the project until handover. Three things keep it current:

1. **Hooks fire the skill, not the user's memory.** `.claude/hooks/client-context-check.mjs` (Node, wired in the repo's `.claude/settings.json`, so every team member gets it) runs on three events. If a team member already has the older global Python hook in `~/.claude/settings.json`, the repo hook stays silent so nothing fires twice:
   - `Stop`: in a git repo with `docs/project/`, if work files changed (uncommitted, or committed since the last `docs/project/` commit) and `docs/project/` was not touched, it blocks once and asks for the update. Do the small update (Current Status, change-log, pending-items), no chat re-read. If the change has no project-level meaning, say so in one line; it will not ask again for the same change.
   - `SessionStart`: if the base chat hash differs from `.ingest-state.json`, or there is a chat file but no `docs/project/`, it tells Claude to run this skill before anything else.
   - `UserPromptSubmit`: if the prompt looks like pasted Fiverr / WhatsApp messages (timestamp lines), it tells Claude to run this skill on them, even without trigger words.
     When either hook fires, invoke this skill first. Do not answer the pasted chat informally and skip the files.
2. **Work updates the context too, not only chat.** Whenever work in any session changes project state, update the affected files in the same commit, without being asked:
   - a pending asset or access arrives (logo, text, photos, hosting login) -> remove from `pending-items.md`, note it in `change-log.md`
   - a feature is built, delivered, or the client approves / rejects it -> `project-context.md` Current Status + `change-log.md`
   - a deadline, delivery date, or revision round is agreed -> Timeline
   - the user tells you something about the client verbally ("client ne bola...") -> treat it as a pasted message, attributed to the user, status per the vocabulary
3. **Read before you work.** At the start of any task in a project that has `docs/project/`, read `project-context.md` and `pending-items.md` first, and if `Last updated` is older than the newest chat file or message you were given, refresh before building.

## What to extract

Only information that can affect future project work.

- **Project:** name, client/company, business type, target market, target countries, target users, objective, current phase.
- **Functional:** features, user flows, roles, permissions, admin functionality, dashboards, catalog, search/filter/sort, checkout, auth, notifications, reports, integrations, automation, APIs, data requirements.
- **Business rules:** pricing logic, currency, markup, commission, discounts, taxes, shipping, eligibility, product rules, order rules, account rules, region/country rules, subscription rules.
- **Technical:** frontend, backend, database, hosting, APIs, auth, payment provider, third-party services, environments, browser/device support, performance, security.
- **Design:** references, approved direction, colors, typography, layout, components, responsive/mobile behavior, client likes, client dislikes, explicitly rejected designs.
- **Content:** copy, images, video, product data, documents, languages, translations, SEO.
- **Timeline:** deadlines, milestones, launch/delivery/review dates, dependencies, waiting periods.
- **Client preferences:** communication, review and approval process, design and development preferences, things the client repeats.
- **Scope:** in scope, out of scope, future scope, optional, explicitly rejected features.
- **Commercial terms:** budget, milestones, payment terms, extras, revisions included. Record only what is explicitly stated. Never estimate or infer an amount.
- **Pending:** questions, missing assets, missing access, missing credentials, pending approval, pending decision, external dependencies.

---

## Chat Analysis report (emit before writing files)

```markdown
# Chat Analysis

## Sources Read

## Summary

## New Information

## Changed Information

## Conflicts

## Confirmed Decisions

## Rejected / Superseded Items

## Pending Items

## Important Deadlines

## Links & Attachments Received

## Impact on Existing Project

## Questions To Ask The Client

## Files Updated
```

`Sources Read` names the base chat file and every batch ingested this run, so the user can see nothing was missed and nothing was double counted.

`Questions To Ask The Client` is a short numbered list covering every `CONFLICT` and every blocking `PENDING` item, written so it can be sent as-is. Offer to turn it into a message via the `msg` skill.

Change entries always carry previous value, new value, status, and impact:

```markdown
### Currency Changed

- Previous: USD only
- New: USD + CAD
- Status: CHANGED
- Source: Client, WhatsApp, 15 Sept 12:15
- Impact: Pricing, checkout, product display, payment handling.
```

Conflict entries never pick a winner on their own:

```markdown
## Conflict Detected

- Existing decision: Stripe (base chat, 2 Sept)
- New proposal/decision: PayPal (WhatsApp, 15 Sept, no mention of Stripe)
- Status: CONFLICT
- Action: Verify whether PayPal is intended to replace Stripe.
```

Scope changes always capture all six fields: feature, previous scope, new scope, reason, impact, status.

## Files to maintain

```
.env                      # every credential found in the chat, gitignored
.env.example              # same keys, empty values, safe to commit
.gitignore                # must ignore .env and the base chat file
docs/project/
├── project-context.md    # current state, the primary source of truth
├── project-rules.md      # rules future work must follow
├── requirements.md       # confirmed requirements by priority and area
├── decisions.md          # decisions with history and reasons
├── change-log.md         # newest first, every meaningful change
├── pending-items.md      # unresolved work and dependencies
└── sources.md            # participants, base chat file, ingestion log
```

Templates for all seven live in `templates/` next to this file. Copy them on first run.

If the environment only allows one Markdown file, merge everything into `project-context.md`, preserving the same section names.

## Evidence and deduplication

- Keep a short source reference on important items: `Source: Client, Fiverr, 15 Sept 12:15`.
- Do not paste large chat excerpts. Quote a short line only when exact wording prevents ambiguity.
- Deduplicate: same meaning in different words, repeated confirmations, repeated answered questions, and multiple messages about one feature all collapse to the clearest confirmed version.
- Do not duplicate the same requirement across many sections.

## Do not

Summarize every message. Store greetings or sign-offs. Store, copy, or open the actual image and attachment files, only their names and context belong here. Guess what is inside an attachment. Re-ingest the base chat. Treat guesses as requirements. Treat questions as decisions. Treat developer suggestions as client approval. Treat a same-batch change as a conflict. Delete historical decisions. Silently resolve conflicts. Invent dates, years, or amounts. Put a credential in any `docs/` file. Commit `.env`. Leave rejected items active. Leave superseded decisions as current rules.

## Quality check before finishing

- [ ] Base chat located, hash compared with `.ingest-state.json`, only new messages ingested (or its absence stated)
- [ ] `.ingest-state.json` and `Last updated` / `Last chat message ingested` bumped
- [ ] Every item attributed to a sender; unattributed ones marked ASSUMPTION
- [ ] Messages processed in chronological order; same-batch changes not flagged as conflicts
- [ ] All important client requirements extracted
- [ ] Current confirmed state is unambiguous
- [ ] New items marked; changed items carry previous and new values
- [ ] Real conflicts flagged, not silently resolved
- [ ] Rejected and superseded items removed from active lists
- [ ] Important decisions preserved with reasons
- [ ] Pending items tracked with who or what they wait on
- [ ] Every link the client sent is recorded with its purpose, URL kept exactly as sent
- [ ] Attachment names and sizes recorded with their context; no actual image or file stored
- [ ] Dates derived from real timestamps; nothing invented
- [ ] No credentials in any `docs/` file; every one found is in `.env`, with `.env` and the base chat gitignored and the chat redacted
- [ ] Change log appended, newest first, no duplicate entries
- [ ] `sources.md` updated with this batch
- [ ] Go-live blockers added to `docs/PRODUCTION_CHECKLIST.md`
- [ ] No hidden contradiction remains
- [ ] Files still concise and readable

The goal is not the longest documentation. It is a reliable living project memory that gets more accurate with every message analyzed.
