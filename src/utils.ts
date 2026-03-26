export function formatContextBar(
  used: number,
  limit: number,
  _colorGreen: string,
  _colorYellow: string,
  _colorRed: string
): string {
  const percentage = Math.round((used / limit) * 100);
  let emoji = '🟢';
  if (percentage > 80) emoji = '🔴';
  else if (percentage > 50) emoji = '🟡';

  return `${emoji} ${percentage}%`;
}

export function formatTokens(count: number): string {
  return count.toLocaleString();
}

export function msToTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function truncateString(str: string, maxLength: number): string {
  return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
}

export function sanitizeFilePath(filePath: string, workspaceRoot: string): string {
  // Return relative path from workspace root
  if (filePath.startsWith(workspaceRoot)) {
    return filePath.substring(workspaceRoot.length + 1);
  }
  return filePath;
}

export function colorEmojiForStatus(
  percentage: number
): { emoji: string; color: string } {
  if (percentage > 80) {
    return { emoji: '🔴', color: '#ef4444' };
  }
  if (percentage > 50) {
    return { emoji: '🟡', color: '#eab308' };
  }
  return { emoji: '🟢', color: '#22c55e' };
}

export function parseGitStatus(gitStatus: string): { branch: string; dirty: boolean } {
  const lines = gitStatus.split('\n');
  let branch = 'unknown';
  let dirty = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const branchInfo = line.substring(3);
      branch = branchInfo.split('...')[0]; // Handle detached HEAD and tracking
      dirty = line.includes('ahead') || line.includes('behind');
    } else if (line.length > 0 && !line.startsWith('#')) {
      dirty = true;
    }
  }

  return { branch, dirty };
}