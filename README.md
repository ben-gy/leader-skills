# Leader Skills

A small static site for exploring how well-documented leaders actually operate — the concrete patterns, rituals, and mental models behind their work — and then building your own leadership operating system from them.

Live: https://leader-skills.benrichardson.dev

## What's here

- **20 leader profiles** — Bezos, Musk, Huang, Jobs, Perkins, Nooyi, Blakely, Barra, Sandberg and more — each broken into specific practices.
- **Seven life and operating domains** — Mind, Body, Routine, Team, Vision, Communication, Culture — so practices can be compared apples-to-apples.
- **The Builder** — pick a starting template (or start blank), borrow practices from any leader, write your own, and export the result as a printable one-pager (via the browser's print → save as PDF) or as a JSON file you can re-import later.

The "what" each leader does is interesting; the **why** is the point. Every practice tries to explain the underlying reasoning.

## How it's built

No build step, no framework, no backend.

- `index.html` — SPA shell
- `app.js` — orchestrator (vanilla ES module)
- `lib/avatar.js` — SVG monogram avatars (copyright-free)
- `lib/store.js` — localStorage wrapper for the Builder
- `lib/router.js` — hash-based routing
- `styles.css` — main styles, dark/light auto
- `print.css` — print styles for the Builder one-pager
- `data/leaders.json` — all leader profiles & practices
- `data/templates.json` — Builder starting templates
- `CNAME` — GitHub Pages custom domain
- `.nojekyll` — disables Jekyll processing so `lib/` is served as-is

## Run locally

Any static file server works. From the repo root:

```sh
python3 -m http.server 8000
# or:
npx serve
```

Then visit http://localhost:8000.

## Adding a leader

1. Open `data/leaders.json`.
2. Copy an existing leader entry and edit the fields:
   - `id` — kebab-case (e.g. `nadella`)
   - `avatar.monogram` and `avatar.color` (any hex)
   - `practices[]` — categorise each one as `mind` / `body` / `routine` / `team` / `vision` / `communication` / `culture`
3. Cite a public source for each practice (`source` and optional `sourceUrl`).
4. Commit. No build step.

## Sources

Every practice cites a public source. The leader bios and quotes are drawn from interviews, books, shareholder letters, and reputable journalism (Fortune, CNBC, Wharton, BCG, Lex Fridman, Lenny's Newsletter, etc.). Anything ambiguously attributed has been left out.

## license

[GNU Affero General Public License v3.0 or later](./LICENSE), with an attribution
requirement added under section 7(b) — see
[ADDITIONAL-TERMS.md](./ADDITIONAL-TERMS.md).

In short: you may run, modify, redistribute and even sell this, but if you
distribute it — or run a modified version where other people can reach it — you
have to publish your source under the same licence and keep the attribution. A
separate commercial licence without those obligations is available on request:
<hi@ben.gy>.

Third-party components keep their own licences — see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
