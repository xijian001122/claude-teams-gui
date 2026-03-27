/**
 * Avatar generation utilities
 * Generates consistent colors and letters for team member avatars
 */
/**
 * Generate a unique, consistent color for a given name using HSL color space
 * Same name always produces the same color
 */
export function generateAvatarColor(name) {
    // 1. Calculate hash from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    // 2. Map hash to hue (0-360)
    const hue = Math.abs(hash) % 360;
    // 3. Use fixed saturation and lightness for consistent, vibrant colors
    const saturation = 65; // 65% saturation
    const lightness = 50; // 50% lightness
    // 4. Convert to hex format
    return hslToHex(hue, saturation, lightness);
}
/**
 * Extract avatar letter from member name
 * Takes the first letter of the first word (split by hyphen)
 */
export function extractAvatarLetter(name) {
    // Split by hyphen and take first word
    const parts = name.split('-');
    const firstWord = parts[0];
    // Return uppercase first letter, or '?' as fallback
    return firstWord && firstWord.length > 0
        ? firstWord[0].toUpperCase()
        : '?';
}
/**
 * Convert HSL color to hex format
 */
function hslToHex(h, s, l) {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (h >= 60 && h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (h >= 120 && h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (h >= 180 && h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (h >= 240 && h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else if (h >= 300 && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    const toHex = (n) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
//# sourceMappingURL=avatar.js.map