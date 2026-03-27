---
author: Claude
created: 2026-03-27
status: approved
---

# Active Tab Session Tracking

## Problem

The "Current session" card in the sidebar doesn't update when the user switches between Claude Code editor tabs. It always shows either the user-pinned session (from clicking a card) or `rawSessions[0]` (most recently modified JSONL), with no awareness of which Claude Code tab is actually focused.

## Goal

When the user switches to a Claude Code editor tab, the "Current session" card (and status bar data) should update to reflect the session open in that tab.

## Approach: Tab label → aiTitle matching

On every `onDidChangeTabs` event, inspect the active tab. If it's a Claude Code webview panel (`TabInputWebview` with `viewType === 'claudeVSCodePanel'`), extract its label and find the matching session by comparing against `aiTitle` values in `findAllProjectSessions()`. If a match is found, update both the sidebar and data integration pins to that session.

## Design

### New function: `resolveActiveTabSession()` in `extension.ts`

```
1. Get: vscode.window.tabGroups.activeTabGroup.activeTab
2. Guard: if not TabInputWebview with viewType 'claudeVSCodePanel', return null
3. Get tab.label
4. Call findAllProjectSessions()
5. Find session where:
   - session.aiTitle and tab label are non-empty, AND
   - aiTitle.toLowerCase() is a substring of label.toLowerCase(), OR
   - label.toLowerCase() is a substring of aiTitle.toLowerCase()
6. Return matched sessionId, or null
```

### Updated `onDidChangeTabs` handler

Replace current handler (which only clears cache and refreshes) with:

```typescript
vscode.window.tabGroups.onDidChangeTabs(() => {
    const sessionId = resolveActiveTabSession();
    if (sessionId) {
        sidebarProvider.setPinnedSessionId(sessionId);
        dataIntegration.pinSession(sessionId);
    }
    dataIntegration.clearCache();
    updateStatus();
});
```

### Data flow

```
User focuses Claude Code tab
  → onDidChangeTabs fires
  → resolveActiveTabSession() reads tab.label
  → substring match against session aiTitles
  → sets pinnedSessionId on SidebarProvider + DataIntegration
  → updateStatus() refreshes sidebar + status bar
  → "Current session" card reflects the focused tab
```

## Edge cases

| Scenario | Behavior |
|---|---|
| Non-CC tab focused (file editor, terminal) | `resolveActiveTabSession` returns null; pin unchanged; sidebar keeps current pin |
| Tab label doesn't match any session aiTitle | Returns null; falls back to mtime-based `rawSessions[0]` |
| Session is "Untitled session" (no aiTitle yet) | No label match possible; falls back to mtime default — this is correct since the active session is also the most recently written JSONL |
| User clicks a card while focused on a different tab | Pin updates as before via `resumeSession` handler |
| Multiple sessions with similar titles | First substring match wins (sessions sorted by current-project-first, then mtime desc — most likely the right one) |

## Scope

- **Only file changed:** `src/extension.ts`
- No new files, no new classes, no changes to `sidebar.ts`, `statusBar.ts`, or `dataIntegration.ts`
- The existing `pinnedSessionId` mechanism on both `SidebarProvider` and `DataIntegration` is reused as-is

## Out of scope

- Handling sessions with no aiTitle via any mechanism other than mtime fallback
- Persisting the active tab session across VS Code restarts
- Detecting which session is active when the sidebar itself is focused (not a Claude Code editor tab)
