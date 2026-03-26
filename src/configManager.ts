import * as vscode from 'vscode';
import { ConfigPreset } from './types';

export class ConfigManager {
  private readonly context?: vscode.ExtensionContext;
  private config: any;

  constructor(context?: vscode.ExtensionContext) {
    this.context = context;
    this.config = this.applyPreset('essential');
    this.config.preset = 'essential';
    if (context) {
      this.loadConfig();
    }
  }

  private loadConfig() {
    const config = vscode.workspace.getConfiguration('claudeMonitorVsCode');
    const presetName = config.get('preset', 'essential') as 'minimal' | 'essential' | 'full';
    this.config = this.applyPreset(presetName);
    this.config.preset = presetName;
  }

  getConfig(): ConfigPreset & any {
    return this.config;
  }

  applyPreset(preset: 'minimal' | 'essential' | 'full'): ConfigPreset {
    const presets = {
      minimal: {
        statusBarLines: [1],
        sidebarSections: ['context', 'git', 'sessionInfo'],
        refreshInterval: 1000,
        sidebarRefreshMode: 'onDemand' as const,
      },
      essential: {
        statusBarLines: [1, 2],
        sidebarSections: ['context', 'git', 'sessionInfo', 'metrics'],
        refreshInterval: 300,
        sidebarRefreshMode: 'onDemand' as const,
      },
      full: {
        statusBarLines: [1, 2, 3],
        sidebarSections: ['context', 'git', 'sessionInfo', 'metrics', 'toolActivity', 'agents'],
        refreshInterval: 300,
        sidebarRefreshMode: '300ms' as const,
      },
    };
    return presets[preset];
  }

  validateConfig(config: any): ConfigPreset {
    const validated: any = {};

    // Validate statusBarLines
    const statusBarLines = config.statusBarLines || [1, 2];
    validated.statusBarLines = statusBarLines.filter((line: number) => [1, 2, 3].includes(line));
    if (validated.statusBarLines.length === 0) {
      validated.statusBarLines = [1];
    }

    // Validate refreshMode
    const validModes = ['off', 'onDemand', '1s', '300ms'];
    validated.sidebarRefreshMode = validModes.includes(config.sidebarRefreshMode)
      ? config.sidebarRefreshMode
      : 'onDemand';

    // Validate refreshInterval
    validated.refreshInterval = Math.max(100, Math.min(5000, config.refreshInterval || 300));

    return validated;
  }

  getColorConfig(): any {
    const config = vscode.workspace.getConfiguration('claudeMonitorVsCode');
    return config.get('colors', {
      contextGreen: '#22c55e',
      contextYellow: '#eab308',
      contextRed: '#ef4444',
    });
  }

  onConfigurationChange(listener: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(() => {
      this.loadConfig();
      listener();
    });
  }

  getContext(): vscode.ExtensionContext | undefined {
    return this.context;
  }
}