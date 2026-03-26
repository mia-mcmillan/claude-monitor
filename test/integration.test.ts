import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('vscode', () => ({
  extensions: {
    getExtension: vi.fn(() => null),
  },
  window: {
    createStatusBarItem: vi.fn(() => ({
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: any) => defaultValue),
    })),
    onDidChangeConfiguration: vi.fn(() => ({
      dispose: vi.fn(),
    })),
  },
  StatusBarAlignment: {
    Left: 0,
    Right: 1,
  },
}));

import { ConfigManager } from '../src/configManager';
import { StatusBar } from '../src/statusBar';
import { DataIntegration } from '../src/dataIntegration';
import { GitHelper } from '../src/gitHelper';

describe('Extension Integration', () => {
  let configManager: ConfigManager;
  let statusBar: StatusBar;
  let dataIntegration: DataIntegration;
  let gitHelper: GitHelper;

  beforeEach(() => {
    configManager = new ConfigManager();
    statusBar = new StatusBar();
    dataIntegration = new DataIntegration();
    gitHelper = new GitHelper();
  });

  it('should handle missing Claude Code extension gracefully', async () => {
    const data = await dataIntegration.getSessionData();
    expect(data).toBeTruthy();
    expect(data.model).toBeDefined();
  });

  it('should render status bar with available data', async () => {
    const data = await dataIntegration.getSessionData();
    const git = await gitHelper.getGitStatus();

    // Should not throw - use default colors
    const defaultColors = {
      contextGreen: '#22c55e',
      contextYellow: '#eab308',
      contextRed: '#ef4444',
      text: '#ffffff',
      background: '#000000',
    };
    const line1 = statusBar.formatLine1(data, git, defaultColors);
    expect(line1).toBeTruthy();
  });

  it('should work with minimal config', () => {
    const preset = configManager.applyPreset('minimal');
    expect(preset.statusBarLines).toEqual([1]);
    expect(preset.sidebarRefreshMode).toBe('onDemand');
  });

  it('should work with full config', () => {
    const preset = configManager.applyPreset('full');
    expect(preset.statusBarLines).toEqual([1, 2, 3]);
    expect(preset.sidebarRefreshMode).toBe('300ms');
  });

  it('should format all status bar lines without errors', async () => {
    const data = await dataIntegration.getSessionData();
    const defaultColors = {
      contextGreen: '#22c55e',
      contextYellow: '#eab308',
      contextRed: '#ef4444',
      text: '#ffffff',
      background: '#000000',
    };

    // Should not throw
    const line1 = statusBar.formatLine1(data, null, defaultColors);
    const line2 = statusBar.formatLine2(data);
    const line3 = statusBar.formatLine3(data);

    expect(line1).toBeTruthy();
    expect(line2).toBeTruthy();
    expect(line3).toBeTruthy();
  });
});