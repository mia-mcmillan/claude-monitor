# Claude Monitor for VS Code

Real-time Claude Code session monitoring directly in VS Code. No API key required — reads directly from Claude Code's local session files.

## Features

- **Status Bar** — model name, context %, session duration, tool count, agent count — colour coded
- **Session Breakdown** — click the status bar to see all sessions from the last 24h across all projects
- **Sidebar Panel** — fixed current session card, collapsible All Sessions (grouped by project), Active Agents, and Tool Calls sections
- **Click to Switch** — click any session card to open it directly in a Claude Code editor tab
- **Sub-agent Tracking** — detects and counts sub-agents spawned during Claude Code sessions
- **Multi-model Context** — automatically uses 1M token limit for Opus models, 200K for others
- **Zero Config** — reads from `~/.claude/projects/` session files, no API key needed
- **Works with Claude Teams** — uses your existing Claude Code subscription

## How It Works

Claude Monitor reads the JSONL session files that Claude Code writes to `~/.claude/projects/`. It scans all sessions modified within the last 24h and extracts token usage, model name, tool calls, sub-agents, and session titles directly from those files.

## Quick Start

1. Install the `.vsix` from the [releases page](https://github.com/mia-mcmillan/claude-monitor/releases)
2. Open VS Code with Claude Code active in a project
3. The status bar appears bottom-right showing your current session
4. Click the status bar to open the session breakdown quick pick
5. Click the Claude Monitor icon in the activity bar to open the sidebar panel

## Status Bar

```
🚀 Sonnet 4.6  🟢 6%    📁 MiaOS  ⎇ main    Session: 2h  |  Tools: 14  |  Agents: 0
```

| Section | Colour | Meaning |
|---------|--------|---------|
| Model + context % | Peach | Model name and context usage |
| Project + branch | Yellow | Current workspace and git branch |
| Session stats | Green | Duration, tool calls, sub-agents |

Context emoji: 🟢 below 50%, 🟡 50–80%, 🔴 above 80%.

## Sidebar Panel

**Current session** (fixed at top)
- Session card: project, title, context bar, model, token count
- Stat cards: duration, tools used, active agents
- Total tokens across all sessions in the last 24h

**All sessions** — grouped by project, cards for every session active in the last 24h. Click any card to open it in a Claude Code editor tab.

**Active agents** — sub-agents detected in the current session, with start time and ID

**Tool calls** — last 20 tool calls with name, namespace, inputs, and status

## Configuration

```json
{
  "claude-monitor.refreshInterval": 5000,
  "claude-monitor.statusBarPosition": "right"
}
```

| Setting | Default | Options |
|---------|---------|---------|
| `claude-monitor.refreshInterval` | `5000` | milliseconds (min 1000) |
| `claude-monitor.statusBarPosition` | `right` | `left`, `right` |
| `claude-monitor.sidebarRefreshMode` | `automatic` | `automatic`, `manual` |

## Troubleshooting

**Status bar shows no data**
- Make sure Claude Code has been used at least once — it needs a session file in `~/.claude/projects/`
- Reload VS Code (`Cmd+Shift+P` → `Developer: Reload Window`)

**Session not showing in All Sessions**
- Sessions older than 24h are hidden
- Check the session has been active recently

**Agents always showing 0**
- Sub-agents are only created during multi-agent Claude Code tasks. Single-agent sessions always show 0.

**Click to switch not working**
- Make sure Claude Code extension is installed and active

## Development

```bash
git clone https://github.com/mia-mcmillan/claude-monitor
cd claude-monitor
npm install
npm run deploy     # compile + copy to installed extension
```

Then `Cmd+Shift+P` → `Developer: Reload Window`.

```bash
npm run package    # build .vsix
```

## Requirements

- VS Code 1.80 or newer
- Claude Code extension

## License

MIT
