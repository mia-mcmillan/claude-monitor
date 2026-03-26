import { describe, it, expect, beforeEach } from 'vitest';
import { StatusBar } from '../src/statusBar';
import { SessionData } from '../src/types';

describe('StatusBar', () => {
  let statusBar: StatusBar;

  beforeEach(() => {
    statusBar = new StatusBar();
  });

  it('should format status bar line 1 with model and context', () => {
    const data: SessionData = {
      contextUsed: 44000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: Date.now(),
      isActive: true,
      tools: [],
      agents: [],
    };

    const line = statusBar.formatLine1(data, null, {
      contextGreen: '#22c55e',
      contextYellow: '#eab308',
      contextRed: '#ef4444',
      text: '#000000',
      background: '#ffffff',
    });

    expect(line).toContain('Claude');
    expect(line).toContain('22');
    expect(line).toContain('🟢');
  });

  it('should include git status in line 1 when available', () => {
    const data: SessionData = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: Date.now(),
      isActive: true,
      tools: [],
      agents: [],
    };

    const gitStatus = { branch: 'main', isDirty: true, modifiedCount: 2 };

    const line = statusBar.formatLine1(data, gitStatus, {
      contextGreen: '#22c55e',
      contextYellow: '#eab308',
      contextRed: '#ef4444',
      text: '#000000',
      background: '#ffffff',
    });

    expect(line).toContain('main');
    expect(line).toContain('[+2]');
  });

  it('should format status bar line 2 with session duration and tools', () => {
    const now = Date.now();
    const data: SessionData = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: now - 120000, // 2 minutes ago
      isActive: true,
      tools: [
        { type: 'read', timestamp: now },
        { type: 'read', timestamp: now },
        { type: 'edit', timestamp: now },
      ],
      agents: [
        { id: '1', name: 'agent1', type: 'test', status: 'running', startTime: now },
        { id: '2', name: 'agent2', type: 'test', status: 'completed', startTime: now },
      ],
    };

    const line = statusBar.formatLine2(data);

    expect(line).toContain('Session');
    expect(line).toContain('2m');
    expect(line).toContain('Tools: 3');
    expect(line).toContain('Agents: 1');
  });

  it('should format status bar line 3 with tool breakdown', () => {
    const now = Date.now();
    const data: SessionData = {
      contextUsed: 45000,
      contextLimit: 200000,
      model: 'Claude Opus 4.6',
      authProvider: 'Anthropic',
      sessionStartTime: now,
      isActive: true,
      tools: [
        { type: 'read', timestamp: now },
        { type: 'read', timestamp: now },
        { type: 'edit', timestamp: now },
        { type: 'edit', timestamp: now },
        { type: 'edit', timestamp: now },
        { type: 'search', timestamp: now },
      ],
      agents: [],
    };

    const line = statusBar.formatLine3(data);

    expect(line).toContain('Reads: 2');
    expect(line).toContain('Edits: 3');
    expect(line).toContain('Searches: 1');
  });
});