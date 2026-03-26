import * as vscode from 'vscode';
import { msToTime } from './utils';
import { SessionData } from './types';

export class SidebarProvider implements vscode.WebviewViewProvider {
    static readonly viewType = 'claudeMonitor.sidebar';
    private view?: vscode.WebviewView;
    private sessionData?: SessionData;
    private gitStatus?: any;

    constructor(private readonly context: vscode.ExtensionContext) {}

    async resolveWebviewView(webviewView: vscode.WebviewView) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        };
        webviewView.webview.html = this.getHtmlContent();
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === 'getSidebarData') this.updateView();
        });
    }

    async updateView() {
        if (!this.view) return;
        const s = this.sessionData;
        const g = this.gitStatus;
        const contextUsed = s?.contextUsed || 0;
        const contextLimit = s?.contextLimit || 200000;
        const pct = Math.round((contextUsed / contextLimit) * 100);
        this.view.webview.postMessage({
            type: 'updateSidebar',
            data: {
                model: s?.model || 'Unknown',
                contextUsed, contextLimit, pct,
                duration: msToTime(Date.now() - (s?.sessionStartTime || Date.now())),
                isActive: s?.isActive || false,
                tools: s?.tools || [],
                git: g || null,
            },
        });
    }

    setSessionData(data: SessionData) { this.sessionData = data; }
    setGitStatus(status: any) { this.gitStatus = status; }
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
  .header{padding:8px 12px;border-bottom:1px solid var(--vscode-sideBarSectionHeader-border);display:flex;justify-content:space-between;align-items:center;background:var(--vscode-sideBarSectionHeader-background);flex-shrink:0}
  .header-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--vscode-sideBarSectionHeader-foreground)}
  .model-pill{font-size:10px;padding:1px 6px;border-radius:3px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
  .token-section{padding:10px 12px;border-bottom:1px solid var(--vscode-sideBarSectionHeader-border);flex-shrink:0}
  .token-row{display:flex;justify-content:space-between;margin-bottom:5px;font-size:11px}
  .token-count{font-weight:500;color:var(--vscode-foreground)}
  .token-max{color:var(--vscode-descriptionForeground)}
  .bar-track{height:3px;background:var(--vscode-progressBar-background,#444);border-radius:2px}
  .bar-fill{height:100%;background:var(--vscode-progressBar-foreground,#0e70c0);border-radius:2px;transition:width .3s}
  .token-breakdown{display:flex;gap:10px;margin-top:6px}
  .tb{font-size:10px;color:var(--vscode-descriptionForeground);display:flex;align-items:center;gap:3px}
  .tb-dot{width:5px;height:5px;border-radius:50%}
  .scroll-area{flex:1;overflow-y:auto}
  .section{padding:8px 12px 4px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--vscode-descriptionForeground);margin-bottom:6px;font-weight:600}
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
  .statusbar{padding:4px 12px;border-top:1px solid var(--vscode-sideBarSectionHeader-border);display:flex;gap:10px;align-items:center;font-size:10px;color:var(--vscode-statusBar-foreground,#ccc);background:var(--vscode-statusBar-background);flex-shrink:0}
  .live-dot{width:5px;height:5px;border-radius:50%;background:#4ade80}
</style>
</head>
<body>
<div class="header">
  <span class="header-title">Claude Inspector</span>
  <span class="model-pill" id="model">—</span>
</div>
<div class="token-section">
  <div class="token-row">
    <span>Context window</span>
    <span><span class="token-count" id="tok-used">0</span><span class="token-max" id="tok-limit"> / 200,000</span></span>
  </div>
  <div class="bar-track"><div class="bar-fill" id="bar" style="width:0%"></div></div>
  <div class="token-breakdown">
    <div class="tb"><div class="tb-dot" style="background:#7c9ef8"></div><span id="tok-pct">0%</span> used</div>
    <div class="tb"><div class="tb-dot" style="background:#2dd4bf"></div><span id="tok-free">200,000</span> free</div>
  </div>
</div>
<div class="scroll-area">
  <div class="section">
    <div class="section-title">Session</div>
    <div class="stat-row">
      <div class="stat"><div class="stat-label">duration</div><div class="stat-val" id="s-duration">—</div></div>
      <div class="stat"><div class="stat-label">tools used</div><div class="stat-val" id="s-tools">0</div></div>
    </div>
    <div id="git-section"></div>
  </div>
  <div class="section">
    <div class="section-title">Tool calls</div>
    <div id="tools-list"><div class="empty">No tool calls yet</div></div>
  </div>
</div>
<div class="statusbar">
  <div class="live-dot"></div>
  <span id="status-text">waiting for session…</span>
</div>
<script>
  window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type !== 'updateSidebar') return;
    const d = msg.data;
    document.getElementById('model').textContent = d.model || '—';
    document.getElementById('tok-used').textContent = (d.contextUsed||0).toLocaleString();
    document.getElementById('tok-limit').textContent = ' / ' + (d.contextLimit||200000).toLocaleString();
    document.getElementById('tok-pct').textContent = (d.pct||0) + '%';
    document.getElementById('tok-free').textContent = Math.max(0,(d.contextLimit||200000)-(d.contextUsed||0)).toLocaleString();
    const bar = document.getElementById('bar');
    bar.style.width = Math.min(100, d.pct||0) + '%';
    bar.style.background = d.pct > 80 ? '#f87171' : d.pct > 50 ? '#fbbf24' : 'var(--vscode-progressBar-foreground,#0e70c0)';
    document.getElementById('s-duration').textContent = d.duration || '—';
    document.getElementById('s-tools').textContent = (d.tools||[]).length;
    const gitSec = document.getElementById('git-section');
    if (d.git && d.git.branch) {
      gitSec.innerHTML = '<div class="git-row"><span class="git-branch">⎇ ' + esc(d.git.branch) + '</span>'
        + (d.git.isDirty ? '<span class="git-dirty">dirty</span>' : '') + '</div>';
    } else { gitSec.innerHTML = ''; }
    const tools = d.tools || [];
    const toolsEl = document.getElementById('tools-list');
    if (!tools.length) { toolsEl.innerHTML = '<div class="empty">No tool calls yet</div>'; }
    else {
      toolsEl.innerHTML = tools.slice().reverse().map(t => {
        const ns = guessNs(t.name);
        const inp = t.input ? Object.entries(t.input).slice(0,2).map(([k,v]) =>
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
  });
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
