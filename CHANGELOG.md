# Changelog

## [0.2.1] — 2026-03-27

### Fixed
- **Active tab session tracking** — the "Current session" card now updates automatically when switching between Claude Code editor tabs. Matches the tab label against session titles; falls back to most-recently-modified session for untitled sessions.
- **Session card hover flicker** — cards no longer flicker on hover during background refresh cycles. Hover state is restored synchronously after each re-render.
- **Click-to-switch** — opening a session from the sidebar now works reliably on first click.
- **Deploy script** — version path now reads from `package.json` dynamically instead of being hardcoded.

### Changed
- `npm run package` now auto-bumps the patch version before building the `.vsix`.
- Session cards use `mousedown` instead of `click` to handle first-click focus acquisition in the webview.

---

## [0.2.0] — 2026-03-26

### Added
- **Sidebar panel** — fixed "Current session" card at top with context bar, model pill, token stats, duration, tool count, and agent count.
- **All sessions** — collapsible section grouping all sessions active in the last 24h by project.
- **Active agents** — collapsible section showing sub-agents with start time and truncated ID.
- **Tool calls** — collapsible section showing last 20 tool calls with name, namespace, key inputs, and status.
- **Click to open session** — click any session card to open it directly in a Claude Code editor tab.
- **Session pinning** — clicking a card pins it as the current session in the status bar data as well.
- **Agent tracking** — detects sub-agents via `isSidechain` + `agentId` fields in JSONL.
- **24h session window** — sessions older than 24h are hidden from all views.
- **Session grouping by project** — all sessions view groups cards under their project name.
- **Quick pick improvements** — session breakdown shows context bar, model, token count, and age.

### Changed
- Status bar now shows current workspace project name and git branch.
- Sessions sorted: current workspace first (by mtime), then other projects (by mtime).

---

## [0.1.0] — initial release

- Status bar showing model, context %, session duration, tool count.
- Real JSONL parsing from `~/.claude/projects/`.
- Webview sidebar panel (basic).
- Zero config, no API key required.
