import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { StatusBar } from './statusBar';
import { SidebarProvider } from './sidebar';
import { DataIntegration } from './dataIntegration';
import { GitHelper } from './gitHelper';
import { findAllProjectSessions, formatModelId } from './statusBar';

let statusBar: StatusBar;
let sidebarProvider: SidebarProvider;
let configManager: ConfigManager;
let dataIntegration: DataIntegration;
let gitHelper: GitHelper;

let updateInterval: NodeJS.Timeout | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Claude Monitor extension activated');

  try {
    // Initialize managers
    configManager = new ConfigManager(context);
    dataIntegration = new DataIntegration();
    gitHelper = new GitHelper();
    statusBar = new StatusBar();
    sidebarProvider = new SidebarProvider(context);

    // Register sidebar view
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        SidebarProvider.viewType,
        sidebarProvider
      )
    );

    // Show status bar
    statusBar.show();

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('claude-monitor.toggleSidebar', () => {
        vscode.commands.executeCommand(
          'workbench.view.extension.claudeMonitor-container'
        );
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('claude-monitor.refreshSidebar', () => {
        updateSidebarData();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('claude-monitor.showSessionBreakdown', async () => {
        const sessions = findAllProjectSessions();
        if (sessions.length === 0) {
          vscode.window.showInformationMessage('No active sessions found (sessions older than 8h are hidden).');
          return;
        }
        const items = sessions.map((s: any) => {
          const pct = s.contextPct;
          const filled = Math.round(pct / 10);
          const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
          const ctxEmoji = pct >= 80 ? '🔴' : pct >= 50 ? '🟡' : '🟢';
          const project = s.projectName.replace(/^-Users-[^-]+-/, '').replace(/-/g, '/');
          const age = (() => {
            const sec = Math.floor((Date.now() - s.mtime) / 1000);
            if (sec < 60) return 'just now';
            if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
            if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
            return `${Math.floor(sec / 86400)}d ago`;
          })();
          const tokens = s.totalTokens ? s.totalTokens.toLocaleString() + ' tokens' : '';
          const title = s.aiTitle || 'Untitled session';
          return {
            label: `$(folder) ${project}   ${title}`,
            description: `$(history) ${age}`,
            detail: `${ctxEmoji} ${bar} ${pct}%   $(rocket) ${formatModelId(s.model)}   $(circuit-board) ${tokens}`,
          };
        });
        await vscode.window.showQuickPick(items, {
          title: `Claude Sessions (${sessions.length} active)`,
          placeHolder: 'Most recently active first',
          matchOnDescription: true,
        });
      })
    );

    // Start update loop
    startUpdateLoop();

    // Listen for config changes
    context.subscriptions.push(
      configManager.onConfigurationChange(() => {
        console.log('Configuration changed, restarting update loop');
        stopUpdateLoop();
        startUpdateLoop();
      })
    );

    // Listen for git changes
    context.subscriptions.push(
      gitHelper.onDidChangeRepository(() => {
        updateStatus();
      })
    );

    vscode.window.showInformationMessage('Claude Monitor activated');
  } catch (error) {
    console.error('Failed to activate Claude Monitor:', error);
    vscode.window.showErrorMessage(`Claude Monitor activation failed: ${error}`);
  }
}

export function deactivate() {
  console.log('Claude Monitor extension deactivated');
  stopUpdateLoop();
  statusBar?.dispose();
  sidebarProvider?.dispose();
}

function startUpdateLoop() {
  const config = configManager.getConfig();
  const interval = config.refreshInterval || 300;

  updateStatus(); // Initial update
  updateInterval = setInterval(updateStatus, interval);
}

function stopUpdateLoop() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

async function updateStatus() {
  try {
    const sessionData = await dataIntegration.getSessionData();
    const gitStatus = await gitHelper.getGitStatus();
    const colors = configManager.getColorConfig();

    // Update status bar
    statusBar.update(sessionData, gitStatus, colors);

    // Update sidebar
    sidebarProvider.setSessionData(sessionData);
    updateSidebarData();
  } catch (error) {
    console.error('Failed to update status:', error);
  }
}

async function updateSidebarData() {
  try {
    await sidebarProvider.updateView();
  } catch (error) {
    console.error('Failed to update sidebar:', error);
  }
}