# Claude Monitor for VS Code

Real-time Claude Code session monitoring directly in VS Code.

## Features

- **Status Bar** — shows model name, context usage percentage, and git branch at a glance
- **Sidebar Panel** — detailed view with context window bar, token counts, session duration, tool calls, and git status
- **Auto-refresh** — updates every 5 seconds by default, configurable
- **Zero Config** — reads directly from `~/.claude/` session files, no API key needed
- **Works with Claude Teams** — no separate Anthropic API billing required

## How It Works

Claude Monitor reads the JSONL session files that Claude Code writes to `~/.claude/projects/`. It picks the most recently active session and extracts token usage, model name, tool calls, and timestamps directly from those files.

## Quick Start

1. Install the `.vsix` from the [releases page](https://github.com/miamcmillan/claude-monitor/releases)
2. Open VS Code with Claude Code active in a project
3. The status bar appears bottom-right showing your current session
4. Click the status bar item to open the sidebar panel

## Status Bar

```
claude-haiku-4-5-20251001 | 🟡 52%   Session 2h | Tools: 14 | Agents: 0
```

| Indicator | Meaning |
|-----------|---------|
| 🟢 | Context usage below 50% |
| 🟡 | Context usage 50–80% |
| 🔴 | Context usage above 80% |

## Configuration

Edit VS Code `settings.json`:

```json
{
  "claude-monitor.preset": "standard",
  "claude-monitor.statusBarPosition": "right",
  "claude-monitor.refreshInterval": 5000
}
```

### Settings Reference

| Setting | Default | Options |
|---------|---------|---------|
| `claude-monitor.preset` | `standard` | `minimal`, `standard`, `detailed` |
| `claude-monitor.statusBarPosition` | `right` | `left`, `right` |
| `claude-monitor.refreshInterval` | `5000` | milliseconds (min 1000) |
| `claude-monitor.statusBarLines` | `1` | `1`–`5` |
| `claude-monitor.sidebarRefreshMode` | `automatic` | `automatic`, `manual` |

## Troubleshooting

**Status bar shows no data**
- Make sure Claude Code has been used at least once in a project (needs a session file in `~/.claude/projects/`)
- Reload VS Code (`Cmd+Shift+P` → `Developer: Reload Window`)

**Sidebar not updating**
- Run `Cmd+Shift+P` → `Refresh Claude Monitor`
- Check `claude-monitor.refreshInterval` isn't set too high

**Wrong session showing**
- Claude Monitor always picks the most recently modified session file across all projects

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
