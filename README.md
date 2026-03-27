# Claude Monitor for VS Code

Real-time Claude Code session monitoring directly in VS Code.

## Features

- **Status Bar** — model name, context %, project, git branch, session duration, tool count, agent count
- **Sidebar Panel** — fixed current session card with context bar, collapsible all sessions, active agents, and tool calls sections
- **Session Breakdown** — click status bar to see all active sessions (last 8h) with context bars and token counts
- **Sub-agent Tracking** — detects and displays active sub-agents from Claude Code sessions
- **1M Context Support** — automatically uses correct context limit per model (Opus = 1M, others = 200K)
- **Auto-refresh** — updates every 5 seconds by default, configurable
- **Zero Config** — reads directly from `~/.claude/` session files, no API key needed
- **Works with Claude Teams** — no separate Anthropic API billing required

## How It Works

Claude Monitor reads the JSONL session files that Claude Code writes to `~/.claude/projects/`. It picks the most recently active session and extracts token usage, model name, tool calls, sub-agents, and session titles directly from those files.

## Quick Start

1. Install the `.vsix` from the [releases page](https://github.com/mia-mcmillan/claude-monitor/releases)
2. Open VS Code with Claude Code active in a project
3. The status bar appears bottom-right showing your current session
4. Click the status bar to see a breakdown of all active sessions
5. Open the sidebar via the activity bar icon

## Status Bar

Three colour-coded items on the right:

```
🚀 Sonnet 4.6  🟢 6%     MiaOS  main     Session: 2h  |  Tools: 14  |  Agents: 0
```

| Colour | Content |
|--------|---------|
| Peach `#F5B482` | Model name + context % |
| Yellow `#EBDC82` | Project name + git branch |
| Green `#82D796` | Session duration, tool count, agent count |

Context indicator changes colour automatically:

| Indicator | Meaning |
|-----------|---------|
| 🟢 | Below 50% |
| 🟡 | 50–80% |
| 🔴 | Above 80% |

## Sidebar

The sidebar has a fixed **Current Session** section at the top showing:
- Session title, project, age, model, context bar, context % and token count
- Duration, tools used, active agents
- Total tokens across all sessions in the last 8h

Below that, scrollable collapsible sections:
- **All Sessions** — cards for every session active in the last 8h
- **Active Agents** — sub-agents detected in the current session
- **Tool Calls** — last 20 tool calls with inputs and status

## Configuration

Edit VS Code `settings.json`:

```json
{
  "claude-monitor.refreshInterval": 5000
}
```

### Settings Reference

| Setting | Default | Options |
|---------|---------|---------|
| `claude-monitor.refreshInterval` | `5000` | milliseconds (min 1000) |
| `claude-monitor.statusBarPosition` | `right` | `left`, `right` |
| `claude-monitor.sidebarRefreshMode` | `automatic` | `automatic`, `manual` |

## Troubleshooting

**Status bar shows no data**
- Make sure Claude Code has been used at least once in a project — needs a session file in `~/.claude/projects/`
- Reload VS Code (`Cmd+Shift+P` → `Developer: Reload Window`)

**Sidebar not updating**
- Run `Cmd+Shift+P` → `Refresh Claude Monitor`
- Check `claude-monitor.refreshInterval` isn't set too high

**Wrong session showing**
- Claude Monitor always picks the most recently modified session file across all projects

**Agents always shows 0**
- Agent tracking requires Claude Code sessions that use sub-agents (multi-agent tasks). Single-agent sessions will always show 0.

## Development

```bash
git clone https://github.com/mia-mcmillan/claude-monitor
cd claude-monitor
npm install
npm run deploy     # compile + copy to installed extension
```

Then `Cmd+Shift+P` → `Developer: Reload Window` to pick up changes.

To package a new `.vsix`:
```bash
npm run package
```

## Requirements

- VS Code 1.80 or newer
- Claude Code extension (generates the session files this extension reads)

## License

MIT
