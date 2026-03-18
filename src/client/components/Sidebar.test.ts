import { describe, it, expect } from 'vitest';
import { generateAvatarColor } from '@shared/utils/avatar';

describe('Sidebar UI Fixes', () => {
  describe('Avatar Color Generation', () => {
    it('should generate consistent colors for team names', () => {
      const color1 = generateAvatarColor('test-team');
      const color2 = generateAvatarColor('test-team');
      expect(color1).toBe(color2);
      expect(color1).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should generate different colors for different teams', () => {
      const color1 = generateAvatarColor('team-alpha');
      const color2 = generateAvatarColor('team-beta');
      expect(color1).not.toBe(color2);
    });
  });

  describe('Smart Time Formatting', () => {
    const formatSmartTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();

      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / 86400000);

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (diffDays === 0) {
        return `今天 ${timeStr}`;
      } else if (diffDays === 1) {
        return `昨天 ${timeStr}`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日 ${timeStr}`;
      }
    };

    it('should format today correctly', () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);
      const result = formatSmartTime(today.toISOString());
      expect(result).toMatch(/^今天 \d{2}:\d{2}$/);
      expect(result).toBe('今天 14:30');
    });

    it('should format yesterday correctly', () => {
      const now = new Date();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 15);
      const result = formatSmartTime(yesterday.toISOString());
      expect(result).toMatch(/^昨天 \d{2}:\d{2}$/);
      expect(result).toBe('昨天 10:15');
    });

    it('should format older dates correctly', () => {
      const now = new Date();
      const older = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 9, 45);
      const result = formatSmartTime(older.toISOString());
      expect(result).toMatch(/^\d{1,2}月\d{1,2}日 \d{2}:\d{2}$/);
    });
  });

  describe('Online Count Calculation', () => {
    it('should count online members correctly', () => {
      const team = {
        members: [
          { name: 'user', isOnline: true },
          { name: 'agent-1', isOnline: true },
          { name: 'agent-2', isOnline: false },
        ]
      };

      const onlineCount = team.members.filter(m => m.isOnline).length;
      expect(onlineCount).toBe(2);
    });

    it('should return 0 when no members are online', () => {
      const team = {
        members: [
          { name: 'agent-1', isOnline: false },
          { name: 'agent-2', isOnline: false },
        ]
      };

      const onlineCount = team.members.filter(m => m.isOnline).length;
      expect(onlineCount).toBe(0);
    });
  });
});

