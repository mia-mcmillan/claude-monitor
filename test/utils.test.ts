import { describe, it, expect } from 'vitest';
import { formatContextBar, formatTokens, parseGitStatus, msToTime } from '../src/utils';

describe('Utilities', () => {
  describe('formatContextBar', () => {
    it('should format context as green when under 50%', () => {
      const bar = formatContextBar(450, 1000, '#22c55e', '#eab308', '#ef4444');
      expect(bar).toContain('45');
      expect(bar).toContain('🟢');
    });

    it('should format context as yellow when 50-80%', () => {
      const bar = formatContextBar(650, 1000, '#22c55e', '#eab308', '#ef4444');
      expect(bar).toContain('65');
      expect(bar).toContain('🟡');
    });

    it('should format context as red when over 80%', () => {
      const bar = formatContextBar(850, 1000, '#22c55e', '#eab308', '#ef4444');
      expect(bar).toContain('85');
      expect(bar).toContain('🔴');
    });
  });

  describe('formatTokens', () => {
    it('should format token counts with commas', () => {
      expect(formatTokens(1500)).toBe('1,500');
      expect(formatTokens(100000)).toBe('100,000');
    });
  });

  describe('msToTime', () => {
    it('should format milliseconds to human readable time', () => {
      expect(msToTime(60000)).toBe('1m');
      expect(msToTime(3600000)).toBe('1h');
      expect(msToTime(1500)).toBe('1s');
    });
  });
});
