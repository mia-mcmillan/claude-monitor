import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { SidebarProvider } from '../src/sidebar';

vi.mock('vscode');

describe('SidebarProvider', () => {
  let sidebarProvider: SidebarProvider;

  beforeEach(() => {
    sidebarProvider = new SidebarProvider(null as any);
  });

  it('should format context data for sidebar', () => {
    const data = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: Date.now(),
      isActive: true,
      tools: [],
      agents: [],
    };

    const formatted = sidebarProvider.formatDataForUI(data, null, null);
    expect(formatted).toHaveProperty('context');
    expect(formatted.context.used).toBe(45000);
    expect(formatted.context.limit).toBe(200000);
  });

  it('should include session info in formatted data', () => {
    const now = Date.now();
    const data = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: now,
      isActive: true,
      tools: [],
      agents: [],
    };

    const formatted = sidebarProvider.formatDataForUI(data, null, null);
    expect(formatted).toHaveProperty('session');
    expect(formatted.session.model).toBe('Claude Opus 4.6');
    expect(formatted.session.authProvider).toBe('Anthropic');
    expect(formatted.session.isActive).toBe(true);
  });

  it('should include git status when provided', () => {
    const data = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: Date.now(),
      isActive: true,
      tools: [],
      agents: [],
    };

    const gitStatus = {
      branch: 'main',
      isDirty: true,
      modifiedCount: 3,
    };

    const formatted = sidebarProvider.formatDataForUI(data, gitStatus, null);
    expect(formatted).toHaveProperty('git');
    expect(formatted.git).toEqual(gitStatus);
  });

  it('should handle undefined session data gracefully', () => {
    const formatted = sidebarProvider.formatDataForUI(undefined, null, null);
    expect(formatted.context.used).toBe(0);
    expect(formatted.context.limit).toBe(200000);
    expect(formatted.session.model).toBe('Unknown');
    expect(formatted.session.isActive).toBe(false);
  });

  it('should handle git status as null', () => {
    const data = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: Date.now(),
      isActive: true,
      tools: [],
      agents: [],
    };

    const formatted = sidebarProvider.formatDataForUI(data, null, null);
    expect(formatted.git).toBeNull();
  });

  it('should store and retrieve session data', () => {
    const data = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: Date.now(),
      isActive: true,
      tools: [],
      agents: [],
    };

    sidebarProvider.setSessionData(data);
    const formatted = sidebarProvider.formatDataForUI(data, null, null);
    expect(formatted.context.used).toBe(45000);
  });

  it('should store and retrieve git status', () => {
    const gitStatus = {
      branch: 'develop',
      isDirty: false,
      modifiedCount: 0,
    };

    sidebarProvider.setGitStatus(gitStatus);
    const formatted = sidebarProvider.formatDataForUI(undefined, gitStatus, null);
    expect(formatted.git.branch).toBe('develop');
  });
});