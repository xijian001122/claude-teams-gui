/**
 * Avatar generation utilities
 * Generates consistent colors and letters for team member avatars
 */
/**
 * Generate a unique, consistent color for a given name using HSL color space
 * Same name always produces the same color
 */
export declare function generateAvatarColor(name: string): string;
/**
 * Extract avatar letter from member name
 * Takes the first letter of the first word (split by hyphen)
 */
export declare function extractAvatarLetter(name: string): string;
//# sourceMappingURL=avatar.d.ts.map