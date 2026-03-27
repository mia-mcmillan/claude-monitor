import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SessionData, GitStatus, ColorConfig } from './types';
import { msToTime } from './utils';


const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const STALE_HOURS = 24;


const CONTEXT_WINDOWS: Record<string, string> = {
    'opus':   '1M',
    'sonnet': '200K',
    'haiku':  '200K',
};

export function getContextLimit(modelId: string): number {
    if (modelId.includes('opus')) return 1_000_000;
    return 200_000;
}

// Strip claude- prefix, clean version numbers, Title Case, append context size
// claude-opus-4-6 → Opus 4.6 (1M) | claude-sonnet-4-6 → Sonnet 4.6
export function formatModelId(modelId: string): string {
    if (!modelId || modelId === 'Unknown' || modelId === 'default') return 'Claude';
    const cleaned = modelId
        .replace(/^claude-/, '')
        .replace(/-20\d{6}$/, '')
        .replace(/-(\d+)-(\d+)$/, ' $1.$2');
    const titled = cleaned
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const family = Object.keys(CONTEXT_WINDOWS).find(k => modelId.includes(k));
    const ctx = family ? CONTEXT_WINDOWS[family] : null;
    return ctx === '1M' ? `${titled} (1M)` : titled;
}


function readSessionFromFile(filePath: string): any | null {
    try {
        const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(l => l.trim());
        let latestInputTokens = 0, latestOutputTokens = 0;
        let model = 'Unknown', sessionStartTime: number | null = null, aiTitle: string | null = null, entrypoint: string | null = null;
        for (const line of lines) {
            let entry: any;
            try { entry = JSON.parse(line); } catch { continue; }
            if (entry.timestamp && sessionStartTime === null)
                sessionStartTime = new Date(entry.timestamp).getTime();
            if (entry.type === 'ai-title' && entry.aiTitle)
                aiTitle = entry.aiTitle;
            if (!entrypoint && entry.entrypoint)
                entrypoint = entry.entrypoint;
            if (entry.type === 'assistant' && entry.message) {
                const msg = entry.message;
                if (msg.model && msg.model !== '<synthetic>') model = msg.model;
                if (msg.usage) {
                    const u = msg.usage;
                    latestInputTokens = (u.input_tokens || 0)
                        + (u.cache_creation_input_tokens || 0)
                        + (u.cache_read_input_tokens || 0);
                    latestOutputTokens = u.output_tokens || 0;
                }
            }
        }
        const totalTokens = latestInputTokens + latestOutputTokens;
        const contextLimit = getContextLimit(model);
        return { model, totalTokens, contextPct: Math.round((totalTokens / contextLimit) * 100), sessionStartTime, aiTitle, entrypoint };
    } catch { return null; }
}

export function findAllProjectSessions(): any[] {
    const projectsDir = path.join(CLAUDE_DIR, 'projects');
    if (!fs.existsSync(projectsDir)) return [];
    const cutoff = Date.now() - STALE_HOURS * 3600 * 1000;
    const results: any[] = [];

    // Determine the current workspace's Claude project name
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const currentProjectName = workspacePath
        ? workspacePath.replace(/\//g, '-').replace(/^-/, '-')
        : null;

    for (const projectName of fs.readdirSync(projectsDir)) {
        const projectPath = path.join(projectsDir, projectName);
        try { if (!fs.statSync(projectPath).isDirectory()) continue; } catch { continue; }
        for (const file of fs.readdirSync(projectPath)) {
            if (!file.endsWith('.jsonl')) continue;
            const filePath = path.join(projectPath, file);
            try {
                const mtime = fs.statSync(filePath).mtimeMs;
                if (mtime < cutoff) continue;
                const data = readSessionFromFile(filePath);
                const sessionId = path.basename(filePath, '.jsonl');
                if (data) results.push({ ...data, projectName, mtime, sessionId });
            } catch { continue; }
        }
    }

    // Sort: current workspace sessions first (by mtime desc), then others (by mtime desc)
    return results.sort((a, b) => {
        const aIsCurrent = a.projectName === currentProjectName ? 1 : 0;
        const bIsCurrent = b.projectName === currentProjectName ? 1 : 0;
        if (aIsCurrent !== bIsCurrent) return bIsCurrent - aIsCurrent;
        return b.mtime - a.mtime;
    });
}

export class StatusBar {
    private modelItem: vscode.StatusBarItem;
    private projectItem: vscode.StatusBarItem;
    private sessionItem: vscode.StatusBarItem;

    constructor() {
        const cmd = 'claude-monitor.showSessionBreakdown';
        this.modelItem   = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 102);
        this.projectItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        this.sessionItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.modelItem.command   = cmd;
        this.projectItem.command = cmd;
        this.sessionItem.command = cmd;
    }

    update(data: SessionData, gitStatus: GitStatus | null, _colors: ColorConfig) {
        const pct = Math.round((data.contextUsed / data.contextLimit) * 100);
        const modelDisplay = formatModelId(data.model);
        const duration = msToTime(Date.now() - (data.sessionStartTime || Date.now()));
        const toolCount = data.tools?.length ?? 0;
        const agentCount = data.agents?.filter((a: any) => a.status === 'running').length ?? 0;
        const ctxEmoji = pct >= 80 ? '🔴' : pct >= 50 ? '🟡' : '🟢';
        const branch = gitStatus?.branch ?? '';
        const dirty = gitStatus?.isDirty ? ` [+${gitStatus.modifiedCount ?? ''}]` : '';
        const tooltip = [
            `Model: ${data.model}`,
            `Context: ${pct}% (${data.contextUsed.toLocaleString()} / ${data.contextLimit.toLocaleString()} tokens)`,
            branch ? `Branch: ${branch}${dirty}` : '',
            `Session duration: ${duration}`,
            `Tool calls: ${toolCount}`,
        ].filter(Boolean).join('\n');

        // Model + context — peach
        this.modelItem.text = `$(rocket) ${modelDisplay}  ${ctxEmoji} ${pct}%`;
        this.modelItem.color = '#F5B482';
        this.modelItem.tooltip = tooltip;

        // Project + git — yellow
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const projectName = workspaceFolder ? path.basename(workspaceFolder.uri.fsPath) : '';
        if (projectName || branch) {
            const branchPart = branch ? `  $(git-branch) ${branch}${dirty}` : '';
            this.projectItem.text = `$(folder) ${projectName}${branchPart}`;
            this.projectItem.color = '#EBDC82';
            this.projectItem.tooltip = tooltip;
            this.projectItem.show();
        } else {
            this.projectItem.hide();
        }

        // Session stats — green
        this.sessionItem.text = `Session: ${duration}  |  Tools: ${toolCount}  |  Agents: ${agentCount}`;
        this.sessionItem.color = '#82D796';
        this.sessionItem.tooltip = tooltip;
    }

    show() {
        this.modelItem.show();
        this.sessionItem.show();
    }
    hide() {
        this.modelItem.hide();
        this.projectItem.hide();
        this.sessionItem.hide();
    }
    dispose() {
        this.modelItem.dispose();
        this.projectItem.dispose();
        this.sessionItem.dispose();
    }
}
