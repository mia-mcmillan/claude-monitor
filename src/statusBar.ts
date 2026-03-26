import * as vscode from 'vscode';
import { SessionData, GitStatus, ColorConfig } from './types';
import { formatContextBar, msToTime } from './utils';

export class StatusBar {
  private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;

  constructor() {}

  create(
    position: 'left' | 'right' = 'right',
    priority: number = 100
  ): Map<string, vscode.StatusBarItem> {
    const items = new Map<string, vscode.StatusBarItem>();

    const alignment =
      position === 'left'
        ? vscode.StatusBarAlignment.Left
        : vscode.StatusBarAlignment.Right;

    // Create status bar items for lines 1-3
    for (let i = 1; i <= 3; i++) {
      const item = vscode.window.createStatusBarItem(alignment, priority - i);
      item.name = `Claude Monitor - Line ${i}`;
      item.command = 'claude-monitor.toggleSidebar';
      items.set(`line${i}`, item);
    }

    this.statusBarItems = items;
    return items;
  }

  formatLine1(
    data: SessionData,
    gitStatus: GitStatus | null,
    colors: ColorConfig
  ): string {
    const contextBar = formatContextBar(
      data.contextUsed,
      data.contextLimit,
      colors.contextGreen,
      colors.contextYellow,
      colors.contextRed
    );

    let line = `${data.model.split(' ')[0]} | ${contextBar}`;

    if (gitStatus) {
      line += ` | ${gitStatus.branch}`;
      if (gitStatus.isDirty) {
        line += ` [+${gitStatus.modifiedCount}]`;
      }
    }

    return line;
  }

  formatLine2(data: SessionData): string {
    const duration = msToTime(Date.now() - data.sessionStartTime);
    const toolCount = data.tools.length;
    const agentCount = data.agents.filter((a) => a.status === 'running').length;

    return `Session ${duration} | Tools: ${toolCount} | Agents: ${agentCount}`;
  }

  formatLine3(data: SessionData): string {
    const reads = data.tools.filter((t) => t.type === 'read').length;
    const edits = data.tools.filter((t) => t.type === 'edit').length;
    const searches = data.tools.filter((t) => t.type === 'search').length;

    return `Reads: ${reads} | Edits: ${edits} | Searches: ${searches}`;
  }

  update(
    lines: number[],
    data: SessionData,
    gitStatus: GitStatus | null,
    colors: ColorConfig
  ) {
    for (let lineNum of [1, 2, 3]) {
      const item = this.statusBarItems.get(`line${lineNum}`);
      if (!item) continue;

      if (lines.includes(lineNum)) {
        let text = '';
        if (lineNum === 1) {
          text = this.formatLine1(data, gitStatus, colors);
        } else if (lineNum === 2) {
          text = this.formatLine2(data);
        } else if (lineNum === 3) {
          text = this.formatLine3(data);
        }

        item.text = text;
        item.show();
      } else {
        item.hide();
      }
    }
  }

  show() {
    this.statusBarItems.forEach((item) => item.show());
  }

  hide() {
    this.statusBarItems.forEach((item) => item.hide());
  }

  dispose() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this.statusBarItems.forEach((item) => item.dispose());
  }
}