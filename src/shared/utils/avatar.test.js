import { describe, it, expect } from 'vitest';
import { generateAvatarColor, extractAvatarLetter } from './avatar';
describe('generateAvatarColor', () => {
    it('should generate consistent colors for the same name', () => {
        const name = 'frontend-dev';
        const color1 = generateAvatarColor(name);
        const color2 = generateAvatarColor(name);
        const color3 = generateAvatarColor(name);
        expect(color1).toBe(color2);
        expect(color2).toBe(color3);
    });
    it('should generate different colors for different names', () => {
        const color1 = generateAvatarColor('frontend-dev');
        const color2 = generateAvatarColor('backend-dev');
        const color3 = generateAvatarColor('tester');
        expect(color1).not.toBe(color2);
        expect(color2).not.toBe(color3);
        expect(color1).not.toBe(color3);
    });
    it('should return valid hex color format', () => {
        const color = generateAvatarColor('test-user');
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
    it('should handle empty string', () => {
        const color = generateAvatarColor('');
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
    it('should handle special characters', () => {
        const color = generateAvatarColor('user@example.com');
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
});
describe('extractAvatarLetter', () => {
    it('should extract first letter from single word', () => {
        expect(extractAvatarLetter('developer')).toBe('D');
        expect(extractAvatarLetter('tester')).toBe('T');
        expect(extractAvatarLetter('user')).toBe('U');
    });
    it('should extract first letter from hyphenated names', () => {
        expect(extractAvatarLetter('frontend-dev')).toBe('F');
        expect(extractAvatarLetter('backend-dev')).toBe('B');
        expect(extractAvatarLetter('bug-fixer')).toBe('B');
        expect(extractAvatarLetter('team-lead')).toBe('T');
    });
    it('should handle lowercase names', () => {
        expect(extractAvatarLetter('alice')).toBe('A');
        expect(extractAvatarLetter('bob')).toBe('B');
    });
    it('should handle uppercase names', () => {
        expect(extractAvatarLetter('ALICE')).toBe('A');
        expect(extractAvatarLetter('BOB')).toBe('B');
    });
    it('should handle empty string', () => {
        expect(extractAvatarLetter('')).toBe('?');
    });
    it('should handle names with multiple hyphens', () => {
        expect(extractAvatarLetter('senior-frontend-developer')).toBe('S');
    });
});
//# sourceMappingURL=avatar.test.js.map