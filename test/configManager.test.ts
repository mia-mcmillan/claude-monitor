import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: any) => defaultValue),
    })),
    onDidChangeConfiguration: vi.fn(() => ({
      dispose: vi.fn(),
    })),
  },
}));

import { ConfigManager } from '../src/configManager';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should load default config when no settings exist', () => {
    const config = configManager.getConfig();
    expect(config.statusBarLines).toContain(1);
    expect(config.sidebarRefreshMode).toBe('onDemand');
    expect(config.preset).toBe('essential');
  });

  it('should apply essential preset correctly', () => {
    const config = configManager.applyPreset('essential');
    expect(config.statusBarLines).toEqual([1, 2]);
    expect(config.sidebarSections).toContain('context');
    expect(config.sidebarSections).toContain('git');
  });

  it('should apply minimal preset correctly', () => {
    const config = configManager.applyPreset('minimal');
    expect(config.statusBarLines).toEqual([1]);
    expect(config.sidebarRefreshMode).toBe('onDemand');
  });

  it('should apply full preset correctly', () => {
    const config = configManager.applyPreset('full');
    expect(config.statusBarLines).toEqual([1, 2, 3]);
    expect(config.sidebarRefreshMode).toBe('300ms');
  });

  it('should validate and correct invalid config', () => {
    const config = configManager.validateConfig({
      statusBarLines: [1, 5],
      sidebarRefreshMode: 'invalid',
    } as any);
    expect(config.statusBarLines).not.toContain(5);
    expect(config.sidebarRefreshMode).toBe('onDemand');
  });
});