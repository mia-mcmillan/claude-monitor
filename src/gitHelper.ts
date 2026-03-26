import * as vscode from 'vscode';
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
    try {
      if (!this.gitExtension) {
        return null;
      }

      const git = this.gitExtension.getAPI(1);
      if (!git.repositories.length) {
        return null;
      }

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
    } catch (error) {
      console.error('Failed to get git status:', error);
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