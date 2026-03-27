/**
 * Get directory birth time (creation time) with mtime fallback
 * Used to uniquely identify team instances
 */
export declare function getDirectoryBirthTime(dirPath: string): string;
/**
 * Extract project name from cwd path
 * Takes the last directory name from the path
 */
export declare function extractProjectFromCwd(cwd: string | undefined): string | undefined;
//# sourceMappingURL=file-stats.d.ts.map