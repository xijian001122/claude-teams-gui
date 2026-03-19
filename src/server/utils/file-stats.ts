import { statSync } from 'fs';

/**
 * Get directory birth time (creation time) with mtime fallback
 * Used to uniquely identify team instances
 */
export function getDirectoryBirthTime(dirPath: string): string {
  try {
    const stats = statSync(dirPath);

    // Use birthtime if available (Unix systems)
    // Fall back to mtime if birthtime is not available or invalid
    const timestamp = stats.birthtimeMs || stats.mtimeMs;

    // Convert to ISO string for consistent format
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error(`[FileStats] Error getting directory birth time for ${dirPath}:`, error);
    // Fallback to current time if stats fail
    return new Date().toISOString();
  }
}

/**
 * Extract project name from cwd path
 * Takes the last directory name from the path
 */
export function extractProjectFromCwd(cwd: string | undefined): string | undefined {
  if (!cwd) {
    return undefined;
  }

  try {
    const parts = cwd.split('/').filter(p => p.length > 0);
    return parts[parts.length - 1] || undefined;
  } catch (error) {
    console.error(`[FileStats] Error extracting project from cwd ${cwd}:`, error);
    return undefined;
  }
}
