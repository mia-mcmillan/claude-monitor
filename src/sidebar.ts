import * as vscode from 'vscode';
import { msToTime } from './utils';
import { SessionData } from './types';
import { findAllProjectSessions, formatModelId } from './statusBar';

export class SidebarProvider implements vscode.WebviewViewProvider {
    static readonly viewType = 'claudeMonitor.sidebar';
    private view?: vscode.WebviewView;
    private sessionData?: SessionData;

    constructor(private readonly context: vscode.ExtensionContext) {}

    async resolveWebviewView(webviewView: vscode.WebviewView) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        };
        webviewView.webview.html = this.getHtmlContent();
        webviewView.onDidChangeVisibility(() => { if (webviewView.visible) this.updateView(); });
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === 'getSidebarData') this.updateView();
            if (message.command === 'resumeSession') {
                vscode.commands.executeCommand('claude-vscode.editor.open', message.sessionId, undefined, vscode.ViewColumn.Active);
            }
        });
    }

    async updateView() {
        if (!this.view) return;
        const s = this.sessionData;
        const contextUsed = s?.contextUsed || 0;
        const contextLimit = s?.contextLimit || 200000;
        const pct = Math.round((contextUsed / contextLimit) * 100);
        const rawSessions = findAllProjectSessions();
        const currentSession = rawSessions[0];
        const totalTokensAll = rawSessions.reduce((sum: number, sess: any) => sum + (sess.totalTokens || 0), 0);
        const allSessions = rawSessions.map((sess: any) => ({
            model: formatModelId(sess.model),
            title: sess.aiTitle || 'Untitled session',
            project: sess.projectName.replace(/^-Users-[^-]+-Projects-/, 'Projects/').replace(/^-Users-[^-]+-/, '~/').replace(/-/g, '/'),
            pct: sess.contextPct,
            tokens: (sess.totalTokens || 0).toLocaleString(),
            entrypoint: sess.entrypoint || 'claude-vscode',
            sessionId: sess.sessionId,
            projectName: sess.projectName,
            age: (() => {
                const sec = Math.floor((Date.now() - sess.mtime) / 1000);
                if (sec < 60) return 'just now';
                if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
                if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
                return `${Math.floor(sec / 86400)}d ago`;
            })(),
        }));
        this.view.webview.postMessage({
            type: 'updateSidebar',
            data: {
                model: formatModelId(s?.model || 'Unknown'),
                contextUsed, contextLimit, pct,
                duration: msToTime(Date.now() - (s?.sessionStartTime || Date.now())),
                isActive: s?.isActive || false,
                tools: s?.tools || [],
                totalTokensAll,
                currentTitle: currentSession?.aiTitle || 'Untitled session',
                currentProject: currentSession ? currentSession.projectName.replace(/^-Users-[^-]+-Projects-/, 'Projects/').replace(/^-Users-[^-]+-/, '~/').replace(/-/g, '/') : '',
                currentAge: currentSession ? (() => { const sec = Math.floor((Date.now() - currentSession.mtime) / 1000); if (sec < 60) return 'just now'; if (sec < 3600) return `${Math.floor(sec / 60)}m ago`; if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`; return `${Math.floor(sec / 86400)}d ago`; })() : '',
                allSessions,
                agents: s?.agents || [],
            },
        });
    }

    setSessionData(data: SessionData) { this.sessionData = data; }
    dispose() { this.view = undefined; }

    getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--vscode-editor-font-family,monospace);font-size:12px;background:var(--vscode-sideBar-background);color:var(--vscode-sideBar-foreground);display:flex;flex-direction:column;height:100vh;overflow:hidden}
  .fixed-top{flex-shrink:0;border-bottom:1px solid var(--vscode-sideBarSectionHeader-border)}
  .main-scroll{flex:1;overflow-y:auto;min-height:0}
  .model-pill{font-size:10px;padding:1px 6px;border-radius:3px;background:#F5B48240;color:#F5B482;margin-left:auto;border:1px solid #F5B48260}
  .ctx-card{border:1px solid var(--vscode-widget-border,#333);border-radius:4px;padding:7px 10px;margin-bottom:8px}
  .ctx-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
  .ctx-label{font-size:10px;color:var(--vscode-descriptionForeground)}
  .ctx-tokens{font-size:11px;font-weight:500;color:var(--vscode-foreground)}
  .ctx-bar-track{height:2px;background:var(--vscode-progressBar-background,#444);border-radius:1px;margin:4px 0}
  .ctx-bar-fill{height:100%;border-radius:1px;transition:width .3s}
  .ctx-bottom{display:flex;justify-content:space-between}
  .ctx-pct{font-size:10px;font-weight:500}
  .ctx-free{font-size:10px;color:var(--vscode-descriptionForeground)}
  .scroll-area{flex:1;overflow-y:auto}
  .section{padding:8px 12px 4px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--vscode-descriptionForeground);margin-bottom:6px;font-weight:600}
  .section-title.collapsible{cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none}
  .section-title.collapsible:hover{color:var(--vscode-foreground)}
  .collapse-arrow{transition:transform .2s;font-style:normal;font-size:16px;line-height:1}
  .collapsed .collapse-arrow{transform:rotate(-90deg)}
  .collapsible-content{display:block}
  .collapsed .collapsible-content{display:none}
  .stat-row{display:flex;gap:6px;margin-bottom:8px}
  .stat{background:var(--vscode-editor-inactiveSelectionBackground,rgba(255,255,255,0.04));border:1px solid var(--vscode-widget-border,#333);border-radius:4px;padding:5px 8px;flex:1}
  .stat-label{font-size:9px;color:var(--vscode-descriptionForeground);margin-bottom:2px}
  .stat-val{font-size:12px;font-weight:500}
  .tool-card{border:1px solid var(--vscode-widget-border,#333);border-radius:4px;margin-bottom:5px}
  .tool-header{display:flex;align-items:center;gap:6px;padding:5px 8px;background:var(--vscode-editor-inactiveSelectionBackground,rgba(255,255,255,.04))}
  .tool-ns{font-size:10px;color:var(--vscode-descriptionForeground)}
  .tool-name{font-size:11px;font-weight:500;color:#fbbf24;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}
  .tool-status{font-size:9px;margin-left:auto;padding:1px 5px;border-radius:3px}
  .status-ok{color:#4ade80;background:rgba(74,222,128,.15)}
  .status-pending{color:#fbbf24;background:rgba(251,191,36,.15)}
  .tool-body{padding:5px 8px}
  .tool-kv{display:flex;gap:6px;font-size:10px;margin-bottom:2px}
  .tk{color:#a78bfa;min-width:50px;flex-shrink:0}
  .tv{color:var(--vscode-descriptionForeground);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .git-row{display:flex;align-items:center;gap:6px;font-size:11px;padding:4px 0}
  .git-branch{color:var(--vscode-foreground);font-weight:500}
  .git-dirty{font-size:10px;color:#fbbf24;background:rgba(251,191,36,.15);padding:1px 5px;border-radius:3px}
  .empty{padding:12px;text-align:center;font-size:11px;color:var(--vscode-descriptionForeground)}
  .session-card{border:1px solid var(--vscode-widget-border,#333);border-radius:4px;margin-bottom:6px;padding:7px 10px}
  .session-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px}
  .session-model{font-size:11px;font-weight:500;color:#F5B482}
  .session-age{font-size:10px;color:var(--vscode-descriptionForeground)}
  .session-title{font-size:11px;color:var(--vscode-foreground);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .session-bottom{display:flex;justify-content:space-between;align-items:center}
  .session-project{font-size:10px;color:#EBDC82}
  .session-tokens{font-size:10px;color:var(--vscode-descriptionForeground)}
  .session-bar-track{height:2px;background:var(--vscode-progressBar-background,#444);border-radius:1px;margin:4px 0}
  .session-bar-fill{height:100%;border-radius:1px}
  .ep-badge{font-size:9px;padding:1px 5px;border-radius:3px;margin-left:6px;font-weight:500}
  .ep-vscode{color:#7c9ef8;background:rgba(124,158,248,.15)}
  .ep-cli{color:#EBDC82;background:rgba(235,220,130,.15)}
  .project-group{margin-bottom:8px}
  .project-group-label{font-size:10px;color:#EBDC82;font-weight:600;padding:6px 0 4px;border-bottom:1px solid var(--vscode-widget-border,#333);margin-bottom:6px}
  .session-card{border:1px solid var(--vscode-widget-border,#333);border-radius:4px;margin-bottom:6px;padding:7px 10px;cursor:pointer;transition:border-color .15s}
  .session-card:hover{border-color:var(--vscode-focusBorder,#007acc)}
  .agent-card{border:1px solid var(--vscode-widget-border,#333);border-radius:4px;margin-bottom:5px;padding:7px 10px}
  .agent-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}
  .agent-name{font-size:11px;font-weight:500;color:#a78bfa}
  .agent-id{font-size:10px;color:var(--vscode-descriptionForeground);font-family:monospace}
  .agent-started{font-size:10px;color:var(--vscode-descriptionForeground)}
  .statusbar{padding:4px 12px;border-top:1px solid var(--vscode-sideBarSectionHeader-border);display:flex;gap:10px;align-items:center;font-size:10px;color:var(--vscode-statusBar-foreground,#ccc);background:var(--vscode-statusBar-background);flex-shrink:0}
  .live-dot{width:5px;height:5px;border-radius:50%;background:#4ade80}
</style>
</head>
<body>

<div class="fixed-top">
  <div class="section">
    <div class="section-title" style="margin-bottom:6px">Current session</div>
    <div class="session-card">
      <div class="session-top"><span class="session-project" id="cur-project">—</span><span class="session-age" id="cur-age">—</span></div>
      <div class="session-title" id="cur-title">—</div>
      <div class="session-bar-track"><div class="session-bar-fill" id="bar" style="width:0%"></div></div>
      <div class="session-bottom"><span class="session-model" id="model">—</span><span class="session-tokens"><span id="tok-pct">0%</span> · <span id="tok-used">0</span></span></div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-label">duration</div><div class="stat-val" id="s-duration">—</div></div>
      <div class="stat"><div class="stat-label">tools used</div><div class="stat-val" id="s-tools">0</div></div>
      <div class="stat"><div class="stat-label">active agents</div><div class="stat-val" id="s-agents">0</div></div>
    </div>
    <div class="stat-row">
      <div class="stat" style="flex:1"><div class="stat-label">total tokens · last 24h</div><div class="stat-val" id="s-total-tokens">—</div></div>
    </div>
  </div>
</div>
<div class="main-scroll">
  <div class="section" id="sessions-section">
    <div class="section-title collapsible" onclick="toggleSessions()">
      <span>All sessions</span>
      <span class="collapse-arrow">▾</span>
    </div>
    <div class="collapsible-content">
      <div id="sessions-list"><div class="empty">No sessions found</div></div>
    </div>
  </div>
  <div class="section" id="agents-section">
    <div class="section-title collapsible" onclick="toggleAgents()">
      <span>Active agents</span>
      <span class="collapse-arrow">▾</span>
    </div>
    <div class="collapsible-content">
      <div id="agents-list"><div class="empty">No active agents</div></div>
    </div>
  </div>
  <div class="section" id="tools-section">
    <div class="section-title collapsible" onclick="toggleTools()">
      <span>Tool calls</span>
      <span class="collapse-arrow">▾</span>
    </div>
    <div class="collapsible-content">
      <div id="tools-list"><div class="empty">No tool calls yet</div></div>
    </div>
  </div>
</div>
<div class="statusbar">
  <div class="live-dot"></div>
  <span id="status-text">waiting for session…</span>
</div>
<script>
  const _vsc = acquireVsCodeApi();
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-session-id]');
    if (card) _vsc.postMessage({ command: 'resumeSession', sessionId: card.dataset.sessionId });
  });
  window.addEventListener('message', e => {
    const msg = e.data;
    window.__lastData = msg;
    if (msg.type !== 'updateSidebar') return;
    const d = msg.data;
    document.getElementById('model').textContent = d.model || '—';
    document.getElementById('cur-project').textContent = d.currentProject || '—';
    document.getElementById('cur-age').textContent = d.currentAge || '—';
    document.getElementById('cur-title').textContent = d.currentTitle || '—';
    document.getElementById('cur-title').title = d.currentTitle || '';
    document.getElementById('tok-used').textContent = (d.contextUsed||0).toLocaleString();
    const pct = d.pct || 0;
    const barColor = pct >= 80 ? '#f87171' : pct >= 50 ? '#fbbf24' : '#82D796';
    document.getElementById('tok-pct').textContent = pct + '%';
    document.getElementById('tok-pct').style.color = barColor;
    const bar = document.getElementById('bar');
    bar.style.width = Math.min(100, pct) + '%';
    bar.style.background = barColor;
    document.getElementById('s-duration').textContent = d.duration || '—';
    document.getElementById('s-tools').textContent = (d.tools||[]).length;
    document.getElementById('s-agents').textContent = (d.agents||[]).length;
    document.getElementById('s-total-tokens').textContent = (d.totalTokensAll||0).toLocaleString();

    const agents = d.agents || [];
    const agentsEl = document.getElementById('agents-list');
    if (!agents.length) { agentsEl.innerHTML = '<div class="empty">No active agents</div>'; }
    else {
      agentsEl.innerHTML = agents.map((a, i) => {
        const started = a.startTime ? new Date(a.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—';
        return '<div class="agent-card">'
          + '<div class="agent-top"><span class="agent-name">Agent ' + (i+1) + '</span><span class="agent-started">started ' + started + '</span></div>'
          + '<div class="agent-id">' + esc(a.id.slice(0, 16)) + '…</div>'
          + '</div>';
      }).join('');
    }

    const tools = d.tools || [];
    const toolsEl = document.getElementById('tools-list');
    if (!tools.length) { toolsEl.innerHTML = '<div class="empty">No tool calls yet</div>'; }
    else {
      toolsEl.innerHTML = tools.slice().reverse().map(t => {
        const ns = guessNs(t.name);
        const inp = t.input ? Object.entries(t.input).filter(([k]) => k !== 'description').slice(0,2).map(([k,v]) =>
          '<div class="tool-kv"><span class="tk">'+esc(k)+'</span><span class="tv">'+esc(String(v))+'</span></div>'
        ).join('') : '';
        return '<div class="tool-card"><div class="tool-header"><span class="tool-ns">'+ns+'</span>'
          + '<span class="tool-name">'+esc(t.name)+'</span>'
          + '<span class="tool-status status-'+t.status+'">'+t.status+'</span></div>'
          + (inp ? '<div class="tool-body">'+inp+'</div>' : '') + '</div>';
      }).join('');
    }
    document.getElementById('status-text').textContent = d.isActive
      ? (d.contextUsed||0).toLocaleString() + ' tokens · ' + (d.pct||0) + '% used'
      : 'no active session';

    const sessions = d.allSessions || [];
    const sessEl = document.getElementById('sessions-list');
    if (!sessions.length) { sessEl.innerHTML = '<div class="empty">No sessions found</div>'; }
    else {
      // Group by projectName
      const groups = {};
      sessions.forEach(s => {
        if (!groups[s.projectName]) groups[s.projectName] = [];
        groups[s.projectName].push(s);
      });
      sessEl.innerHTML = Object.entries(groups).map(([projName, projSessions]) => {
        const label = projName.replace(/^-Users-[^-]+-Projects-/, 'Projects/').replace(/^-Users-[^-]+-/, '~/').replace(/-/g, '/');
        const cards = projSessions.map(s => {
          const barColor = s.pct >= 80 ? '#f87171' : s.pct >= 50 ? '#fbbf24' : '#82D796';
          const epLabel = s.entrypoint === 'cli' ? 'cli' : s.entrypoint === 'claude-vscode' ? 'vscode' : (s.entrypoint || 'vscode').replace('claude-', '');
          const epClass = s.entrypoint === 'cli' ? 'ep-cli' : 'ep-vscode';
          return '<div class="session-card" data-session-id="'+esc(s.sessionId)+'" title="Click to resume this session">'
            + '<div class="session-top"><span class="session-age">'+esc(s.age)+'</span></div>'
            + '<div class="session-title" title="'+esc(s.title)+'">'+esc(s.title)+'</div>'
            + '<div class="session-bar-track"><div class="session-bar-fill" style="width:'+Math.min(100,s.pct)+'%;background:'+barColor+'"></div></div>'
            + '<div class="session-bottom"><span class="session-model">'+esc(s.model)+'<span class="ep-badge '+epClass+'">'+epLabel+'</span></span><span class="session-tokens"><span style="color:'+barColor+'">'+esc(s.pct)+'%</span> · '+esc(s.tokens)+'</span></div>'
            + '</div>';
        }).join('');
        return '<div class="project-group"><div class="project-group-label">'+esc(label)+'</div>'+cards+'</div>';
      }).join('');
    }
  });
  function toggleSessions() {
    document.getElementById('sessions-section').classList.toggle('collapsed');
  }
  function toggleAgents() {
    document.getElementById('agents-section').classList.toggle('collapsed');
  }
  function toggleTools() {
    document.getElementById('tools-section').classList.toggle('collapsed');
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function guessNs(n) {
    if (!n) return 'tool'; n = n.toLowerCase();
    if (n.includes('read')||n.includes('file')||n.includes('write')||n.includes('edit')) return 'fs';
    if (n.includes('bash')||n.includes('exec')||n.includes('command')) return 'bash';
    if (n.includes('search')||n.includes('web')||n.includes('fetch')) return 'web';
    return 'tool';
  }
</script>
</body>
</html>`;
    }
}
