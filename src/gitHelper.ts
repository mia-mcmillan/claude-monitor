import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { GitStatus } from './types';

export class GitHelper {
  private gitExtension: any;

  constructor() {
    try {
      this.gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    } catch (error) {
      console.warn('Git extension not available:', error);
      this.gitExtension = null;
    }
  }

  async getGitStatus(): Promise<GitStatus | null> {
    // Try VS Code git extension first
    try {
      if (this.gitExtension) {
        const git = this.gitExtension.getAPI(1);
        if (git.repositories.length) {
          const repo = git.repositories[0];
          const headRef = repo.state.HEAD;
          const branch = headRef?.name || 'detached HEAD';
          const workingChanges = repo.state.workingTreeChanges.length;
          const indexChanges = repo.state.indexChanges.length;
          return {
            branch,
            isDirty: workingChanges > 0 || indexChanges > 0,
            modifiedCount: workingChanges + indexChanges,
            lastCommit: headRef?.commit?.slice(0, 7),
          };
        }
      }
    } catch (error) {
      console.warn('VS Code git API failed, falling back to shell:', error);
    }

    // Fallback: read git directly via shell
    try {
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspacePath) return null;
      const branch = execSync(`git -C "${workspacePath}" branch --show-current 2>/dev/null`, {
        timeout: 2000, encoding: 'utf8'
      }).trim();
      if (!branch) return null;
      const isDirty = (() => {
        try {
          execSync(`git -C "${workspacePath}" diff-index --quiet HEAD -- 2>/dev/null`, { timeout: 2000 });
          return false;
        } catch { return true; }
      })();
      const modifiedCount = isDirty ? parseInt(
        execSync(`git -C "${workspacePath}" status --porcelain 2>/dev/null | wc -l`, { timeout: 2000, encoding: 'utf8' }).trim()
      , 10) : 0;
      return { branch, isDirty, modifiedCount };
    } catch (error) {
      console.error('Failed to get git status via shell:', error);
      return null;
    }
  }

  async getFormattedGitStatus(): Promise<string | null> {
    const status = await this.getGitStatus();
    if (!status) {
      return null;
    }

    let formatted = status.branch;
    if (status.isDirty) {
      formatted += ` [+${status.modifiedCount}]`;
    }
    return formatted;
  }

  onDidChangeRepository(listener: () => void): vscode.Disposable {
    if (!this.gitExtension) {
      return { dispose: () => {} };
    }

    const git = this.gitExtension.getAPI(1);
    return git.onDidOpenRepository(() => listener());
  }
}