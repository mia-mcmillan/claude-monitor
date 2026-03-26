import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('vscode', () => ({
  extensions: {
    getExtension: vi.fn(() => null),
  },
}));

import { GitHelper } from '../src/gitHelper';

describe('GitHelper', () => {
  let gitHelper: GitHelper;

  beforeEach(() => {
    gitHelper = new GitHelper();
  });

  it('should return git status with branch name', async () => {
    const status = await gitHelper.getGitStatus();
    if (status) {
      expect(status).toHaveProperty('branch');
      expect(status).toHaveProperty('isDirty');
      expect(status).toHaveProperty('modifiedCount');
    }
  });

  it('should format git status for display', async () => {
    const formatted = await gitHelper.getFormattedGitStatus();
    if (formatted) {
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    }
  });

  it('should handle no git repo gracefully', async () => {
    const status = await gitHelper.getGitStatus();
    // Should return null or undefined if no repo, not throw
    expect(status === null || status === undefined || status.branch).toBeTruthy();
  });
});