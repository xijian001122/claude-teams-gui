import { FastifyInstance } from 'fastify';
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../services/log-factory';

const log = createLogger({ module: 'Commands', shorthand: 's.r.commands' });

interface CommandItem {
  name: string;
  description: string;
  type: 'command' | 'skill';
}

interface ScanResult {
  data: { commands: CommandItem[]; skills: CommandItem[] };
  timestamp: number;
}

// Cache per project directory
const cacheMap = new Map<string, ScanResult>();
const CACHE_TTL = 60_000; // 60s

/** Extract YAML frontmatter fields from markdown content */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fields[key] = val;
  }
  return fields;
}

/** Get first non-frontmatter, non-empty line as fallback description */
function firstContentLine(content: string): string {
  const stripped = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
  for (const line of stripped.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) return trimmed;
  }
  return '';
}

/** Truncate description to 50 chars */
function truncate(desc: string): string {
  if (desc.length <= 50) return desc;
  return desc.slice(0, 50) + '...';
}

/** Get project cwd for a team from its config */
function getTeamProjectDir(teamsPath: string, teamName: string): string | null {
  const configPath = join(teamsPath, teamName, 'config.json');
  try {
    if (!existsSync(configPath)) return null;
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    // Use first member's cwd as project directory
    if (config.members && config.members.length > 0 && config.members[0].cwd) {
      return config.members[0].cwd;
    }
  } catch (err) {
    log.debug(`Failed to read team config for ${teamName}: ${err}`);
  }
  return null;
}

/** Scan .claude/skills and .claude/commands from a project directory */
function scanProjectDir(projectDir: string): { commands: CommandItem[]; skills: CommandItem[] } {
  const commands: CommandItem[] = [];
  const skills: CommandItem[] = [];

  const claudeDir = join(projectDir, '.claude');
  if (!existsSync(claudeDir)) {
    return { commands, skills };
  }

  // Scan commands: .claude/commands/**/*.md
  const commandsDir = join(claudeDir, 'commands');
  try {
    const groups = readdirSync(commandsDir);
    for (const group of groups) {
      const groupPath = join(commandsDir, group);
      if (!statSync(groupPath).isDirectory()) continue;
      const files = readdirSync(groupPath);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const filePath = join(groupPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const fm = parseFrontmatter(content);
        const callName = `${group}:${file.replace(/\.md$/, '')}`;
        let desc = fm.description || firstContentLine(content) || '';
        commands.push({ name: callName, description: truncate(desc), type: 'command' });
      }
    }
  } catch {
    log.debug('No commands directory found');
  }

  // Scan skills: .claude/skills/*/SKILL.md
  const skillsDir = join(claudeDir, 'skills');
  try {
    const dirs = readdirSync(skillsDir);
    for (const dir of dirs) {
      const skillFile = join(skillsDir, dir, 'SKILL.md');
      try {
        statSync(skillFile);
      } catch {
        continue;
      }
      const content = readFileSync(skillFile, 'utf-8');
      const fm = parseFrontmatter(content);
      let desc = fm.description || firstContentLine(content) || '';
      skills.push({ name: dir, description: truncate(desc), type: 'skill' });
    }
  } catch {
    log.debug('No skills directory found');
  }

  return { commands, skills };
}

export async function commandsRoutes(fastify: FastifyInstance) {
  // GET /api/commands?team=teamName — get commands for a specific team's project
  // GET /api/commands — get commands for current project (fallback)
  fastify.get('/', async (request) => {
    const { team, cwd } = request.query as { team?: string; cwd?: string };

    let projectDir: string;

    if (cwd) {
      // Explicit cwd passed from frontend
      projectDir = cwd;
    } else if (team) {
      // Derive from team config
      const teamsPath = (fastify as any).config?.teamsPath || process.env.CLAUDE_TEAMS_PATH || join(process.env.HOME || '/root', '.claude/teams');
      const teamCwd = getTeamProjectDir(teamsPath, team);
      projectDir = teamCwd || process.cwd();
    } else {
      // Fallback to current project
      projectDir = process.cwd();
    }

    // Check cache
    const cacheKey = projectDir;
    const cached = cacheMap.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const data = scanProjectDir(projectDir);
    cacheMap.set(cacheKey, { data, timestamp: Date.now() });
    log.debug(`Scanned commands for ${projectDir}: ${data.commands.length} commands, ${data.skills.length} skills`);
    return data;
  });
}
