# Claude Monitor for VS Code

Real-time Claude Code session monitoring directly in VS Code.

## Features

- **Status Bar Monitor**: Display model, context usage percentage, and git status in VS Code's status bar
- **Sidebar Panel**: Detailed session information with context usage, git status, and session metrics
- **Multiple Presets**: Choose from Minimal, Essential (recommended), or Full configurations
- **Zero Config**: Works out of the box with sensible defaults
- **Graceful Degradation**: Continues to work if Claude Code extension becomes temporarily unavailable

## Quick Start

1. Install from VS Code Marketplace (coming soon)
2. Open VS Code with Claude Code extension active
3. Claude Monitor status bar appears in the bottom right
4. Click status bar to open sidebar panel
5. Customize via VS Code Settings > Claude Monitor

## Configuration

### Presets

| Preset | Status Bar | Sidebar | Updates |
|--------|-----------|---------|---------|
| **Minimal** | Line 1 only | Core sections | On demand |
| **Essential** | Lines 1-2 | All sections | On demand |
| **Full** | Lines 1-3 | All sections | Real-time (300ms) |

### Custom Settings

Edit VS Code `settings.json`:

```json
{
  "claudeMonitorVsCode.preset": "essential",
  "claudeMonitorVsCode.statusBarPosition": "right",
  "claudeMonitorVsCode.refreshInterval": 300
}
```

## Troubleshooting

**Status bar shows "Not Connected"**
- Ensure Claude Code extension is installed and active
- Reload VS Code (Cmd+Shift+P > "Reload Window")

**Sidebar not updating**
- Click refresh button in sidebar
- Check "Sidebar Refresh Mode" setting

## Requirements

- VS Code 1.80 or newer
- Claude Code extension

## License

MIT