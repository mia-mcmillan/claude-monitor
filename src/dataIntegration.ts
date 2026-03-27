import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SessionData } from './types';
import { getContextLimit } from './statusBar';

export class DataIntegration {
    private cachedData: SessionData | null = null;
    private lastFetchTime = 0;
    private readonly cacheDuration = 2000;
    private readonly claudeDir = path.join(os.homedir(), '.claude');

    async getSessionData(): Promise<SessionData> {
        const now = Date.now();
        if (this.cachedData && now - this.lastFetchTime < this.cacheDuration) {
            return this.cachedData;
        }
        try {
            const data = await this.fetchLatestSession();
            this.cachedData = data;
            this.lastFetchTime = now;
            return data;
        } catch (error) {
            console.error('Claude Monitor: Failed to fetch session data:', error);
            return {
                contextUsed: 0, contextLimit: 200000,
                model: 'Unknown', authProvider: 'Unknown',
                sessionStartTime: Date.now(), isActive: false,
                tools: [], agents: [],
            };
        }
    }

    private findMostRecentSessionFile(): string | null {
        const projectsDir = path.join(this.claudeDir, 'projects');
        if (!fs.existsSync(projectsDir)) return null;
        let newest: string | null = null;
        let newestMtime = 0;
        for (const projectName of fs.readdirSync(projectsDir)) {
            const projectPath = path.join(projectsDir, projectName);
            try { if (!fs.statSync(projectPath).isDirectory()) continue; } catch { continue; }
            for (const file of fs.readdirSync(projectPath)) {
                if (!file.endsWith('.jsonl')) continue;
                const filePath = path.join(projectPath, file);
                try {
                    const mtime = fs.statSync(filePath).mtimeMs;
                    if (mtime > newestMtime) { newestMtime = mtime; newest = filePath; }
                } catch { continue; }
            }
        }
        return newest;
    }

    private async fetchLatestSession(): Promise<SessionData> {
        const sessionFile = this.findMostRecentSessionFile();
        if (!sessionFile) throw new Error('No session files found');

        const content = fs.readFileSync(sessionFile, 'utf8');
        const lines = content.trim().split('\n').filter(l => l.trim());

        // Use the LAST assistant message's token count — not a running sum.
        // Each usage object already reflects the cumulative context for that turn.
        let latestInputTokens = 0;
        let latestOutputTokens = 0;
        let model = 'Unknown';
        let sessionStartTime: number | null = null;
        const tools: any[] = [];
        const toolIds = new Set<string>();
        const agentIds = new Set<string>();
        const agents: any[] = [];

        for (const line of lines) {
            let entry: any;
            try { entry = JSON.parse(line); } catch { continue; }

            // Capture the very first timestamp as session start
            if (entry.timestamp && sessionStartTime === null) {
                sessionStartTime = new Date(entry.timestamp).getTime();
            }

            if (entry.type === 'assistant' && entry.message) {
                const msg = entry.message;
                if (msg.model) model = msg.model;

                // Overwrite (not accumulate) — last assistant message wins
                if (msg.usage) {
                    const u = msg.usage;
                    latestInputTokens = (u.input_tokens || 0)
                        + (u.cache_creation_input_tokens || 0)
                        + (u.cache_read_input_tokens || 0);
                    latestOutputTokens = u.output_tokens || 0;
                }

                if (Array.isArray(msg.content)) {
                    for (const block of msg.content) {
                        if (block.type === 'tool_use' && !toolIds.has(block.id)) {
                            toolIds.add(block.id);
                            tools.push({ id: block.id, name: block.name, input: block.input, status: 'pending' });
                        }
                    }
                }
            }

            if (entry.type === 'user' && entry.message && Array.isArray(entry.message.content)) {
                for (const block of entry.message.content) {
                    if (block.type === 'tool_result') {
                        const tool = tools.find((t: any) => t.id === block.tool_use_id);
                        if (tool) tool.status = 'success';
                    }
                }
            }

            // Track sub-agents via isSidechain + agentId
            if (entry.isSidechain && entry.agentId && !agentIds.has(entry.agentId)) {
                agentIds.add(entry.agentId);
                agents.push({
                    id: entry.agentId,
                    name: `Agent ${agents.length + 1}`,
                    type: 'sub-agent',
                    status: 'running',
                    startTime: entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now(),
                });
            }
        }

        return {
            contextUsed: latestInputTokens + latestOutputTokens,
            contextLimit: getContextLimit(model),
            model,
            authProvider: 'Anthropic',
            sessionStartTime: sessionStartTime || Date.now(),
            isActive: true,
            tools: tools.slice(-20),
            agents,
        };
    }

    getCachedSessionData() { return this.cachedData; }
    clearCache() { this.cachedData = null; this.lastFetchTime = 0; }
    onSessionChanged(_listener: () => void) { return { dispose: () => {} }; }
}
