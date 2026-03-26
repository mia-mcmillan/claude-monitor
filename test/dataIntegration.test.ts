import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { DataIntegration } from '../src/dataIntegration';

vi.mock('vscode');

describe('DataIntegration', () => {
  let dataIntegration: DataIntegration;

  beforeEach(() => {
    dataIntegration = new DataIntegration();
  });

  it('should detect if Claude Code extension is available', () => {
    const available = dataIntegration.isClaudeCodeAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should return default session data if Claude Code unavailable', async () => {
    const data = await dataIntegration.getSessionData();
    expect(data).toHaveProperty('contextUsed');
    expect(data).toHaveProperty('contextLimit');
    expect(data).toHaveProperty('model');
    expect(data).toHaveProperty('isActive');
  });

  it('should cache session data', async () => {
    await dataIntegration.getSessionData();
    const cached = dataIntegration.getCachedSessionData();
    expect(cached).toBeTruthy();
  });
});