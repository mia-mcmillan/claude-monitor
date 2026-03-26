// Session data from Claude Code extension
export interface SessionData {
  contextUsed: number;
  contextLimit: number;
  model: string;
  authProvider: string;
  sessionStartTime: number;
  isActive: boolean;
  tools: ToolActivity[];
  agents: AgentStatus[];
}

export interface ToolActivity {
  type: 'read' | 'edit' | 'search' | 'execute';
  timestamp: number;
  filePath?: string;
  details?: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  runtime?: number;
  progress?: number;
}

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  modifiedCount: number;
  lastCommit?: string;
}

export interface FormattedStatusBar {
  line1: string;
  line2?: string;
  line3?: string;
}

export interface ConfigPreset {
  statusBarLines: number[];
  sidebarSections: string[];
  refreshInterval: number;
  sidebarRefreshMode: 'off' | 'onDemand' | '1s' | '300ms';
}

export interface ColorConfig {
  contextGreen: string;
  contextYellow: string;
  contextRed: string;
  text: string;
  background: string;
}