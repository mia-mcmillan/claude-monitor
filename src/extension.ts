import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { StatusBar } from './statusBar';
import { SidebarProvider } from './sidebar';
import { DataIntegration } from './dataIntegration';
import { GitHelper } from './gitHelper';

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

    // Create status bar
    const config = configManager.getConfig();
    statusBar.create(config.statusBarPosition || 'right', 100);
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
    const config = configManager.getConfig();
    const colors = configManager.getColorConfig();

    // Update status bar
    statusBar.update(config.statusBarLines, sessionData, gitStatus, colors);

    // Update sidebar
    sidebarProvider.setSessionData(sessionData);
    sidebarProvider.setGitStatus(gitStatus);
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