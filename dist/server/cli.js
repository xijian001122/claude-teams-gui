#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/services/log-factory.ts
import pino from "pino";
import { join } from "path";
import { mkdirSync, createWriteStream, existsSync, readdirSync, renameSync, statSync, unlinkSync, rmdirSync } from "fs";
import { homedir } from "os";
import { format } from "date-fns";
function expandHomeDir(path) {
  if (path.startsWith("~/") || path === "~") {
    return join(homedir(), path.slice(1));
  }
  return path;
}
function formatTimestamp(time) {
  const date = time instanceof Date ? time : new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
function formatContent(content) {
  if (!content) return "";
  const lines = content.split("\n");
  return "\n" + lines.map((line) => `- ${line}`).join("\n");
}
function createFormatter(module, shorthand, colorize) {
  return (level, time, msg) => {
    const timestamp = formatTimestamp(time);
    const levelName = level.toUpperCase().padEnd(5);
    const formattedMsg = formatContent(msg);
    if (colorize && process.stdout.isTTY) {
      const levelColor = LEVEL_COLORS[level.toUpperCase()] || COLORS.reset;
      const moduleColor = COLORS.cyan;
      return `${timestamp} ${moduleColor}[${module}]${COLORS.reset} ${levelColor}${levelName}${COLORS.reset} ${COLORS.gray}${shorthand}${COLORS.reset}${formattedMsg}
`;
    }
    return `${timestamp} [${module}] ${levelName} ${shorthand}${formattedMsg}
`;
  };
}
function ensureLogDir(logDir) {
  const expanded = expandHomeDir(logDir);
  if (!existsSync(expanded)) {
    mkdirSync(expanded, { recursive: true });
  }
}
function openStreams() {
  if (!globalConfig) return;
  const logDir = expandHomeDir(globalConfig.logDir);
  ensureLogDir(logDir);
  currentDate = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
  consoleStream = createWriteStream(join(logDir, "console.log"), { flags: "a" });
  infoStream = createWriteStream(join(logDir, "info.log"), { flags: "a" });
  errorStream = createWriteStream(join(logDir, "error.log"), { flags: "a" });
}
function closeStreams() {
  consoleStream?.end();
  infoStream?.end();
  errorStream?.end();
  consoleStream = null;
  infoStream = null;
  errorStream = null;
}
function flush() {
  if (buffer.length === 0) return;
  const lines = buffer.splice(0, buffer.length);
  for (const line of lines) {
    try {
      consoleStream?.write(line);
      if (line.includes(" INFO ") || line.includes(" WARN ")) {
        infoStream?.write(line);
      }
      if (line.includes(" ERROR ") || line.includes(" FATAL ")) {
        errorStream?.write(line);
      }
    } catch {
    }
  }
}
function checkRotation() {
  if (!globalConfig) return;
  const dateStr = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
  if (dateStr !== currentDate) {
    rotateByDate();
    currentDate = dateStr;
    return;
  }
  const logDir = expandHomeDir(globalConfig.logDir);
  const consolePath = join(logDir, "console.log");
  try {
    if (existsSync(consolePath)) {
      const stats = statSync(consolePath);
      if (stats.size >= globalConfig.maxSize * 1024 * 1024) {
        rotateBySize();
      }
    }
  } catch {
  }
}
function rotateByDate() {
  flush();
  closeStreams();
  const logDir = expandHomeDir(globalConfig.logDir);
  const historyDir = join(logDir, currentDate);
  mkdirSync(historyDir, { recursive: true });
  const nextIndex = getNextIndex(historyDir);
  moveToHistory(historyDir, nextIndex);
  openStreams();
}
function rotateBySize() {
  flush();
  closeStreams();
  const logDir = expandHomeDir(globalConfig.logDir);
  const historyDir = join(logDir, currentDate);
  mkdirSync(historyDir, { recursive: true });
  const nextIndex = getNextIndex(historyDir);
  moveToHistory(historyDir, nextIndex);
  openStreams();
}
function getNextIndex(historyDir) {
  try {
    const files = readdirSync(historyDir);
    const indices = files.filter((f) => f.endsWith(".log")).map((f) => {
      const match = f.match(/-(\d{3})\.log$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return indices.length > 0 ? Math.max(...indices) + 1 : 1;
  } catch {
    return 1;
  }
}
function moveToHistory(historyDir, index) {
  const logDir = expandHomeDir(globalConfig.logDir);
  const indexStr = String(index).padStart(3, "0");
  const files = [
    { from: "console.log", to: `console-${indexStr}.log` },
    { from: "info.log", to: `info-${indexStr}.log` },
    { from: "error.log", to: `error-${indexStr}.log` }
  ];
  for (const { from, to } of files) {
    const fromPath = join(logDir, from);
    const toPath = join(historyDir, to);
    try {
      if (existsSync(fromPath)) {
        renameSync(fromPath, toPath);
      }
    } catch {
    }
  }
}
function cleanupOldLogs() {
  if (!globalConfig) return;
  const logDir = expandHomeDir(globalConfig.logDir);
  const cutoffDate = /* @__PURE__ */ new Date();
  cutoffDate.setDate(cutoffDate.getDate() - globalConfig.maxDays);
  try {
    const entries = readdirSync(logDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirDate = new Date(entry.name);
        if (!isNaN(dirDate.getTime()) && dirDate < cutoffDate) {
          const dirPath = join(logDir, entry.name);
          deleteDirectory(dirPath);
        }
      }
    }
  } catch {
  }
}
function deleteDirectory(dirPath) {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        deleteDirectory(fullPath);
      } else {
        unlinkSync(fullPath);
      }
    }
    rmdirSync(dirPath);
  } catch {
  }
}
function startFlushTimer() {
  if (flushInterval) return;
  flushInterval = setInterval(() => {
    flush();
  }, FLUSH_INTERVAL);
}
function stopFlushTimer() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}
function writeLogLine(line) {
  buffer.push(line);
  if (buffer.length >= BUFFER_SIZE) {
    flush();
  }
  checkRotation();
}
function createLogger(moduleConfig) {
  if (!globalConfig) {
    const defaultLogDir = expandHomeDir("~/.claude-chat/logs");
    initLogFactory({
      ...DEFAULT_LOG_FACTORY_CONFIG,
      logDir: defaultLogDir,
      colorize: process.env.NODE_ENV !== "production"
    });
  }
  const { enabled, level, colorize } = globalConfig;
  const { module, shorthand } = moduleConfig;
  if (!enabled) {
    return pino({ level: "silent" });
  }
  const formatter = createFormatter(module, shorthand, colorize ?? false);
  const pinoLevel = level === "console" ? "debug" : level;
  const levelValue = LEVEL_VALUES[pinoLevel] ?? 30;
  const stream = {
    write: (data) => {
      try {
        const log14 = JSON.parse(data);
        const { level: lvl, time, msg } = log14;
        const levelName = pino.levels.labels[lvl] || "info";
        if (lvl < levelValue) return;
        const line = formatter(levelName, time, msg || "");
        writeLogLine(line);
        if (colorize && process.stdout.isTTY) {
          process.stdout.write(line);
        }
      } catch {
      }
    }
  };
  const options = {
    level: pinoLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({})
    },
    messageKey: "msg"
  };
  return pino(options, stream);
}
function rotateExistingLogs(logDir, todayStr) {
  const consolePath = join(logDir, "console.log");
  try {
    if (!existsSync(consolePath)) return;
    const stats = statSync(consolePath);
    const fileDate = format(stats.mtime, "yyyy-MM-dd");
    if (fileDate !== todayStr) {
      const historyDir = join(logDir, fileDate);
      mkdirSync(historyDir, { recursive: true });
      const nextIndex = getNextIndex(historyDir);
      moveToHistory(historyDir, nextIndex);
    }
  } catch {
  }
}
function initLogFactory(config) {
  globalConfig = config;
  const logDir = expandHomeDir(config.logDir);
  ensureLogDir(logDir);
  const todayStr = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
  rotateExistingLogs(logDir, todayStr);
  currentDate = todayStr;
  openStreams();
  startFlushTimer();
  cleanupOldLogs();
}
function updateLogConfig(updates) {
  if (globalConfig) {
    globalConfig = { ...globalConfig, ...updates };
  }
}
function closeLogFactory() {
  flush();
  stopFlushTimer();
  closeStreams();
}
function createFastifyLogger() {
  return createLogger({
    module: "HTTP",
    shorthand: "s.http"
  });
}
function getGlobalConfig() {
  return globalConfig;
}
var DEFAULT_LOG_FACTORY_CONFIG, COLORS, LEVEL_COLORS, LEVEL_VALUES, globalConfig, consoleStream, infoStream, errorStream, currentDate, buffer, flushInterval, BUFFER_SIZE, FLUSH_INTERVAL;
var init_log_factory = __esm({
  "src/server/services/log-factory.ts"() {
    "use strict";
    DEFAULT_LOG_FACTORY_CONFIG = {
      enabled: true,
      level: "info",
      maxSize: 10,
      maxDays: 7,
      logDir: "",
      colorize: false
    };
    COLORS = {
      reset: "\x1B[0m",
      red: "\x1B[31m",
      yellow: "\x1B[33m",
      green: "\x1B[32m",
      blue: "\x1B[34m",
      gray: "\x1B[90m",
      cyan: "\x1B[36m"
    };
    LEVEL_COLORS = {
      ERROR: COLORS.red,
      WARN: COLORS.yellow,
      INFO: COLORS.green,
      DEBUG: COLORS.blue,
      TRACE: COLORS.gray
    };
    LEVEL_VALUES = {
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10
    };
    globalConfig = null;
    consoleStream = null;
    infoStream = null;
    errorStream = null;
    currentDate = "";
    buffer = [];
    flushInterval = null;
    BUFFER_SIZE = 100;
    FLUSH_INTERVAL = 1e3;
  }
});

// src/server/db/index.ts
var db_exports = {};
__export(db_exports, {
  DatabaseService: () => DatabaseService,
  default: () => db_default
});
import sqlite3 from "sqlite3";
import { join as join2 } from "path";
import { existsSync as existsSync2, mkdirSync as mkdirSync2, readFileSync } from "fs";
function getLog() {
  if (!_log) {
    _log = createLogger({ module: "Database", shorthand: "s.db" });
  }
  return _log;
}
var _log, DatabaseService, db_default;
var init_db = __esm({
  "src/server/db/index.ts"() {
    "use strict";
    init_log_factory();
    _log = null;
    DatabaseService = class {
      db;
      ready = false;
      constructor(dataDir) {
        if (!existsSync2(dataDir)) {
          mkdirSync2(dataDir, { recursive: true });
        }
        const dbPath = join2(dataDir, "messages.db");
        this.db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            getLog().error(`Failed to open database: ${err}`);
          }
        });
        this.initSchemaSync();
        this.runMigrations();
      }
      initSchemaSync() {
        try {
          const schemaPath = join2(__dirname, "schema.sql");
          const schema = readFileSync(schemaPath, "utf8");
          this.db.exec(schema, (err) => {
            if (err) {
              getLog().error(`Failed to initialize schema: ${err}`);
            } else {
              getLog().info("Schema initialized");
              this.ready = true;
            }
          });
        } catch (err) {
          getLog().error(`Failed to read schema file: ${err}`);
        }
      }
      ensureReady() {
        if (!this.ready) {
          getLog().warn("Database not ready, operation may fail");
        }
      }
      runMigrations() {
        const migrations = [
          {
            version: 2,
            sql: `
          ALTER TABLE messages ADD COLUMN source TEXT NOT NULL DEFAULT 'inbox' CHECK(source IN ('inbox', 'session'));
          ALTER TABLE messages ADD COLUMN msg_type TEXT NOT NULL DEFAULT 'text' CHECK(msg_type IN ('text', 'thinking', 'tool_use', 'tool_result', 'queue_operation'));
          ALTER TABLE messages ADD COLUMN member_name TEXT;
          ALTER TABLE messages ADD COLUMN tool_name TEXT;
          ALTER TABLE messages ADD COLUMN tool_input TEXT;
          ALTER TABLE messages ADD COLUMN session_id TEXT;
        `
          },
          {
            version: 3,
            sql: `
          CREATE TABLE IF NOT EXISTS jsonl_file_tracker (
            file_path TEXT PRIMARY KEY,
            team_name TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            byte_offset INTEGER NOT NULL DEFAULT 0,
            last_modified TEXT NOT NULL
          );
        `
          }
        ];
        for (const migration of migrations) {
          this.db.get(
            "SELECT version FROM schema_version WHERE version = ?",
            [migration.version],
            (err, row) => {
              if (err) {
                getLog().error(`Migration check failed for v${migration.version}: ${err}`);
                return;
              }
              if (!row) {
                getLog().info(`Running migration v${migration.version}...`);
                this.db.exec(migration.sql, (execErr) => {
                  if (execErr) {
                    getLog().warn(`Migration v${migration.version} note: ${execErr}`);
                  }
                  this.db.run(
                    "INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?, datetime('now'))",
                    [migration.version],
                    (insertErr) => {
                      if (insertErr) {
                        getLog().error(`Failed to record migration v${migration.version}: ${insertErr}`);
                      } else {
                        getLog().info(`Migration v${migration.version} applied`);
                      }
                    }
                  );
                });
              }
            }
          );
        }
      }
      // Message operations
      insertMessage(message) {
        return new Promise((resolve2, reject) => {
          const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO messages (
          id, local_id, team, from_member, from_type, to_member,
          content, content_type, timestamp, edited_at, deleted_at,
          claude_team, claude_inbox, claude_index, claude_timestamp, metadata, original_team,
          team_instance_id, source_project
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
          stmt.run(
            message.id,
            message.localId,
            message.team || "unknown",
            message.from,
            message.fromType,
            message.to,
            message.content,
            message.contentType,
            message.timestamp,
            message.editedAt || null,
            message.deletedAt || null,
            message.claudeRef?.team || null,
            message.claudeRef?.inboxFile || null,
            message.claudeRef?.messageIndex || null,
            message.claudeRef?.timestamp || null,
            message.metadata ? JSON.stringify(message.metadata) : null,
            message.originalTeam || null,
            message.teamInstance || null,
            message.sourceProject || null,
            (err) => {
              stmt.finalize();
              if (err) reject(err);
              else resolve2();
            }
          );
        });
      }
      // Insert message and return true if it was actually inserted (new message)
      insertMessageIfNew(message) {
        return new Promise((resolve2, reject) => {
          const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO messages (
          id, local_id, team, from_member, from_type, to_member,
          content, content_type, timestamp, edited_at, deleted_at,
          claude_team, claude_inbox, claude_index, claude_timestamp, metadata, original_team,
          team_instance_id, source_project
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
          stmt.run(
            message.id,
            message.localId,
            message.team || "unknown",
            message.from,
            message.fromType,
            message.to,
            message.content,
            message.contentType,
            message.timestamp,
            message.editedAt || null,
            message.deletedAt || null,
            message.claudeRef?.team || null,
            message.claudeRef?.inboxFile || null,
            message.claudeRef?.messageIndex || null,
            message.claudeRef?.timestamp || null,
            message.metadata ? JSON.stringify(message.metadata) : null,
            message.originalTeam || null,
            message.teamInstance || null,
            message.sourceProject || null,
            function(err) {
              stmt.finalize();
              if (err) reject(err);
              else resolve2(this.changes > 0);
            }
          );
        });
      }
      /**
       * Insert a session-sourced message (from JSONL sync)
       */
      insertSessionMessage(msg) {
        return new Promise((resolve2, reject) => {
          const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO messages (
          id, local_id, team, from_member, from_type, to_member,
          content, content_type, timestamp,
          source, msg_type, member_name, tool_name, tool_input, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
          stmt.run(
            msg.id,
            msg.localId,
            msg.team,
            msg.fromMember,
            msg.fromType,
            msg.toMember,
            msg.content,
            msg.contentType,
            msg.timestamp,
            msg.source,
            msg.msgType,
            msg.memberName,
            msg.toolName,
            msg.toolInput,
            msg.sessionId,
            (err) => {
              stmt.finalize();
              if (err) reject(err);
              else resolve2();
            }
          );
        });
      }
      getMessages(team, options = {}) {
        return new Promise((resolve2, reject) => {
          const { before, limit = 50, to, instance, source, member } = options;
          let sql = `
        SELECT * FROM messages
        WHERE team = ? AND deleted_at IS NULL
      `;
          const params = [team];
          if (before) {
            sql += " AND timestamp < ?";
            params.push(before);
          }
          if (to !== void 0) {
            if (to === null) {
              sql += " AND to_member IS NULL";
            } else {
              sql += " AND to_member = ?";
              params.push(to);
            }
          }
          if (instance !== void 0) {
            if (instance === null || instance === "null") {
              sql += " AND team_instance_id IS NULL";
            } else {
              sql += " AND team_instance_id = ?";
              params.push(instance);
            }
          }
          if (source !== void 0) {
            sql += " AND source = ?";
            params.push(source);
          }
          if (member !== void 0) {
            sql += " AND member_name = ?";
            params.push(member);
          }
          sql += " ORDER BY timestamp DESC LIMIT ?";
          params.push(limit);
          this.db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const messages = rows.map((row) => this.rowToMessage(row)).reverse();
              resolve2(messages);
            }
          });
        });
      }
      getMessageCount(team) {
        return new Promise((resolve2, reject) => {
          this.db.get(`
        SELECT COUNT(*) as count FROM messages
        WHERE team = ? AND deleted_at IS NULL
      `, [team], (err, row) => {
            if (err) reject(err);
            else resolve2(row?.count || 0);
          });
        });
      }
      updateMessage(id, updates) {
        return new Promise((resolve2, reject) => {
          const fields = [];
          const values = [];
          if (updates.content !== void 0) {
            fields.push("content = ?");
            values.push(updates.content);
          }
          if (updates.editedAt !== void 0) {
            fields.push("edited_at = ?");
            values.push(updates.editedAt);
          }
          if (updates.deletedAt !== void 0) {
            fields.push("deleted_at = ?");
            values.push(updates.deletedAt);
          }
          if (fields.length === 0) {
            resolve2();
            return;
          }
          values.push(id);
          const sql = `UPDATE messages SET ${fields.join(", ")} WHERE id = ?`;
          this.db.run(sql, values, (err) => {
            if (err) reject(err);
            else resolve2();
          });
        });
      }
      // Update permission_request message status in content JSON
      updatePermissionRequestStatus(team, requestId, status) {
        return new Promise((resolve2, reject) => {
          const sql = `
        SELECT id, content FROM messages
        WHERE team = ? AND deleted_at IS NULL
          AND content LIKE '%"type":"permission_request"%'
          AND content LIKE ?
        LIMIT 1
      `;
          this.db.get(sql, [team, `%request_id%${requestId}%`], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            if (!row) {
              resolve2();
              return;
            }
            try {
              const content = JSON.parse(row.content);
              if (content.type === "permission_request" && content.request_id === requestId) {
                content.status = status;
                const updateSql = "UPDATE messages SET content = ? WHERE id = ?";
                this.db.run(updateSql, [JSON.stringify(content), row.id], (updateErr) => {
                  if (updateErr) reject(updateErr);
                  else resolve2();
                });
              } else {
                resolve2();
              }
            } catch (parseErr) {
              reject(parseErr);
            }
          });
        });
      }
      // Fix null teamInstance messages - update all messages with null team_instance_id
      fixNullTeamInstance(teamName) {
        return new Promise((resolve2, reject) => {
          this.db.get("SELECT team_instance_id FROM teams WHERE name = ?", [teamName], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            if (!row || !row.team_instance_id) {
              resolve2(0);
              return;
            }
            const teamInstance = row.team_instance_id;
            this.db.run(
              "UPDATE messages SET team_instance_id = ? WHERE team = ? AND team_instance_id IS NULL",
              [teamInstance, teamName],
              function(updateErr) {
                if (updateErr) reject(updateErr);
                else resolve2(this.changes);
              }
            );
          });
        });
      }
      // Team operations
      upsertTeam(team) {
        return new Promise((resolve2, reject) => {
          const stmt = this.db.prepare(`
        INSERT INTO teams (name, display_name, status, created_at, archived_at, last_activity, message_count, members, config, allow_cross_team_messages, team_instance_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          display_name = excluded.display_name,
          status = excluded.status,
          archived_at = excluded.archived_at,
          last_activity = excluded.last_activity,
          message_count = excluded.message_count,
          members = excluded.members,
          config = excluded.config,
          allow_cross_team_messages = excluded.allow_cross_team_messages,
          team_instance_id = excluded.team_instance_id
      `);
          stmt.run(
            team.name,
            team.displayName,
            team.status,
            team.createdAt,
            team.archivedAt || null,
            team.lastActivity,
            team.messageCount,
            JSON.stringify(team.members),
            JSON.stringify(team.config),
            team.allowCrossTeamMessages ? 1 : 0,
            team.teamInstance || null,
            (err) => {
              stmt.finalize();
              if (err) reject(err);
              else resolve2();
            }
          );
        });
      }
      getTeams(status, acceptsCrossTeamMessages) {
        this.ensureReady();
        return new Promise((resolve2, reject) => {
          let sql = "SELECT * FROM teams";
          const params = [];
          const conditions = [];
          if (status) {
            conditions.push("status = ?");
            params.push(status);
          }
          if (acceptsCrossTeamMessages !== void 0) {
            conditions.push("allow_cross_team_messages = ?");
            params.push(acceptsCrossTeamMessages ? 1 : 0);
          }
          if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
          }
          sql += " ORDER BY last_activity DESC";
          this.db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const teams = rows.map((row) => this.rowToTeam(row));
              resolve2(teams);
            }
          });
        });
      }
      getTeam(name) {
        return new Promise((resolve2, reject) => {
          this.db.get("SELECT * FROM teams WHERE name = ?", [name], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve2(row ? this.rowToTeam(row) : null);
            }
          });
        });
      }
      updateTeamStatus(name, status, archivedAt) {
        return new Promise((resolve2, reject) => {
          this.db.run(`
        UPDATE teams SET status = ?, archived_at = ? WHERE name = ?
      `, [status, archivedAt || null, name], (err) => {
            if (err) reject(err);
            else resolve2();
          });
        });
      }
      updateTeamActivity(name, lastActivity) {
        return new Promise((resolve2, reject) => {
          this.db.run(`
        UPDATE teams SET last_activity = ? WHERE name = ?
      `, [lastActivity, name], (err) => {
            if (err) reject(err);
            else resolve2();
          });
        });
      }
      updateTeamCrossTeamPermission(name, allow) {
        return new Promise((resolve2, reject) => {
          this.db.run(`
        UPDATE teams SET allow_cross_team_messages = ? WHERE name = ?
      `, [allow ? 1 : 0, name], (err) => {
            if (err) reject(err);
            else resolve2();
          });
        });
      }
      deleteTeam(name) {
        return new Promise((resolve2, reject) => {
          this.db.run("DELETE FROM teams WHERE name = ?", [name], (err) => {
            if (err) reject(err);
            else resolve2();
          });
        });
      }
      // Cleanup operations
      deleteOldMessages(cutoffDate) {
        return new Promise((resolve2, reject) => {
          this.db.run(`
        DELETE FROM messages WHERE timestamp < ? AND deleted_at IS NOT NULL
      `, [cutoffDate], function(err) {
            if (err) reject(err);
            else resolve2(this.changes);
          });
        });
      }
      getArchivedTeams() {
        return new Promise((resolve2, reject) => {
          this.db.all(`
        SELECT name, archived_at FROM teams WHERE status = 'archived'
      `, (err, rows) => {
            if (err) reject(err);
            else resolve2(rows);
          });
        });
      }
      // Utility
      rowToMessage(row) {
        return {
          id: row.id,
          localId: row.local_id,
          team: row.team,
          from: row.from_member,
          fromType: row.from_type,
          to: row.to_member,
          content: row.content,
          contentType: row.content_type,
          timestamp: row.timestamp,
          editedAt: row.edited_at,
          deletedAt: row.deleted_at,
          claudeRef: row.claude_team ? {
            team: row.claude_team,
            inboxFile: row.claude_inbox,
            messageIndex: row.claude_index,
            timestamp: row.claude_timestamp
          } : void 0,
          metadata: row.metadata ? JSON.parse(row.metadata) : void 0,
          originalTeam: row.original_team || void 0,
          teamInstance: row.team_instance_id || void 0,
          sourceProject: row.source_project || void 0,
          source: row.source || "inbox",
          msgType: row.msg_type || "text",
          memberName: row.member_name || void 0,
          toolName: row.tool_name || void 0,
          toolInput: row.tool_input || void 0,
          sessionId: row.session_id || void 0
        };
      }
      rowToTeam(row) {
        const config = JSON.parse(row.config || "{}");
        return {
          name: row.name,
          displayName: row.display_name,
          status: row.status,
          createdAt: row.created_at,
          archivedAt: row.archived_at,
          lastActivity: row.last_activity,
          messageCount: row.message_count,
          unreadCount: 0,
          members: JSON.parse(row.members),
          config,
          allowCrossTeamMessages: row.allow_cross_team_messages === 1,
          teamInstance: row.team_instance_id || void 0
        };
      }
      close() {
        this.db.close();
      }
    };
    db_default = DatabaseService;
  }
});

// src/shared/utils/avatar.ts
function generateAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 65;
  const lightness = 50;
  return hslToHex(hue, saturation, lightness);
}
function extractAvatarLetter(name) {
  const parts = name.split("-");
  const firstWord = parts[0];
  return firstWord && firstWord.length > 0 ? firstWord[0].toUpperCase() : "?";
}
function hslToHex(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(h / 60 % 2 - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = (n) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
var init_avatar = __esm({
  "src/shared/utils/avatar.ts"() {
    "use strict";
  }
});

// src/server/utils/file-stats.ts
import { statSync as statSync2 } from "fs";
function getDirectoryBirthTime(dirPath) {
  try {
    const stats = statSync2(dirPath);
    const timestamp = stats.birthtimeMs || stats.mtimeMs;
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error(`[FileStats] Error getting directory birth time for ${dirPath}:`, error);
    return (/* @__PURE__ */ new Date()).toISOString();
  }
}
function extractProjectFromCwd(cwd) {
  if (!cwd) {
    return void 0;
  }
  try {
    const parts = cwd.split("/").filter((p) => p.length > 0);
    return parts[parts.length - 1] || void 0;
  } catch (error) {
    console.error(`[FileStats] Error extracting project from cwd ${cwd}:`, error);
    return void 0;
  }
}
var init_file_stats = __esm({
  "src/server/utils/file-stats.ts"() {
    "use strict";
  }
});

// src/server/services/data-sync.ts
import { join as join3 } from "path";
import { readFileSync as readFileSync2, existsSync as existsSync3, writeFileSync, mkdirSync as mkdirSync3, readdirSync as readdirSync2, rmSync } from "fs";
var log, wsLog, DataSyncService;
var init_data_sync = __esm({
  "src/server/services/data-sync.ts"() {
    "use strict";
    init_avatar();
    init_file_stats();
    init_log_factory();
    log = createLogger({ module: "DataSync", shorthand: "s.s.data-sync" });
    wsLog = createLogger({ module: "WebSocket", shorthand: "s.ws" });
    DataSyncService = class {
      db;
      fastify;
      claudeTeamsPath;
      dataDir;
      constructor(options) {
        this.db = options.db;
        this.fastify = options.fastify;
        this.claudeTeamsPath = options.claudeTeamsPath;
        this.dataDir = options.dataDir;
      }
      /**
       * Initialize sync by scanning existing teams
       */
      async init() {
        if (!existsSync3(this.claudeTeamsPath)) {
          log.info(`Claude teams path not found: ${this.claudeTeamsPath}`);
          return;
        }
        const teams = await this.scanTeams();
        log.info(`Found ${teams.length} teams`);
        for (const teamName of teams) {
          await this.syncTeam(teamName);
        }
      }
      /**
       * Scan for available teams
       */
      async scanTeams() {
        const { readdir: readdir3 } = await import("fs/promises");
        try {
          const entries = await readdir3(this.claudeTeamsPath, { withFileTypes: true });
          return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
        } catch {
          return [];
        }
      }
      /**
       * Sync a single team
       */
      async syncTeam(teamName) {
        const teamPath = join3(this.claudeTeamsPath, teamName);
        const configPath = join3(teamPath, "config.json");
        const backupPath = join3(teamPath, "config.backup.json");
        log.debug(`Syncing team: ${teamName}`);
        if (!existsSync3(configPath)) {
          log.warn(`Config not found for team: ${teamName}`);
          return null;
        }
        let config;
        try {
          let configContent = readFileSync2(configPath, "utf8");
          if (configContent.charCodeAt(0) === 65279) {
            configContent = configContent.slice(1);
          }
          log.debug(`Config content for ${teamName}: ${configContent.substring(0, 100)}...`);
          config = JSON.parse(configContent);
          writeFileSync(backupPath, JSON.stringify(config, null, 2));
        } catch (parseErr) {
          log.error(`Failed to parse config.json for team ${teamName}: ${parseErr}`);
          if (existsSync3(backupPath)) {
            log.info(`Attempting to restore from backup for ${teamName}`);
            try {
              const backupContent = readFileSync2(backupPath, "utf8");
              config = JSON.parse(backupContent);
              log.info(`Successfully restored config from backup for ${teamName}`);
              writeFileSync(configPath, JSON.stringify(config, null, 2));
              log.info(`Restored config.json for ${teamName}`);
            } catch (backupErr) {
              log.error(`Failed to restore from backup for ${teamName}: ${backupErr}`);
              return null;
            }
          } else {
            return null;
          }
        }
        const teamInstance = getDirectoryBirthTime(teamPath);
        const sourceProject = config.members && config.members.length > 0 ? extractProjectFromCwd(config.members[0].cwd) : void 0;
        const team = {
          name: teamName,
          displayName: config.name || teamName,
          status: "active",
          createdAt: new Date(config.createdAt || Date.now()).toISOString(),
          lastActivity: (/* @__PURE__ */ new Date()).toISOString(),
          messageCount: 0,
          unreadCount: 0,
          members: await this.extractMembers(teamName, config),
          config: {
            notificationEnabled: true
          },
          allowCrossTeamMessages: config.allowCrossTeamMessages || false,
          teamInstance
        };
        const existingTeam = await this.db.getTeam(teamName);
        const existingMemberCount = existingTeam?.members?.length || 0;
        await this.db.upsertTeam(team);
        const newMemberCount = team.members.length;
        log.debug(`Member count: existing=${existingMemberCount}, new=${newMemberCount}`);
        if (newMemberCount > existingMemberCount) {
          log.info(`New members discovered, broadcasting members_updated for ${teamName}`);
          this.broadcastMembersUpdated(teamName, team.members);
        }
        await this.syncTeamMessages(teamName, teamInstance, sourceProject);
        return team;
      }
      /**
       * Broadcast members_updated event to WebSocket clients
       */
      broadcastMembersUpdated(teamName, members) {
        const wsServer = this.fastify?.websocketServer;
        if (!wsServer || !wsServer.clients) {
          return;
        }
        const eventData = JSON.stringify({
          type: "members_updated",
          team: teamName,
          members
        });
        let sentCount = 0;
        wsServer.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(eventData);
            sentCount++;
          }
        });
        wsLog.debug(`Broadcasted members_updated (${teamName}) to ${sentCount} clients`);
      }
      /**
       * Extract members from config and discover from inboxes
       */
      async extractMembers(teamName, config) {
        const memberMap = /* @__PURE__ */ new Map();
        if (config.members && Array.isArray(config.members)) {
          for (const m of config.members) {
            const role = m.agentType || m.role || "default";
            const avatarKey = m.name || role;
            memberMap.set(m.name, {
              name: m.name,
              displayName: m.name,
              role,
              color: generateAvatarColor(avatarKey),
              avatarLetter: extractAvatarLetter(avatarKey),
              isOnline: m.isActive !== false
            });
          }
        }
        const inboxesPath = join3(this.claudeTeamsPath, teamName, "inboxes");
        if (existsSync3(inboxesPath)) {
          const { readdir: readdir3 } = await import("fs/promises");
          const files = await readdir3(inboxesPath);
          const inboxFiles = files.filter((f) => f.endsWith(".json"));
          for (const file of inboxFiles) {
            const memberName = file.replace(".json", "");
            if (!memberMap.has(memberName)) {
              memberMap.set(memberName, {
                name: memberName,
                displayName: memberName,
                role: "discovered",
                color: generateAvatarColor(memberName),
                avatarLetter: extractAvatarLetter(memberName),
                isOnline: true
              });
              log.info(`Discovered new member from inbox: ${memberName}`);
            }
          }
        }
        memberMap.set("user", {
          name: "user",
          displayName: "User",
          role: "user",
          color: generateAvatarColor("user"),
          avatarLetter: extractAvatarLetter("user"),
          isOnline: true
        });
        return Array.from(memberMap.values());
      }
      /**
       * Sync messages from all inboxes
       */
      async syncTeamMessages(teamName, teamInstance, sourceProject) {
        const inboxesPath = join3(this.claudeTeamsPath, teamName, "inboxes");
        if (!existsSync3(inboxesPath)) {
          return 0;
        }
        const { readdir: readdir3 } = await import("fs/promises");
        const files = await readdir3(inboxesPath);
        const inboxFiles = files.filter((f) => f.endsWith(".json"));
        let totalSynced = 0;
        for (const file of inboxFiles) {
          const member = file.replace(".json", "");
          const count = await this.syncInbox(teamName, member, teamInstance, sourceProject);
          totalSynced += count;
        }
        return totalSynced;
      }
      /**
       * Sync a single inbox file
       */
      async syncInbox(teamName, member, teamInstance, sourceProject) {
        const inboxPath = join3(this.claudeTeamsPath, teamName, "inboxes", `${member}.json`);
        if (!existsSync3(inboxPath)) {
          log.debug(`Inbox not found: ${inboxPath}`);
          return 0;
        }
        try {
          const messages = JSON.parse(readFileSync2(inboxPath, "utf8"));
          log.debug(`Loading ${messages.length} messages from ${member}.json`);
          if (!Array.isArray(messages)) {
            log.warn(`Messages is not an array for ${member}`);
            return 0;
          }
          let synced = 0;
          const newMessages = [];
          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            try {
              const message = this.convertToMessage(teamName, member, i, msg, teamInstance, sourceProject);
              log.trace(`Processing message ${i} from ${member}: id=${message.id}, from=${message.from}`);
              const inserted = await this.db.insertMessageIfNew(message);
              if (inserted) {
                synced++;
                newMessages.push(message);
              }
            } catch (insertErr) {
              log.error(`Error inserting message ${i} from ${member}: ${insertErr}`);
            }
          }
          if (newMessages.length > 0) {
            log.debug(`Broadcasting ${newMessages.length} new messages`);
            this.broadcastNewMessages(teamName, newMessages);
          }
          log.debug(`Synced ${synced}/${messages.length} messages from ${member}`);
          return synced;
        } catch (err) {
          log.error(`Error syncing inbox ${member}: ${err}`);
          return 0;
        }
      }
      /**
       * Convert Claude message format to our format
       */
      convertToMessage(team, inbox, index, msg, teamInstance, sourceProject) {
        const isStructured = typeof msg.text === "string" && (msg.text.startsWith("{") || msg.text.startsWith("["));
        let content = msg.text || msg.message || "";
        let contentType = "text";
        if (isStructured) {
          try {
            const parsed = JSON.parse(msg.text);
            if (parsed.type === "task_assignment") {
              contentType = "task";
              content = parsed.subject || parsed.description || content;
            }
          } catch {
          }
        }
        const actualFrom = msg.from || inbox;
        const actualTo = actualFrom !== inbox ? inbox : null;
        const stableId = msg._originalId || (msg.timestamp ? `${team}-${inbox}-${index}-${new Date(msg.timestamp).getTime()}` : `${team}-${inbox}-${index}`);
        return {
          id: stableId,
          localId: `${team}-${inbox}-${index}`,
          team,
          from: actualFrom,
          fromType: actualFrom === "user" ? "user" : "agent",
          to: actualTo,
          content,
          contentType,
          timestamp: msg.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
          claudeRef: {
            team,
            inboxFile: `${inbox}.json`,
            messageIndex: index,
            timestamp: msg.timestamp || (/* @__PURE__ */ new Date()).toISOString()
          },
          metadata: msg.summary ? { taskId: msg.summary } : void 0,
          teamInstance,
          sourceProject
        };
      }
      /**
       * Broadcast new messages to all WebSocket clients
       */
      broadcastNewMessages(teamName, messages) {
        const wsServer = this.fastify?.websocketServer;
        if (!wsServer || !wsServer.clients) {
          wsLog.warn("WebSocket server not available for broadcast");
          return;
        }
        log.debug(`Broadcasting ${messages.length} messages to ${wsServer.clients.size} clients`);
        for (const message of messages) {
          const broadcastData = JSON.stringify({ type: "new_message", team: teamName, message });
          let sentCount = 0;
          wsServer.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(broadcastData);
              sentCount++;
            }
          });
          wsLog.trace(`Broadcasted synced message to ${sentCount} clients`);
        }
      }
      /**
       * Send a message from user
       */
      async sendMessage(teamName, to, content, contentType = "text") {
        const team = await this.db.getTeam(teamName);
        const teamInstance = team?.teamInstance;
        const message = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          team: teamName,
          from: "user",
          fromType: "user",
          to,
          content,
          contentType,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          teamInstance
        };
        this.db.insertMessage({ ...message, team: teamName });
        this.db.updateTeamActivity(teamName, message.timestamp);
        await this.writeToClaudeInbox(teamName, to || "team-lead", message);
        const wsServer = this.fastify?.websocketServer;
        if (wsServer && wsServer.clients) {
          const broadcastData = JSON.stringify({ type: "new_message", team: teamName, message });
          let sentCount = 0;
          wsServer.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(broadcastData);
              sentCount++;
            }
          });
          wsLog.debug(`Broadcasted message to ${sentCount} clients`);
        } else {
          wsLog.warn("No WebSocket server available for broadcast");
        }
        return message;
      }
      /**
       * Send a cross-team message to another team
       */
      async sendCrossTeamMessage(fromTeam, toTeam, content, contentType = "text") {
        const targetTeam = await this.db.getTeam(toTeam);
        if (!targetTeam) {
          return { success: false, error: "Target team not found" };
        }
        if (!targetTeam.allowCrossTeamMessages) {
          return { success: false, error: "Cross-team messaging is disabled for target team" };
        }
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const sourceMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          team: fromTeam,
          from: "user",
          fromType: "user",
          to: `team:${toTeam}`,
          content,
          contentType,
          timestamp,
          originalTeam: fromTeam
        };
        const targetMessage = {
          ...sourceMessage,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Different ID for target
          localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          to: null,
          // In target team, it's a regular message
          originalTeam: fromTeam
        };
        this.db.insertMessage({ ...sourceMessage, team: fromTeam });
        this.db.updateTeamActivity(fromTeam, timestamp);
        this.db.insertMessage({ ...targetMessage, team: toTeam });
        this.db.updateTeamActivity(toTeam, timestamp);
        const wsServer = this.fastify?.websocketServer;
        if (wsServer && wsServer.clients) {
          const confirmData = JSON.stringify({
            type: "cross_team_message_sent",
            team: fromTeam,
            message: sourceMessage,
            targetTeam: toTeam
          });
          wsServer.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(confirmData);
            }
          });
          const broadcastData = JSON.stringify({
            type: "cross_team_message",
            team: toTeam,
            message: targetMessage,
            originalTeam: fromTeam
          });
          let sentCount = 0;
          wsServer.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(broadcastData);
              sentCount++;
            }
          });
          wsLog.debug(`Broadcasted cross-team message to ${sentCount} clients in target team ${toTeam}`);
        }
        return { success: true, message: sourceMessage };
      }
      /**
       * Write message to Claude's inbox file
       */
      async writeToClaudeInbox(teamName, member, message) {
        const inboxesDir = join3(this.claudeTeamsPath, teamName, "inboxes");
        const inboxPath = join3(inboxesDir, `${member}.json`);
        if (!existsSync3(inboxesDir)) {
          mkdirSync3(inboxesDir, { recursive: true });
        }
        let messages = [];
        if (existsSync3(inboxPath)) {
          try {
            const content = readFileSync2(inboxPath, "utf8");
            messages = JSON.parse(content);
            if (!Array.isArray(messages)) {
              messages = [];
            }
          } catch (err) {
            log.warn(`Error reading inbox ${member}, creating new: ${err}`);
            messages = [];
          }
        }
        try {
          messages.push({
            from: "user",
            text: message.content,
            summary: `Message from user`,
            timestamp: message.timestamp,
            read: false,
            _originalId: message.id
          });
          writeFileSync(inboxPath, JSON.stringify(messages, null, 2));
          log.debug(`Wrote message to inbox: ${member}`);
        } catch (err) {
          log.error(`Error writing to inbox ${member}: ${err}`);
        }
      }
      /**
       * Handle team deletion (archive)
       */
      async handleTeamDeleted(teamName) {
        const archivedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.db.updateTeamStatus(teamName, "archived", archivedAt);
        await this.archiveTeamData(teamName);
        const wsServer = this.fastify?.websocketServer;
        if (wsServer && wsServer.clients) {
          const broadcastData = JSON.stringify({ type: "team_archived", team: teamName });
          wsServer.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(broadcastData);
            }
          });
        }
      }
      /**
       * Archive team data
       */
      async archiveTeamData(teamName) {
        const archiveDir = join3(this.dataDir, "archive", `${teamName}-${Date.now()}`);
        if (!existsSync3(archiveDir)) {
          mkdirSync3(archiveDir, { recursive: true });
        }
        try {
          const team = await this.db.getTeam(teamName);
          if (team) {
            const messages = await this.db.getMessages(teamName, { limit: 1e5 });
            const teamData = {
              name: team.name,
              displayName: team.displayName,
              members: team.members,
              config: team.config,
              createdAt: team.createdAt,
              archivedAt: team.archivedAt,
              messageCount: messages.length
            };
            writeFileSync(join3(archiveDir, "team.json"), JSON.stringify(teamData, null, 2));
            writeFileSync(join3(archiveDir, "messages.json"), JSON.stringify(messages, null, 2));
            log.info(`Archived team ${teamName} to ${archiveDir} (${messages.length} messages)`);
          } else {
            log.warn(`Team ${teamName} not found in database, creating empty archive`);
          }
        } catch (err) {
          log.error(`Error archiving team ${teamName}: ${err}`);
        }
        this.cleanupEmptyArchiveDirs();
      }
      /**
       * Clean up empty archive directories
       */
      cleanupEmptyArchiveDirs() {
        const archiveBase = join3(this.dataDir, "archive");
        if (!existsSync3(archiveBase)) {
          return;
        }
        try {
          const entries = readdirSync2(archiveBase, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const dirPath = join3(archiveBase, entry.name);
              const contents = readdirSync2(dirPath);
              if (contents.length === 0) {
                rmSync(dirPath, { recursive: true });
                log.info(`Removed empty archive directory: ${entry.name}`);
              }
            }
          }
        } catch (err) {
          log.error(`Error cleaning up empty archive directories: ${err}`);
        }
      }
    };
  }
});

// src/server/services/file-watcher.ts
import { watch } from "chokidar";
import { join as join4, basename } from "path";
import { readFileSync as readFileSync3, existsSync as existsSync4 } from "fs";
var log2, wsLog2, FileWatcherService;
var init_file_watcher = __esm({
  "src/server/services/file-watcher.ts"() {
    "use strict";
    init_file_stats();
    init_log_factory();
    log2 = createLogger({ module: "FileWatcher", shorthand: "s.s.file-watcher" });
    wsLog2 = createLogger({ module: "WebSocket", shorthand: "s.ws" });
    FileWatcherService = class {
      watchers = /* @__PURE__ */ new Map();
      teamInstances = /* @__PURE__ */ new Map();
      // Track current instance ID for each team
      claudeTeamsPath;
      dataSync;
      fastify;
      onMemberActivity;
      constructor(options) {
        this.claudeTeamsPath = options.claudeTeamsPath;
        this.dataSync = options.dataSync;
        this.fastify = options.fastify;
        this.onMemberActivity = options.onMemberActivity;
      }
      /**
       * Start watching all team directories
       */
      async start() {
        if (!this.claudeTeamsPath) {
          log2.warn("No Claude teams path configured");
          return;
        }
        const teamsWatcher = watch(this.claudeTeamsPath, {
          persistent: true,
          ignoreInitial: true,
          depth: 0
        });
        teamsWatcher.on("addDir", async (path) => {
          const teamName = basename(path);
          if (teamName && !teamName.startsWith(".")) {
            log2.info(`New team detected: ${teamName}`);
            await new Promise((resolve2) => setTimeout(resolve2, 200));
            const team = await this.dataSync.syncTeam(teamName);
            if (team) {
              this.watchTeam(teamName);
              this.broadcastTeamAdded(team);
            }
          }
        });
        teamsWatcher.on("unlinkDir", (path) => {
          const teamName = basename(path);
          if (teamName) {
            log2.info(`Team deleted: ${teamName}`);
            this.unwatchTeam(teamName);
            this.dataSync.handleTeamDeleted(teamName);
          }
        });
        this.watchers.set("__teams__", teamsWatcher);
        const { readdir: readdir3 } = await import("fs/promises");
        try {
          const entries = await readdir3(this.claudeTeamsPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith(".")) {
              this.watchTeam(entry.name);
            }
          }
        } catch {
        }
        log2.info("Started watching");
      }
      /**
       * Watch a specific team's inboxes
       */
      watchTeam(teamName) {
        if (this.watchers.has(teamName)) {
          return;
        }
        const teamPath = join4(this.claudeTeamsPath, teamName);
        const inboxesPath = join4(teamPath, "inboxes");
        const currentInstance = getDirectoryBirthTime(teamPath);
        const oldInstance = this.teamInstances.get(teamName);
        if (oldInstance && oldInstance !== currentInstance) {
          log2.info(`Team instance changed: ${teamName} (${oldInstance} -> ${currentInstance})`);
          let sourceProject;
          const configPath = join4(teamPath, "config.json");
          if (existsSync4(configPath)) {
            try {
              const config = JSON.parse(readFileSync3(configPath, "utf8"));
              if (config.members && config.members.length > 0) {
                sourceProject = extractProjectFromCwd(config.members[0].cwd);
              }
            } catch (err) {
              log2.error(`Error reading team config: ${err}`);
            }
          }
          this.broadcastTeamInstanceChanged(teamName, oldInstance, currentInstance, sourceProject || "unknown");
        }
        this.teamInstances.set(teamName, currentInstance);
        if (!existsSync4(inboxesPath)) {
          log2.debug(`Inbox directory does not exist yet for ${teamName}, watching team directory for inbox creation`);
          const teamDirWatcher = watch(teamPath, {
            persistent: true,
            ignoreInitial: true,
            depth: 0
          });
          teamDirWatcher.on("addDir", async (newDirPath) => {
            const dirName = basename(newDirPath);
            if (dirName === "inboxes") {
              log2.info(`Inboxes directory created for ${teamName}, setting up inbox watcher`);
              teamDirWatcher.close();
              this.watchers.delete(`${teamName}_dir`);
              this.watchTeam(teamName);
            }
          });
          this.watchers.set(`${teamName}_dir`, teamDirWatcher);
          return;
        }
        let watcher;
        try {
          watcher = watch(`${inboxesPath}/*.json`, {
            persistent: true,
            ignoreInitial: true
          });
        } catch (err) {
          log2.error(`Failed to create watcher for ${teamName}: ${err}`);
          return;
        }
        watcher.on("change", async (filePath) => {
          const fileName = basename(filePath);
          const member = fileName.replace(".json", "");
          log2.debug(`Inbox changed: ${teamName}/${member}`);
          try {
            await this.dataSync.syncTeam(teamName);
            log2.trace(`syncTeam completed for ${teamName}`);
          } catch (err) {
            log2.error(`syncTeam failed for ${teamName}: ${err}`);
          }
          let messageType;
          try {
            const inboxPath = join4(this.claudeTeamsPath, teamName, "inboxes", fileName);
            const content = readFileSync3(inboxPath, "utf-8");
            const messages = JSON.parse(content);
            if (Array.isArray(messages) && messages.length > 0) {
              const latestMessage = messages[messages.length - 1];
              if (latestMessage.text) {
                try {
                  const parsed = JSON.parse(latestMessage.text);
                  messageType = parsed.type;
                } catch {
                }
              }
              if (!messageType && latestMessage.type) {
                messageType = latestMessage.type;
              }
            }
          } catch (err) {
            log2.error(`Error reading inbox: ${err}`);
          }
          if (this.onMemberActivity) {
            this.onMemberActivity(teamName, member, messageType);
          }
        });
        this.watchers.set(teamName, watcher);
      }
      /**
       * Stop watching a team
       */
      unwatchTeam(teamName) {
        const watcher = this.watchers.get(teamName);
        if (watcher) {
          watcher.close();
          this.watchers.delete(teamName);
        }
        this.teamInstances.delete(teamName);
      }
      /**
       * Broadcast team_instance_changed event to WebSocket clients
       */
      broadcastTeamInstanceChanged(teamName, oldInstance, newInstance, sourceProject) {
        const wsServer = this.fastify.websocketServer;
        if (!wsServer || !wsServer.clients) {
          return;
        }
        const eventData = JSON.stringify({
          type: "team_instance_changed",
          team: teamName,
          oldInstance,
          newInstance,
          sourceProject
        });
        let sentCount = 0;
        wsServer.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(eventData);
            sentCount++;
          }
        });
        wsLog2.debug(`Broadcasted team_instance_changed to ${sentCount} clients`);
      }
      /**
       * Broadcast team_added event to WebSocket clients
       */
      broadcastTeamAdded(team) {
        const wsServer = this.fastify.websocketServer;
        if (!wsServer || !wsServer.clients) {
          return;
        }
        const eventData = JSON.stringify({
          type: "team_added",
          team
        });
        let sentCount = 0;
        wsServer.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(eventData);
            sentCount++;
          }
        });
        wsLog2.debug(`Broadcasted team_added (${team.name}) to ${sentCount} clients`);
      }
      /**
       * Stop all watchers
       */
      stop() {
        for (const [name, watcher] of this.watchers) {
          watcher.close();
          log2.debug(`Stopped watching: ${name}`);
        }
        this.watchers.clear();
      }
    };
  }
});

// src/server/services/cleanup.ts
import { schedule } from "node-cron";
import { subDays, formatISO } from "date-fns";
var log3, CleanupService;
var init_cleanup = __esm({
  "src/server/services/cleanup.ts"() {
    "use strict";
    init_log_factory();
    log3 = createLogger({ module: "Cleanup", shorthand: "s.s.cleanup" });
    CleanupService = class {
      db;
      config;
      scheduledTask;
      constructor(db, config) {
        this.db = db;
        this.config = config;
      }
      /**
       * Schedule cleanup task
       */
      schedule() {
        if (!this.config.cleanupEnabled) {
          log3.info("Cleanup is disabled");
          return;
        }
        const [hour, minute] = this.config.cleanupTime.split(":");
        const cronExpr = `${minute} ${hour} * * *`;
        this.scheduledTask = schedule(cronExpr, () => {
          this.runCleanup();
        });
        log3.info(`Scheduled daily at ${this.config.cleanupTime}`);
      }
      /**
       * Stop scheduled task
       */
      stop() {
        if (this.scheduledTask) {
          this.scheduledTask.stop();
          this.scheduledTask = null;
        }
      }
      /**
       * Update config and reschedule if needed
       */
      updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        if (oldConfig.cleanupTime !== this.config.cleanupTime || oldConfig.cleanupEnabled !== this.config.cleanupEnabled) {
          this.stop();
          this.schedule();
          log3.info("Config updated and rescheduled");
        }
      }
      /**
       * Run cleanup immediately
       */
      async runCleanup() {
        log3.info("Running cleanup task...");
        const startTime = Date.now();
        const results = {
          deleted: 0,
          archived: 0
        };
        try {
          const msgDeleted = await this.cleanupActiveTeams();
          results.deleted += msgDeleted;
          const teamsArchived = await this.cleanupArchivedTeams();
          results.archived += teamsArchived;
          await this.cleanupOrphanAttachments();
        } catch (err) {
          log3.error(`Error during cleanup: ${err}`);
        }
        const duration = Date.now() - startTime;
        log3.info(`Completed in ${duration}ms. Deleted: ${results.deleted}, Archived: ${results.archived}`);
        return results;
      }
      /**
       * Clean up old messages from active teams
       */
      async cleanupActiveTeams() {
        const cutoff = subDays(/* @__PURE__ */ new Date(), this.config.retentionDays);
        const cutoffStr = formatISO(cutoff);
        const deleted = await this.db.deleteOldMessages(cutoffStr);
        if (deleted > 0) {
          log3.info(`Deleted ${deleted} old messages from active teams`);
        }
        return deleted;
      }
      /**
       * Clean up archived teams
       */
      async cleanupArchivedTeams() {
        const teams = await this.db.getArchivedTeams();
        let archived = 0;
        for (const team of teams) {
          const expireAt = subDays(/* @__PURE__ */ new Date(), -this.config.retentionDays);
          if (/* @__PURE__ */ new Date() > expireAt) {
            await this.permanentlyDeleteTeam(team.name);
            archived++;
          }
        }
        if (archived > 0) {
          log3.info(`Permanently deleted ${archived} archived teams`);
        }
        return archived;
      }
      /**
       * Permanently delete a team and its data
       */
      async permanentlyDeleteTeam(teamName) {
        await this.db.deleteTeam(teamName);
        log3.info(`Permanently deleted team: ${teamName}`);
      }
      /**
       * Clean up orphan attachments
       */
      async cleanupOrphanAttachments() {
        log3.debug("Orphan attachment cleanup not implemented");
      }
    };
  }
});

// src/shared/constants.ts
var DEFAULT_CONFIG, MAX_FILE_SIZE, MAX_INLINE_IMAGE_SIZE, CLEANUP_INTERVAL_MS;
var init_constants = __esm({
  "src/shared/constants.ts"() {
    "use strict";
    DEFAULT_CONFIG = {
      port: 4558,
      host: "0.0.0.0",
      clientPort: 4559,
      clientHost: "0.0.0.0",
      dataDir: "~/.claude-chat",
      teamsPath: "~/.claude/teams",
      retentionDays: 90,
      theme: "auto",
      desktopNotifications: true,
      soundEnabled: false,
      cleanupEnabled: true,
      cleanupTime: "02:00",
      logConfig: {
        enabled: true,
        level: "info",
        maxSize: 10,
        // 10MB
        maxDays: 7
        // 7 days
      }
    };
    MAX_FILE_SIZE = 10 * 1024 * 1024;
    MAX_INLINE_IMAGE_SIZE = 500 * 1024;
    CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1e3;
  }
});

// src/server/services/config.ts
import { watch as watch2 } from "chokidar";
import { readFileSync as readFileSync4, writeFileSync as writeFileSync2, existsSync as existsSync5 } from "fs";
import { homedir as homedir2 } from "os";
import { join as join5 } from "path";
function expandHomeDir2(path) {
  if (path.startsWith("~/") || path === "~") {
    return join5(homedir2(), path.slice(1));
  }
  return path;
}
var log4, RESTART_REQUIRED_KEYS, RUNTIME_CONFIG_KEYS, ConfigService;
var init_config = __esm({
  "src/server/services/config.ts"() {
    "use strict";
    init_constants();
    init_log_factory();
    log4 = createLogger({ module: "ConfigService", shorthand: "s.s.config" });
    RESTART_REQUIRED_KEYS = ["port", "host", "dataDir", "teamsPath"];
    RUNTIME_CONFIG_KEYS = ["retentionDays", "theme", "desktopNotifications", "soundEnabled", "cleanupEnabled", "cleanupTime"];
    ConfigService = class {
      config;
      configPath;
      watcher = null;
      writeTimeout = null;
      pendingChanges = [];
      onChangeCallback;
      isWriting = false;
      // Prevent callback loops after file writes
      constructor(configPath, initialConfig) {
        this.configPath = configPath;
        this.config = initialConfig || this.loadConfig();
      }
      loadConfig() {
        let config = { ...DEFAULT_CONFIG };
        let hasMissingFields = false;
        try {
          if (existsSync5(this.configPath)) {
            const raw = readFileSync4(this.configPath, "utf8");
            const fileConfig = JSON.parse(raw);
            config = { ...DEFAULT_CONFIG, ...fileConfig };
            for (const key of Object.keys(DEFAULT_CONFIG)) {
              if (!(key in fileConfig)) {
                hasMissingFields = true;
                log4.warn(`Missing field '${String(key)}' in config file, will add with default value`);
              }
            }
          } else {
            hasMissingFields = true;
            log4.warn(`Config file not found at ${this.configPath}, will create with defaults`);
          }
        } catch (err) {
          log4.warn(`Failed to load config from ${this.configPath}: ${err}`);
          hasMissingFields = true;
        }
        if (hasMissingFields) {
          try {
            this.isWriting = true;
            writeFileSync2(this.configPath, JSON.stringify(config, null, 2));
            setTimeout(() => {
              this.isWriting = false;
            }, 100);
            log4.info("Config file updated with default values");
          } catch (err) {
            this.isWriting = false;
            log4.error(`Failed to write default config: ${err}`);
          }
        }
        config.dataDir = expandHomeDir2(config.dataDir);
        config.teamsPath = expandHomeDir2(config.teamsPath);
        return config;
      }
      startWatching(onChange) {
        this.onChangeCallback = onChange;
        this.watcher = watch2(this.configPath, {
          persistent: true,
          ignoreInitial: true
        });
        this.watcher.on("change", () => {
          if (this.isWriting) {
            this.isWriting = false;
            return;
          }
          const newConfig = this.loadConfig();
          const changes = this.detectChanges(this.config, newConfig);
          if (changes.length > 0) {
            this.config = newConfig;
            this.trackPendingChanges(changes);
            this.onChangeCallback?.(changes);
          }
        });
        log4.info("Started watching config file");
      }
      stopWatching() {
        this.watcher?.close();
        this.watcher = null;
        log4.debug("Stopped watching config file");
      }
      getConfig() {
        return { ...this.config };
      }
      updateConfig(updates) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...updates };
        const changes = this.detectChanges(oldConfig, this.config);
        if (changes.length > 0) {
          this.trackPendingChanges(changes);
          this.onChangeCallback?.(changes);
        }
        this.writeDebounced();
        return changes;
      }
      detectChanges(oldConfig, newConfig) {
        const changes = [];
        const allKeys = [...RESTART_REQUIRED_KEYS, ...RUNTIME_CONFIG_KEYS];
        for (const key of allKeys) {
          if (oldConfig[key] !== newConfig[key]) {
            changes.push({
              key,
              oldValue: oldConfig[key],
              newValue: newConfig[key],
              requiresRestart: this.isRestartRequired(String(key))
            });
          }
        }
        return changes;
      }
      isRestartRequired(key) {
        return RESTART_REQUIRED_KEYS.includes(key);
      }
      trackPendingChanges(changes) {
        for (const change of changes) {
          const existing = this.pendingChanges.findIndex((c) => c.key === change.key);
          if (existing >= 0) {
            this.pendingChanges[existing] = change;
          } else {
            this.pendingChanges.push(change);
          }
        }
      }
      writeDebounced() {
        if (this.writeTimeout) {
          clearTimeout(this.writeTimeout);
        }
        this.writeTimeout = setTimeout(() => {
          try {
            this.isWriting = true;
            writeFileSync2(this.configPath, JSON.stringify(this.config, null, 2));
            setTimeout(() => {
              this.isWriting = false;
            }, 100);
          } catch (err) {
            this.isWriting = false;
            log4.error(`Failed to write config: ${err}`);
          }
        }, 300);
      }
      needsRestart() {
        return this.pendingChanges.some((c) => c.requiresRestart);
      }
      getPendingChanges() {
        return [...this.pendingChanges];
      }
      clearPendingChanges() {
        this.pendingChanges = [];
      }
    };
  }
});

// src/server/services/member-status.ts
var BUSY_TIMEOUT_MS, IDLE_TIMEOUT_MS, INIT_GRACE_PERIOD_MS, MemberStatusService;
var init_member_status = __esm({
  "src/server/services/member-status.ts"() {
    "use strict";
    BUSY_TIMEOUT_MS = 5 * 60 * 1e3;
    IDLE_TIMEOUT_MS = 30 * 60 * 1e3;
    INIT_GRACE_PERIOD_MS = 2e3;
    MemberStatusService = class {
      // Map<teamName, Map<memberName, MemberState>>
      stateMap = /* @__PURE__ */ new Map();
      /**
       * Mark member as busy (they sent a message)
       */
      markBusy(teamName, memberName) {
        const now = Date.now();
        this.setMemberState(teamName, memberName, "busy", now);
      }
      /**
       * Mark member as idle (they sent idle_notification)
       */
      markIdle(teamName, memberName) {
        const now = Date.now();
        this.setMemberState(teamName, memberName, "idle", now);
      }
      /**
       * Initialize a member as offline (for team join)
       * Only initializes if the member doesn't exist yet - won't overwrite existing state
       */
      initMemberOffline(teamName, memberName) {
        const now = Date.now();
        if (!this.stateMap.has(teamName)) {
          this.stateMap.set(teamName, /* @__PURE__ */ new Map());
        }
        const teamMap = this.stateMap.get(teamName);
        if (teamMap.has(memberName)) {
          return;
        }
        teamMap.set(memberName, {
          lastActivityAt: now,
          statusChangedAt: now - IDLE_TIMEOUT_MS - 1e3,
          // Old enough to be immediately offline
          currentStatus: "offline",
          initializedAt: now
        });
      }
      /**
       * Set member state
       */
      setMemberState(teamName, memberName, status, timestamp) {
        if (!this.stateMap.has(teamName)) {
          this.stateMap.set(teamName, /* @__PURE__ */ new Map());
        }
        const teamMap = this.stateMap.get(teamName);
        const existing = teamMap.get(memberName);
        teamMap.set(memberName, {
          lastActivityAt: timestamp,
          statusChangedAt: timestamp,
          currentStatus: status,
          initializedAt: existing?.initializedAt || timestamp
        });
      }
      /**
       * Get member statuses for a team (with computed status based on time)
       */
      getMemberStatuses(teamName) {
        const teamMap = this.stateMap.get(teamName);
        if (!teamMap) {
          return [];
        }
        const now = Date.now();
        const statuses = [];
        teamMap.forEach((state, memberName) => {
          const computedStatus = this.computeStatus(state, now);
          statuses.push({
            memberName,
            status: computedStatus,
            lastActivityAt: state.lastActivityAt,
            statusChangedAt: state.statusChangedAt
          });
        });
        const sortOrder = { busy: 0, occupied: 1, idle: 2, offline: 3 };
        statuses.sort((a, b) => {
          const orderDiff = sortOrder[a.status] - sortOrder[b.status];
          if (orderDiff !== 0) return orderDiff;
          return b.lastActivityAt - a.lastActivityAt;
        });
        return statuses;
      }
      /**
       * Compute actual status based on time elapsed
       */
      computeStatus(state, now) {
        const timeSinceActivity = now - state.lastActivityAt;
        const timeSinceStatusChange = now - state.statusChangedAt;
        const timeSinceInit = now - state.initializedAt;
        if (timeSinceInit < INIT_GRACE_PERIOD_MS) {
          return state.currentStatus;
        }
        if (timeSinceStatusChange >= IDLE_TIMEOUT_MS) {
          return "offline";
        }
        if (state.currentStatus === "busy" && timeSinceActivity >= BUSY_TIMEOUT_MS) {
          return "occupied";
        }
        if (state.currentStatus === "occupied" && timeSinceStatusChange >= 30 * 1e3) {
          return "idle";
        }
        if (state.currentStatus === "occupied" || state.currentStatus === "idle") {
          return state.currentStatus;
        }
        return state.currentStatus;
      }
      /**
       * Check if status should be updated (for periodic checks)
       * Returns members whose status needs to be recalculated
       */
      checkStatusUpdates(teamName) {
        const teamMap = this.stateMap.get(teamName);
        if (!teamMap) {
          return [];
        }
        const now = Date.now();
        const membersToUpdate = [];
        teamMap.forEach((state, memberName) => {
          const computedStatus = this.computeStatus(state, now);
          if (computedStatus !== state.currentStatus) {
            membersToUpdate.push(memberName);
          }
        });
        return membersToUpdate;
      }
      /**
       * Update status for a member after transition
       */
      updateComputedStatus(teamName, memberName) {
        const teamMap = this.stateMap.get(teamName);
        if (!teamMap) return;
        const state = teamMap.get(memberName);
        if (!state) return;
        const now = Date.now();
        const newStatus = this.computeStatus(state, now);
        if (newStatus !== state.currentStatus) {
          state.currentStatus = newStatus;
          state.statusChangedAt = now;
        }
      }
      /**
       * Remove a member from tracking
       */
      removeMember(teamName, memberName) {
        const teamMap = this.stateMap.get(teamName);
        if (teamMap) {
          teamMap.delete(memberName);
        }
      }
      /**
       * Remove all members for a team
       */
      removeTeam(teamName) {
        this.stateMap.delete(teamName);
      }
      /**
       * Get all tracked teams
       */
      getTrackedTeams() {
        return Array.from(this.stateMap.keys());
      }
      /**
       * Periodic check - update statuses and return all current statuses
       * Call this every few seconds to recalculate occupied/offline states
       */
      tick(teamName) {
        const membersToUpdate = this.checkStatusUpdates(teamName);
        for (const memberName of membersToUpdate) {
          this.updateComputedStatus(teamName, memberName);
        }
        return this.getMemberStatuses(teamName);
      }
    };
  }
});

// src/server/services/task-storage.ts
import { readFile, writeFile, mkdir, unlink, readdir } from "fs/promises";
import { existsSync as existsSync6 } from "fs";
import { join as join6 } from "path";
import { homedir as homedir3 } from "os";
var log5, TASKS_BASE_DIR, MAX_HISTORY_ENTRIES, TaskStorageService;
var init_task_storage = __esm({
  "src/server/services/task-storage.ts"() {
    "use strict";
    init_log_factory();
    log5 = createLogger({ module: "TaskStorage", shorthand: "s.s.task-storage" });
    TASKS_BASE_DIR = join6(homedir3(), ".claude", "tasks");
    MAX_HISTORY_ENTRIES = 100;
    TaskStorageService = class {
      baseDir;
      constructor(options) {
        this.baseDir = options?.baseDir || TASKS_BASE_DIR;
      }
      /**
       * Get tasks directory path for a team
       */
      getTeamTasksDir(teamName) {
        return join6(this.baseDir, teamName);
      }
      /**
       * Get task file path
       */
      getTaskFilePath(teamName, taskId) {
        return join6(this.getTeamTasksDir(teamName), `${taskId}.json`);
      }
      /**
       * Ensure team tasks directory exists
       */
      async ensureTeamDir(teamName) {
        const teamDir = this.getTeamTasksDir(teamName);
        if (!existsSync6(teamDir)) {
          await mkdir(teamDir, { recursive: true });
        }
      }
      /**
       * Add history entry to task
       */
      addHistoryEntry(task, field, oldValue, newValue, changedBy) {
        if (!task.history) {
          task.history = [];
        }
        task.history.push({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          field,
          oldValue,
          newValue,
          changedBy
        });
        if (task.history.length > MAX_HISTORY_ENTRIES) {
          task.history = task.history.slice(-MAX_HISTORY_ENTRIES);
        }
      }
      /**
       * Read a task file
       */
      async readTaskFile(teamName, taskId) {
        const filePath = this.getTaskFilePath(teamName, taskId);
        if (!existsSync6(filePath)) {
          return null;
        }
        try {
          const content = await readFile(filePath, "utf-8");
          const task = JSON.parse(content);
          if (!task.id || !task.subject || !task.status) {
            log5.error(`Invalid task file ${taskId}: missing required fields`);
            return null;
          }
          return task;
        } catch (error) {
          log5.error(`Error reading task ${taskId}: ${error}`);
          return null;
        }
      }
      /**
       * Write a task file (atomic write)
       */
      async writeTaskFile(teamName, task) {
        try {
          await this.ensureTeamDir(teamName);
          const filePath = this.getTaskFilePath(teamName, task.id);
          const tempPath = `${filePath}.tmp`;
          await writeFile(tempPath, JSON.stringify(task, null, 2));
          const { rename } = await import("fs/promises");
          await rename(tempPath, filePath);
          log5.debug(`Wrote task ${task.id} for team ${teamName}`);
          return true;
        } catch (error) {
          log5.error(`Error writing task ${task.id}: ${error}`);
          return false;
        }
      }
      /**
       * Delete a task file (or mark as deleted)
       */
      async deleteTaskFile(teamName, taskId, softDelete = true) {
        const filePath = this.getTaskFilePath(teamName, taskId);
        if (!existsSync6(filePath)) {
          return false;
        }
        try {
          if (softDelete) {
            const task = await this.readTaskFile(teamName, taskId);
            if (task) {
              const oldStatus = task.status;
              task.status = "deleted";
              task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
              this.addHistoryEntry(task, "status", oldStatus, "deleted");
              await this.writeTaskFile(teamName, task);
            }
          } else {
            await unlink(filePath);
          }
          log5.info(`Deleted task ${taskId} (soft: ${softDelete})`);
          return true;
        } catch (error) {
          log5.error(`Error deleting task ${taskId}: ${error}`);
          return false;
        }
      }
      /**
       * Create a new task
       */
      async createTask(teamName, taskId, data) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const task = {
          id: taskId,
          subject: data.subject,
          description: data.description,
          status: data.status || "pending",
          owner: data.owner,
          blockedBy: data.blockedBy || [],
          activeForm: data.activeForm,
          metadata: data.metadata,
          history: [],
          createdAt: now,
          updatedAt: now
        };
        await this.writeTaskFile(teamName, task);
        return task;
      }
      /**
       * Update a task with history tracking
       */
      async updateTaskWithHistory(teamName, taskId, updates, changedBy) {
        const task = await this.readTaskFile(teamName, taskId);
        if (!task) {
          return null;
        }
        if (updates.status !== void 0 && updates.status !== task.status) {
          this.addHistoryEntry(task, "status", task.status, updates.status, changedBy);
        }
        if (updates.owner !== void 0 && updates.owner !== task.owner) {
          this.addHistoryEntry(task, "owner", task.owner || null, updates.owner, changedBy);
        }
        if (updates.subject !== void 0 && updates.subject !== task.subject) {
          this.addHistoryEntry(task, "subject", task.subject, updates.subject, changedBy);
        }
        if (updates.description !== void 0 && updates.description !== task.description) {
          this.addHistoryEntry(
            task,
            "description",
            task.description || null,
            updates.description,
            changedBy
          );
        }
        if (updates.subject !== void 0) task.subject = updates.subject;
        if (updates.description !== void 0) task.description = updates.description;
        if (updates.status !== void 0) task.status = updates.status;
        if (updates.owner !== void 0) task.owner = updates.owner;
        if (updates.blockedBy !== void 0) task.blockedBy = updates.blockedBy;
        if (updates.activeForm !== void 0) task.activeForm = updates.activeForm;
        if (updates.metadata !== void 0) task.metadata = updates.metadata;
        task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        await this.writeTaskFile(teamName, task);
        return task;
      }
      /**
       * Read all tasks for a team
       */
      async readAllTasks(teamName) {
        const teamDir = this.getTeamTasksDir(teamName);
        if (!existsSync6(teamDir)) {
          return [];
        }
        try {
          const files = await readdir(teamDir);
          const jsonFiles = files.filter((f) => f.endsWith(".json"));
          const tasks = [];
          for (const file of jsonFiles) {
            const taskId = file.replace(".json", "");
            const task = await this.readTaskFile(teamName, taskId);
            if (task) {
              tasks.push(task);
            }
          }
          tasks.sort((a, b) => {
            const numA = parseInt(a.id, 10);
            const numB = parseInt(b.id, 10);
            return numA - numB;
          });
          return tasks;
        } catch (error) {
          log5.error(`Error reading tasks for team ${teamName}: ${error}`);
          return [];
        }
      }
      /**
       * Read all tasks from all teams
       */
      async readAllTeamsTasks() {
        const result = /* @__PURE__ */ new Map();
        if (!existsSync6(this.baseDir)) {
          return result;
        }
        try {
          const teamDirs = await readdir(this.baseDir);
          for (const teamName of teamDirs) {
            const teamPath = join6(this.baseDir, teamName);
            if (existsSync6(teamPath) && await import("fs").then((fs) => fs.statSync(teamPath).isDirectory())) {
              const tasks = await this.readAllTasks(teamName);
              if (tasks.length > 0) {
                result.set(teamName, tasks);
              }
            }
          }
          return result;
        } catch (error) {
          log5.error(`Error reading all teams tasks: ${error}`);
          return result;
        }
      }
    };
  }
});

// src/server/services/session-summary.ts
import { writeFile as writeFile2, mkdir as mkdir2 } from "fs/promises";
import { existsSync as existsSync7 } from "fs";
import { join as join7 } from "path";
import { homedir as homedir4 } from "os";
var log6, SessionSummaryService;
var init_session_summary = __esm({
  "src/server/services/session-summary.ts"() {
    "use strict";
    init_task_storage();
    init_log_factory();
    log6 = createLogger({ module: "SessionSummary", shorthand: "s.s.session-summary" });
    SessionSummaryService = class {
      teamsPath;
      taskStorage;
      constructor(options) {
        this.teamsPath = options?.teamsPath || join7(homedir4(), ".claude", "teams");
        this.taskStorage = new TaskStorageService();
      }
      /**
       * Generate a session summary for a team
       */
      async generateSessionSummary(teamName) {
        const tasks = await this.taskStorage.readAllTasks(teamName);
        const stats = this.calculateStats(tasks);
        const markdown = this.generateMarkdown(teamName, tasks, stats);
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `session-summary-${timestamp}.md`;
        const filePath = join7(this.teamsPath, teamName, fileName);
        await this.ensureDir(join7(this.teamsPath, teamName));
        await writeFile2(filePath, markdown, "utf-8");
        log6.info(`Generated summary for team ${teamName}: ${fileName}`);
        return filePath;
      }
      /**
       * Calculate task statistics
       */
      calculateStats(tasks) {
        const stats = {
          total: tasks.length,
          completed: 0,
          inProgress: 0,
          pending: 0,
          deleted: 0
        };
        for (const task of tasks) {
          switch (task.status) {
            case "completed":
              stats.completed++;
              break;
            case "in_progress":
              stats.inProgress++;
              break;
            case "pending":
              stats.pending++;
              break;
            case "deleted":
              stats.deleted++;
              break;
          }
        }
        return stats;
      }
      /**
       * Generate Markdown content
       */
      generateMarkdown(teamName, tasks, stats) {
        const now = /* @__PURE__ */ new Date();
        const formattedDate = now.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
        const lines = [
          `# \u4F1A\u8BDD\u4EFB\u52A1\u6458\u8981 - ${teamName}`,
          "",
          `\u751F\u6210\u65F6\u95F4: ${formattedDate}`,
          "",
          "## \u4EFB\u52A1\u7EDF\u8BA1",
          "",
          `- \u603B\u4EFB\u52A1\u6570: ${stats.total}`,
          `- \u5DF2\u5B8C\u6210: ${stats.completed}`,
          `- \u8FDB\u884C\u4E2D: ${stats.inProgress}`,
          `- \u7B49\u5F85\u4E2D: ${stats.pending}`,
          ""
        ];
        const completedTasks = tasks.filter((t) => t.status === "completed");
        if (completedTasks.length > 0) {
          lines.push("## \u5DF2\u5B8C\u6210\u4EFB\u52A1");
          lines.push("");
          lines.push("| ID | \u4EFB\u52A1 | \u8D1F\u8D23\u4EBA |");
          lines.push("|----|------|--------|");
          for (const task of completedTasks) {
            const owner = task.owner || "-";
            lines.push(`| ${task.id} | ${this.escapeMarkdown(task.subject)} | ${owner} |`);
          }
          lines.push("");
        }
        const incompleteTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "deleted");
        if (incompleteTasks.length > 0) {
          lines.push("## \u672A\u5B8C\u6210\u4EFB\u52A1");
          lines.push("");
          lines.push("| ID | \u4EFB\u52A1 | \u72B6\u6001 | \u963B\u585E |");
          lines.push("|----|------|------|------|");
          for (const task of incompleteTasks) {
            const statusMap = {
              "pending": "\u7B49\u5F85\u4E2D",
              "in_progress": "\u8FDB\u884C\u4E2D",
              "completed": "\u5DF2\u5B8C\u6210",
              "deleted": "\u5DF2\u5220\u9664"
            };
            const status = statusMap[task.status] || task.status;
            const blockedBy = task.blockedBy && task.blockedBy.length > 0 ? task.blockedBy.map((id) => `#${id}`).join(", ") : "-";
            lines.push(`| ${task.id} | ${this.escapeMarkdown(task.subject)} | ${status} | ${blockedBy} |`);
          }
          lines.push("");
        }
        const tasksWithHistory = tasks.filter((t) => t.history && t.history.length > 0);
        if (tasksWithHistory.length > 0) {
          lines.push("## \u4EFB\u52A1\u53D8\u66F4\u5386\u53F2");
          lines.push("");
          for (const task of tasksWithHistory) {
            lines.push(`### \u4EFB\u52A1 #${task.id}: ${this.escapeMarkdown(task.subject)}`);
            lines.push("");
            if (task.history) {
              for (const entry of task.history) {
                const time = new Date(entry.timestamp).toLocaleString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                const fieldMap = {
                  "status": "\u72B6\u6001",
                  "owner": "\u8D1F\u8D23\u4EBA",
                  "subject": "\u6807\u9898",
                  "description": "\u63CF\u8FF0"
                };
                const field = fieldMap[entry.field] || entry.field;
                lines.push(`- ${time} ${field}: ${entry.oldValue || "\u7A7A"} \u2192 ${entry.newValue}`);
              }
            }
            lines.push("");
          }
        }
        return lines.join("\n");
      }
      /**
       * Escape special Markdown characters
       */
      escapeMarkdown(text) {
        return text.replace(/[|\\]/g, "\\$&");
      }
      /**
       * Ensure directory exists
       */
      async ensureDir(dir) {
        if (!existsSync7(dir)) {
          await mkdir2(dir, { recursive: true });
        }
      }
    };
  }
});

// src/server/services/session-reader.ts
import { join as join8 } from "path";
import { existsSync as existsSync8, readFileSync as readFileSync5, readdirSync as readdirSync3, openSync, readSync, closeSync, statSync as statSync3 } from "fs";
import { homedir as homedir5 } from "os";
function calculateProjectHash(cwd) {
  return "-" + cwd.replace(/[/\\]/g, "-").replace(/^-/, "");
}
var log7, SessionReaderService;
var init_session_reader = __esm({
  "src/server/services/session-reader.ts"() {
    "use strict";
    init_log_factory();
    log7 = createLogger({ module: "SessionReader", shorthand: "s.s.session-reader" });
    SessionReaderService = class {
      teamsPath;
      constructor(options) {
        this.teamsPath = options?.teamsPath || join8(homedir5(), ".claude", "teams");
      }
      /**
       * Get the registered session info for a member
       */
      getMemberSession(teamName, memberName) {
        const sessionFile = join8(this.teamsPath, teamName, "sessions", `${memberName}.json`);
        if (!existsSync8(sessionFile)) {
          return null;
        }
        try {
          const content = readFileSync5(sessionFile, "utf-8");
          return JSON.parse(content);
        } catch (err) {
          log7.error(`Error reading session file ${sessionFile}: ${err}`);
          return null;
        }
      }
      /**
       * Get the conversation history for a member
       * @param teamName - Team name
       * @param memberName - Member name
       * @param limit - Maximum number of messages to return (most recent)
       * @returns Conversation with messages, or null if session not found
       */
      getMemberConversation(teamName, memberName, limit = 50) {
        const sessionId = this.resolveSessionId(teamName, memberName);
        if (!sessionId) {
          log7.warn(`No session found for ${memberName}@${teamName}`);
          return {
            memberName,
            sessionId: null,
            messages: []
          };
        }
        const cwd = this.resolveCwd(teamName, memberName);
        if (!cwd) {
          log7.warn(`No cwd for ${memberName}@${teamName}`);
          return {
            memberName,
            sessionId,
            messages: []
          };
        }
        const projectHash = calculateProjectHash(cwd);
        const convFile = join8(homedir5(), ".claude", "projects", projectHash, `${sessionId}.jsonl`);
        if (!existsSync8(convFile)) {
          log7.warn(`Conversation file not found: ${convFile}`);
          return {
            memberName,
            sessionId,
            messages: []
          };
        }
        try {
          const content = readFileSync5(convFile, "utf-8");
          const messages = [];
          for (const line of content.split("\n")) {
            if (!line.trim()) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.type === "user") {
                const content_value = entry.message?.content;
                const contentStr = typeof content_value === "string" ? content_value : JSON.stringify(content_value);
                const parsed = this.parseUserContent(contentStr, entry.timestamp || "");
                messages.push(...parsed);
              } else if (entry.type === "assistant") {
                const content_value = entry.message?.content;
                const extracted = this.extractContentBlocks(content_value, entry.timestamp || "");
                messages.push(...extracted);
              }
            } catch {
            }
          }
          return {
            memberName,
            sessionId,
            messages: messages.slice(-limit)
          };
        } catch (err) {
          log7.error(`Error reading conversation file ${convFile}: ${err}`);
          return {
            memberName,
            sessionId,
            messages: []
          };
        }
      }
      /**
       * Resolve session ID using three-tier strategy:
       * 1. Registration file
       * 2. Team config leadSessionId (for team-lead)
       * 3. Jsonl scan fallback
       */
      resolveSessionId(teamName, memberName) {
        const session = this.getMemberSession(teamName, memberName);
        if (session?.sessionId) {
          return session.sessionId;
        }
        const configSessionId = this.getLeadSessionId(teamName);
        if (configSessionId && memberName === "team-lead") {
          return configSessionId;
        }
        const cwd = this.getCwdFromConfig(teamName, memberName);
        if (cwd) {
          const scannedId = this.findSessionByJsonlScan(teamName, memberName, cwd);
          if (scannedId) {
            return scannedId;
          }
        }
        return null;
      }
      /**
       * Resolve cwd for a member
       */
      resolveCwd(teamName, memberName) {
        const session = this.getMemberSession(teamName, memberName);
        if (session?.cwd) {
          return session.cwd;
        }
        return this.getCwdFromConfig(teamName, memberName);
      }
      /**
       * Get cwd from team config for a member
       */
      getCwdFromConfig(teamName, memberName) {
        const configFile = join8(this.teamsPath, teamName, "config.json");
        if (!existsSync8(configFile)) return null;
        try {
          const config = JSON.parse(readFileSync5(configFile, "utf-8"));
          const member = config.members?.find((m) => m.name === memberName);
          return member?.cwd || config.members?.[0]?.cwd || null;
        } catch {
          return null;
        }
      }
      /**
       * Get leadSessionId from team config
       */
      getLeadSessionId(teamName) {
        const configFile = join8(this.teamsPath, teamName, "config.json");
        if (!existsSync8(configFile)) return null;
        try {
          const config = JSON.parse(readFileSync5(configFile, "utf-8"));
          return config.leadSessionId || null;
        } catch {
          return null;
        }
      }
      /**
       * Find session ID by scanning jsonl files for matching teamName + agentName.
       * Only reads the first 4KB of each file for performance.
       * Returns the most recent matching session ID.
       */
      findSessionByJsonlScan(teamName, memberName, cwd) {
        const projectsDir = join8(homedir5(), ".claude", "projects");
        if (!existsSync8(projectsDir)) return null;
        const hash = calculateProjectHash(cwd);
        const projectDir = join8(projectsDir, hash);
        if (!existsSync8(projectDir)) return null;
        let bestMatch = null;
        let bestTime = 0;
        try {
          const files = readdirSync3(projectDir).filter((f) => f.endsWith(".jsonl"));
          for (const f of files) {
            try {
              const fd = openSync(join8(projectDir, f), "r");
              const buf = Buffer.alloc(16384);
              const bytesRead = readSync(fd, buf, 0, 16384, 0);
              closeSync(fd);
              const text = buf.toString("utf8", 0, bytesRead);
              const lines = text.split("\n");
              let matched = false;
              for (let i = 0; i < Math.min(lines.length, 20); i++) {
                const line = lines[i].trim();
                if (!line) continue;
                try {
                  const entry = JSON.parse(line);
                  if (entry.teamName === teamName && entry.agentName === memberName) {
                    matched = true;
                    break;
                  }
                } catch {
                }
              }
              if (matched) {
                const stat = statSync3(join8(projectDir, f));
                if (stat.mtimeMs > bestTime) {
                  bestMatch = f.replace(".jsonl", "");
                  bestTime = stat.mtimeMs;
                }
              }
            } catch {
            }
          }
        } catch (err) {
          log7.error(`Error scanning jsonl files in ${projectDir}: ${err}`);
        }
        if (bestMatch) {
          log7.info(`Jsonl scan found session ${bestMatch} for ${memberName}@${teamName}`);
        }
        return bestMatch;
      }
      /**
       * Parse user message content and handle special types:
       * - tool_result JSON arrays → extract result text
       * - <teammate-message> → extract actual message content
       * - <local-command-stdout>, <local-command-caveat>, <command-name> → filter out
       * - plain text → pass through
       */
      parseUserContent(content, timestamp) {
        const trimmed = content.replace(/^\s+/, "");
        if (trimmed.includes("<local-command-stdout") || trimmed.includes("<local-command-caveat") || trimmed.includes("<command-name") || trimmed.includes("<command-message")) {
          return [];
        }
        if (trimmed.includes("<teammate-message")) {
          return this.parseTeammateMessages(trimmed, timestamp);
        }
        if (trimmed.startsWith("[{") && trimmed.includes('"tool_use_id"') && trimmed.includes('"tool_result"')) {
          return this.parseToolResults(trimmed, timestamp);
        }
        if (trimmed.startsWith("[{") && trimmed.includes('"type":"text"') && trimmed.includes('"text"')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              const textContent = parsed.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("\n");
              if (textContent) {
                return [{ role: "user", type: "text", content: textContent, timestamp }];
              }
            }
          } catch {
          }
        }
        return [{ role: "user", type: "text", content, timestamp }];
      }
      /**
       * Parse <teammate-message> tags and extract content.
       * Handles both self-closing format and content format.
       */
      parseTeammateMessages(content, timestamp) {
        const results = [];
        const regex = /<teammate-message[^>]*teammate_id="([^"]*)"[^>]*>([\s\S]*?)<\/teammate-message>/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const senderName = match[1];
          let innerContent = match[2].trim();
          try {
            const parsed = JSON.parse(innerContent);
            if (parsed.type === "task_assignment") {
              const summary = parsed.subject || innerContent;
              results.push({
                role: "user",
                type: "text",
                content: `\u{1F4CB} \u4EFB\u52A1\u5206\u914D: ${summary}`,
                timestamp,
                senderName
              });
              continue;
            }
            if (parsed.type && typeof parsed.type === "string") {
              continue;
            }
          } catch {
          }
          const summaryMatch = content.match(/summary="([^"]*)"/);
          const summaryText = summaryMatch ? summaryMatch[1] : "";
          if (innerContent) {
            const cleaned = innerContent.replace(/📋\s*OpenSpec 变更[\s\S]*?(?=\n\n|$)/, "").replace(/🔧\s*开始前[\s\S]*?(?=\n\n|$)/, "").replace(/⚠️\s*注意事项[\s\S]*?(?=\n\n|完成后|$)/, "").replace(/完成后 TaskUpdate[\s\S]*$/, "").trim();
            if (cleaned) {
              results.push({
                role: "user",
                type: "text",
                content: summaryText ? `**${summaryText}**

${cleaned}` : cleaned,
                timestamp,
                senderName
              });
            } else if (summaryText) {
              results.push({
                role: "user",
                type: "text",
                content: summaryText,
                timestamp,
                senderName
              });
            }
          }
        }
        return results;
      }
      /**
       * Parse tool_result JSON arrays and extract readable content.
       * Input: [{"tool_use_id":"...", "type":"tool_result", "content":[{"type":"text","text":"..."}]}]
       */
      parseToolResults(content, timestamp) {
        try {
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) return [];
          const results = [];
          for (const item of parsed) {
            if (item.type !== "tool_result" || !item.content) continue;
            const textParts = [];
            const contentBlocks = Array.isArray(item.content) ? item.content : [item.content];
            for (const block of contentBlocks) {
              if (typeof block === "string") {
                textParts.push(block);
              } else if (block?.type === "text" && block.text) {
                let text = block.text;
                try {
                  const innerParsed = JSON.parse(text);
                  if (typeof innerParsed === "object" && innerParsed !== null) {
                    if (innerParsed.success !== void 0) {
                      const summary = innerParsed.message || (innerParsed.success ? "\u6210\u529F" : "\u5931\u8D25");
                      textParts.push(`**${summary}**`);
                      if (innerParsed.routing) {
                        const r = innerParsed.routing;
                        if (r.summary) textParts.push(`> ${r.summary}`);
                        if (r.content) textParts.push(r.content);
                      } else if (innerParsed.error) {
                        textParts.push(`\u9519\u8BEF: ${innerParsed.error}`);
                      } else {
                        textParts.push("```json\n" + JSON.stringify(innerParsed, null, 2) + "\n```");
                      }
                    } else {
                      textParts.push("```json\n" + JSON.stringify(innerParsed, null, 2) + "\n```");
                    }
                  } else {
                    textParts.push(String(innerParsed));
                  }
                } catch {
                  textParts.push(text);
                }
              }
            }
            if (textParts.length > 0) {
              results.push({
                role: "user",
                type: "tool_result",
                content: textParts.join("\n"),
                timestamp
              });
            }
          }
          return results;
        } catch {
          return [{ role: "user", type: "text", content, timestamp }];
        }
      }
      /**
       * Extract content blocks from assistant message content array.
       * Converts content blocks into separate ConversationMessage entries:
       * - text blocks → type: 'text'
       * - tool_use blocks → type: 'tool_use' with toolName and toolInput
       * - thinking blocks → type: 'thinking'
       */
      extractContentBlocks(content, timestamp) {
        if (!content) return [];
        if (typeof content === "string") {
          return [{ role: "assistant", type: "text", content, timestamp }];
        }
        if (!Array.isArray(content)) return [];
        const results = [];
        for (const block of content) {
          if (!block || typeof block !== "object") continue;
          switch (block.type) {
            case "text":
              if (block.text) {
                const cleanedText = block.text.replace(/<!--\s*NOTIFY[\s\S]*?-->/g, "").trim();
                if (cleanedText) {
                  results.push({
                    role: "assistant",
                    type: "text",
                    content: cleanedText,
                    timestamp
                  });
                }
              }
              break;
            case "tool_use":
              results.push({
                role: "assistant",
                type: "tool_use",
                content: block.name || "",
                timestamp,
                toolName: block.name,
                toolInput: block.input
              });
              break;
            case "thinking":
              if (block.thinking) {
                results.push({
                  role: "assistant",
                  type: "thinking",
                  content: block.thinking,
                  timestamp
                });
              }
              break;
          }
        }
        if (results.length === 0) {
          const text = typeof content === "string" ? content : "";
          if (text) {
            results.push({ role: "assistant", type: "text", content: text, timestamp });
          }
        }
        return results;
      }
      /**
       * List all registered sessions for a team
       */
      listMemberSessions(teamName) {
        const sessionsDir = join8(this.teamsPath, teamName, "sessions");
        if (!existsSync8(sessionsDir)) {
          return [];
        }
        try {
          const files = readdirSync3(sessionsDir).filter((f) => f.endsWith(".json"));
          const sessions = [];
          for (const file of files) {
            try {
              const content = readFileSync5(join8(sessionsDir, file), "utf-8");
              sessions.push(JSON.parse(content));
            } catch {
            }
          }
          return sessions;
        } catch (err) {
          log7.error(`Error listing sessions for team ${teamName}: ${err}`);
          return [];
        }
      }
    };
  }
});

// src/server/services/index.ts
var services_exports = {};
__export(services_exports, {
  CleanupService: () => CleanupService,
  ConfigService: () => ConfigService,
  DEFAULT_LOG_FACTORY_CONFIG: () => DEFAULT_LOG_FACTORY_CONFIG,
  DataSyncService: () => DataSyncService,
  FileWatcherService: () => FileWatcherService,
  MemberStatusService: () => MemberStatusService,
  SessionReaderService: () => SessionReaderService,
  SessionSummaryService: () => SessionSummaryService,
  TaskStorageService: () => TaskStorageService,
  closeLogFactory: () => closeLogFactory,
  createFastifyLogger: () => createFastifyLogger,
  createLogger: () => createLogger,
  getGlobalConfig: () => getGlobalConfig,
  initLogFactory: () => initLogFactory,
  updateLogConfig: () => updateLogConfig
});
var init_services = __esm({
  "src/server/services/index.ts"() {
    "use strict";
    init_data_sync();
    init_file_watcher();
    init_cleanup();
    init_config();
    init_member_status();
    init_task_storage();
    init_session_summary();
    init_session_reader();
    init_log_factory();
  }
});

// src/server/cli.ts
import { Command } from "commander";
import { join as join16, resolve } from "path";
import { homedir as homedir8 } from "os";
import { existsSync as existsSync15, readFileSync as readFileSync9, writeFileSync as writeFileSync4, mkdirSync as mkdirSync4 } from "fs";
import open from "open";

// src/server/server.ts
init_db();
init_services();
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import staticPlugin from "@fastify/static";
import { join as join15, dirname } from "path";
import { existsSync as existsSync14 } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// src/server/services/jsonl-sync-service.ts
init_log_factory();
import { watch as watch3 } from "chokidar";
import { join as join9 } from "path";
import { existsSync as existsSync9, readdirSync as readdirSync4, statSync as statSync4, openSync as openSync2, readSync as readSync2, closeSync as closeSync2 } from "fs";
import { homedir as homedir6 } from "os";
var log8 = createLogger({ module: "JsonlSync", shorthand: "s.s.jsonl-sync" });
var wsLog3 = createLogger({ module: "WebSocket", shorthand: "s.ws" });
var SKIP_TYPES = /* @__PURE__ */ new Set(["progress", "system", "file-history-snapshot", "last-prompt"]);
var JsonlSyncService = class {
  db;
  fastify;
  teamsPath;
  watcher = null;
  /** Map of tracked files: filePath → FileTracker */
  trackedFiles = /* @__PURE__ */ new Map();
  /** Cache: teamName → { leadMemberName, agentNames[] } */
  teamMemberCache = /* @__PURE__ */ new Map();
  constructor(options) {
    this.db = options.db;
    this.fastify = options.fastify;
    this.teamsPath = options.teamsPath || join9(homedir6(), ".claude", "teams");
  }
  // ─── Full Scan (RDB) ───
  /**
   * Full scan all JSONL files under ~/.claude/projects/
   * Called on startup. Async — does not block.
   */
  async fullScan() {
    const start = Date.now();
    let totalMessages = 0;
    let totalFiles = 0;
    const projectsDir = join9(homedir6(), ".claude", "projects");
    if (!existsSync9(projectsDir)) {
      log8.info("No projects directory, skipping JSONL scan");
      return { files: 0, messages: 0, elapsed: 0 };
    }
    await this.loadTrackerState();
    const jsonlFiles = this.findAllJsonlFiles(projectsDir);
    log8.info(`Found ${jsonlFiles.length} JSONL files to scan`);
    for (const filePath of jsonlFiles) {
      try {
        const count = await this.processFile(filePath);
        if (count > 0) {
          totalFiles++;
          totalMessages += count;
        }
      } catch (err) {
        log8.error(`Error processing ${filePath}: ${err}`);
      }
    }
    const elapsed = Date.now() - start;
    log8.info(`Full scan complete: ${totalFiles} files, ${totalMessages} messages, ${elapsed}ms`);
    return { files: totalFiles, messages: totalMessages, elapsed };
  }
  /**
   * Process a single JSONL file: parse lines, extract messages, write to DB
   */
  async processFile(filePath) {
    const stat = statSync4(filePath);
    const tracked = this.trackedFiles.get(filePath);
    let startOffset = 0;
    if (tracked) {
      if (stat.size < tracked.byteOffset) {
        log8.info(`File truncated: ${filePath}, re-reading from start`);
        startOffset = 0;
      } else {
        startOffset = tracked.byteOffset;
      }
    }
    const fd = openSync2(filePath, "r");
    const bytesToRead = stat.size - startOffset;
    if (bytesToRead <= 0) {
      closeSync2(fd);
      return 0;
    }
    const buf = Buffer.alloc(bytesToRead);
    const bytesRead = readSync2(fd, buf, 0, bytesToRead, startOffset);
    closeSync2(fd);
    const text = buf.toString("utf8", 0, bytesRead);
    const lines = text.split("\n");
    let messagesInserted = 0;
    let fileTeamName = tracked?.teamName || "";
    let fileAgentName = tracked?.agentName || "";
    let fileSessionId = "";
    let foundTeamInfo = false;
    if (!tracked) {
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.teamName) {
            fileTeamName = entry.teamName;
            fileAgentName = entry.agentName || "";
            fileSessionId = entry.sessionId || "";
            foundTeamInfo = true;
            break;
          }
        } catch {
        }
      }
      if (!foundTeamInfo) {
        return 0;
      }
    } else {
      fileSessionId = "";
    }
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        const entryType = entry.type;
        if (entry.sessionId && !fileSessionId) {
          fileSessionId = entry.sessionId;
        }
        if (SKIP_TYPES.has(entryType)) continue;
        if (!foundTeamInfo && entry.teamName) {
          fileTeamName = entry.teamName;
          fileAgentName = entry.agentName;
          fileSessionId = entry.sessionId || fileSessionId;
          foundTeamInfo = true;
        }
        const parsed = this.parseEntry(entry, fileTeamName, fileAgentName, fileSessionId);
        for (const msg of parsed) {
          await this.insertParsedMessage(msg);
          messagesInserted++;
        }
      } catch {
      }
    }
    const newOffset = startOffset + bytesRead;
    await this.updateTracker(filePath, fileTeamName, fileAgentName, newOffset, stat.mtime.toISOString());
    return messagesInserted;
  }
  // ─── Parsing ───
  /**
   * Parse a single JSONL entry into one or more ParsedEntry objects
   */
  parseEntry(entry, teamName, agentName, sessionId) {
    const results = [];
    const timestamp = entry.timestamp || (/* @__PURE__ */ new Date()).toISOString();
    if (entry.type === "queue-operation") {
      const summary = this.extractQueueSummary(entry.content || "");
      results.push({
        teamName,
        agentName,
        sessionId,
        timestamp: entry.timestamp || timestamp,
        role: "assistant",
        msgType: "queue_operation",
        content: summary
      });
      return results;
    }
    if (entry.type === "user") {
      const content = entry.message?.content;
      if (!content) return results;
      if (typeof content === "string") {
        if (this.isUserContentDisplayable(content)) {
          results.push({
            teamName,
            agentName,
            sessionId,
            timestamp,
            role: "user",
            msgType: "text",
            content
          });
        }
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && block.text) {
            if (this.isUserContentDisplayable(block.text)) {
              results.push({
                teamName,
                agentName,
                sessionId,
                timestamp,
                role: "user",
                msgType: "text",
                content: block.text
              });
            }
          }
        }
      }
      return results;
    }
    if (entry.type === "assistant") {
      const content = entry.message?.content;
      if (!content) return results;
      if (typeof content === "string") {
        const cleaned = content.replace(/<!--\s*NOTIFY[\s\S]*?-->/g, "").trim();
        if (cleaned) {
          results.push({
            teamName,
            agentName,
            sessionId,
            timestamp,
            role: "assistant",
            msgType: "text",
            content: cleaned
          });
        }
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && block.text) {
            const cleaned = block.text.replace(/<!--\s*NOTIFY[\s\S]*?-->/g, "").trim();
            if (cleaned) {
              results.push({
                teamName,
                agentName,
                sessionId,
                timestamp,
                role: "assistant",
                msgType: "text",
                content: cleaned
              });
            }
          } else if (block.type === "thinking" && block.thinking) {
            results.push({
              teamName,
              agentName,
              sessionId,
              timestamp,
              role: "assistant",
              msgType: "thinking",
              content: block.thinking
            });
          } else if (block.type === "tool_use") {
            results.push({
              teamName,
              agentName,
              sessionId,
              timestamp,
              role: "assistant",
              msgType: "tool_use",
              content: block.name || "",
              toolName: block.name,
              toolInput: typeof block.input === "string" ? block.input : JSON.stringify(block.input)
            });
          }
        }
      }
      return results;
    }
    return results;
  }
  /**
   * Extract summary from queue-operation XML content
   */
  extractQueueSummary(xmlContent) {
    const statusMatch = xmlContent.match(/<status>([^<]+)<\/status>/);
    const summaryMatch = xmlContent.match(/<summary>([^<]+)<\/summary>/);
    const status = statusMatch?.[1] || "unknown";
    const summary = summaryMatch?.[1] || xmlContent.slice(0, 200);
    return `${summary} (${status})`;
  }
  /**
   * Check if user content is displayable (not internal protocol tags)
   */
  isUserContentDisplayable(content) {
    const trimmed = content.trim();
    if (trimmed.includes("<command-name") || trimmed.includes("<command-message") || trimmed.includes("<local-command-stdout") || trimmed.includes("<local-command-caveat")) {
      return false;
    }
    if (trimmed.includes("<teammate-message")) {
      return false;
    }
    if (trimmed.startsWith("[{") && trimmed.includes('"tool_use_id"')) {
      return false;
    }
    if (trimmed.startsWith("[{") && trimmed.includes('"type":"text"') && trimmed.includes('"text"')) {
      return false;
    }
    if (trimmed === "[Request interrupted by user]" || trimmed.startsWith("[Request interrupted")) {
      return false;
    }
    return true;
  }
  // ─── Incremental Watch (AOF) ───
  /**
   * Start watching tracked JSONL files for changes
   */
  startWatching() {
    if (this.trackedFiles.size === 0) {
      log8.info("No tracked files to watch");
      return;
    }
    const filePaths = Array.from(this.trackedFiles.keys());
    log8.info(`Watching ${filePaths.length} JSONL files for changes`);
    this.watcher = watch3(filePaths, {
      persistent: true,
      ignoreInitial: true
    });
    this.watcher.on("change", async (filePath) => {
      log8.debug(`JSONL changed: ${filePath}`);
      try {
        const count = await this.processFile(filePath);
        if (count > 0) {
          log8.debug(`${count} new messages from ${filePath}`);
          const tracked = this.trackedFiles.get(filePath);
          if (tracked) {
            this.broadcastNewMessages(tracked.teamName);
          }
        }
      } catch (err) {
        log8.error(`Error processing changed file ${filePath}: ${err}`);
      }
    });
    this.watcher.on("error", (err) => {
      log8.error(`JSONL watcher error: ${err}`);
    });
  }
  /**
   * Start watching for new JSONL files in a directory
   */
  startDirectoryWatch() {
    const projectsDir = join9(homedir6(), ".claude", "projects");
    if (!existsSync9(projectsDir)) return;
    const dirWatcher = watch3(join9(projectsDir, "**/*.jsonl"), {
      persistent: true,
      ignoreInitial: true,
      depth: 3
    });
    dirWatcher.on("add", async (filePath) => {
      log8.info(`New JSONL file detected: ${filePath}`);
      try {
        const count = await this.processFile(filePath);
        if (count > 0) {
          const tracked = this.trackedFiles.get(filePath);
          if (tracked) {
            this.broadcastNewMessages(tracked.teamName);
            if (this.watcher) {
              this.watcher.add(filePath);
            }
          }
        }
      } catch (err) {
        log8.error(`Error processing new file ${filePath}: ${err}`);
      }
    });
    this._dirWatcher = dirWatcher;
  }
  // ─── WebSocket Broadcast ───
  broadcastNewMessages(teamName) {
    const wsServer = this.fastify.websocketServer;
    if (!wsServer?.clients) return;
    const eventData = JSON.stringify({
      type: "new_session_messages",
      team: teamName
    });
    let sent = 0;
    wsServer.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(eventData);
        sent++;
      }
    });
    wsLog3.debug(`Broadcasted new_session_messages for ${teamName} to ${sent} clients`);
  }
  // ─── DB Helpers ───
  /**
   * Resolve the actual member name from agentName.
   * - Sub-agents: agentName matches a team member directly (e.g. "backend-dev")
   * - Team-lead: agentName is empty → resolve from team config (first member with team-lead role)
   */
  async resolveMemberName(teamName, agentName) {
    if (agentName) return agentName;
    let cache = this.teamMemberCache.get(teamName);
    if (!cache) {
      const team = await this.db.getTeam(teamName);
      if (team?.members) {
        const agents = /* @__PURE__ */ new Map();
        let leadName = "team-lead";
        for (const m of team.members) {
          agents.set(m.name, m.name);
          if (m.role === "team-lead" || m.role === "lead" || m.name === "team-lead" || m.name === "main") {
            leadName = m.name;
          }
        }
        cache = { leadName, agents };
        this.teamMemberCache.set(teamName, cache);
      }
    }
    return cache?.leadName || "team-lead";
  }
  async insertParsedMessage(msg) {
    const id = `session-${msg.sessionId}-${msg.timestamp}-${msg.msgType}-${Math.random().toString(36).slice(2, 8)}`;
    const localId = id;
    const isUserMsg = msg.role === "user";
    const resolvedAgent = isUserMsg ? "user" : await this.resolveMemberName(msg.teamName, msg.agentName);
    const fromMember = resolvedAgent;
    const fromType = isUserMsg ? "user" : "agent";
    await this.db.insertSessionMessage({
      id,
      localId,
      team: msg.teamName,
      fromMember,
      fromType,
      toMember: null,
      content: msg.content,
      contentType: "text",
      timestamp: msg.timestamp,
      source: "session",
      msgType: msg.msgType,
      memberName: resolvedAgent,
      toolName: msg.toolName || null,
      toolInput: msg.toolInput || null,
      sessionId: msg.sessionId || null
    });
  }
  async loadTrackerState() {
    return new Promise((resolve2) => {
      this.db.db.all(
        "SELECT * FROM jsonl_file_tracker",
        [],
        (err, rows) => {
          if (!err && rows) {
            for (const row of rows) {
              this.trackedFiles.set(row.file_path, {
                filePath: row.file_path,
                teamName: row.team_name,
                agentName: row.agent_name,
                byteOffset: row.byte_offset,
                lastModified: row.last_modified
              });
            }
            log8.info(`Loaded ${rows.length} file tracker records`);
          }
          resolve2();
        }
      );
    });
  }
  async updateTracker(filePath, teamName, agentName, byteOffset, lastModified) {
    const tracker = { filePath, teamName, agentName, byteOffset, lastModified };
    this.trackedFiles.set(filePath, tracker);
    return new Promise((resolve2) => {
      this.db.db.run(
        `INSERT INTO jsonl_file_tracker (file_path, team_name, agent_name, byte_offset, last_modified)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(file_path) DO UPDATE SET
           team_name = excluded.team_name,
           agent_name = excluded.agent_name,
           byte_offset = excluded.byte_offset,
           last_modified = excluded.last_modified`,
        [filePath, teamName, agentName, byteOffset, lastModified],
        (err) => {
          if (err) log8.error(`Failed to update tracker for ${filePath}: ${err}`);
          resolve2();
        }
      );
    });
  }
  // ─── Utility ───
  findAllJsonlFiles(projectsDir) {
    const files = [];
    try {
      const projectDirs = readdirSync4(projectsDir, { withFileTypes: true });
      for (const dir of projectDirs) {
        if (!dir.isDirectory()) continue;
        const dirPath = join9(projectsDir, dir.name);
        try {
          const entries = readdirSync4(dirPath);
          for (const entry of entries) {
            if (entry.endsWith(".jsonl")) {
              files.push(join9(dirPath, entry));
            }
          }
          const subagentsDir = join9(dirPath, "subagents");
          if (existsSync9(subagentsDir)) {
            try {
              const subEntries = readdirSync4(subagentsDir);
              for (const entry of subEntries) {
                if (entry.endsWith(".jsonl")) {
                  files.push(join9(subagentsDir, entry));
                }
              }
            } catch {
            }
          }
        } catch {
        }
      }
    } catch (err) {
      log8.error(`Error scanning projects directory: ${err}`);
    }
    return files;
  }
  /**
   * Stop all watchers
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    const dirWatcher = this._dirWatcher;
    if (dirWatcher) {
      dirWatcher.close();
      delete this._dirWatcher;
    }
  }
};

// src/server/server.ts
init_log_factory();

// src/server/routes/teams.ts
async function teamRoutes(fastify, options) {
  const { db } = options;
  fastify.get("/", async (request, reply) => {
    try {
      const query = request.query;
      const acceptsCrossTeamMessages = query.acceptsCrossTeamMessages === "true";
      const teams = await db.getTeams("active", acceptsCrossTeamMessages || void 0);
      const teamsWithUnread = teams.map((t) => ({
        ...t,
        unreadCount: 0
      }));
      return {
        success: true,
        data: { teams: teamsWithUnread }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch teams"
      };
    }
  });
  fastify.get("/:name", async (request, reply) => {
    const { name } = request.params;
    try {
      const team = await db.getTeam(name);
      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: "Team not found"
        };
      }
      return {
        success: true,
        data: { team }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch team"
      };
    }
  });
  fastify.get("/:name/members", async (request, reply) => {
    const { name } = request.params;
    try {
      const team = await db.getTeam(name);
      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: "Team not found"
        };
      }
      return {
        success: true,
        data: { members: team.members }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch members"
      };
    }
  });
}
var teams_default = teamRoutes;

// src/server/routes/messages.ts
async function messageRoutes(fastify, options) {
  const { db, dataSync } = options;
  fastify.get("/:name/messages", async (request, reply) => {
    const { name } = request.params;
    const query = request.query;
    try {
      const limit = Math.min(query.limit || 50, 200);
      const messages = await db.getMessages(name, {
        before: query.before,
        limit,
        to: query.to,
        instance: query.instance,
        source: query.source,
        member: query.member
      });
      const hasMore = messages.length === limit;
      const instances = /* @__PURE__ */ new Set();
      const sourceProjects = /* @__PURE__ */ new Set();
      messages.forEach((msg) => {
        if (msg.teamInstance) instances.add(msg.teamInstance);
        if (msg.sourceProject) sourceProjects.add(msg.sourceProject);
      });
      return {
        success: true,
        data: {
          messages,
          hasMore,
          metadata: {
            instances: Array.from(instances),
            sourceProjects: Array.from(sourceProjects)
          }
        }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch messages"
      };
    }
  });
  fastify.post("/:name/messages", async (request, reply) => {
    const { name } = request.params;
    const body = request.body;
    if (!body.content?.trim()) {
      reply.status(400);
      return {
        success: false,
        error: "Content is required"
      };
    }
    try {
      const to = body.to || null;
      if (to && to.startsWith("team:")) {
        const targetTeam = to.slice(5);
        const targetTeamData = await db.getTeam(targetTeam);
        if (!targetTeamData) {
          reply.status(404);
          return {
            success: false,
            error: "Target team not found"
          };
        }
        if (!targetTeamData.allowCrossTeamMessages) {
          reply.status(403);
          return {
            success: false,
            error: "Cross-team messaging is disabled for target team"
          };
        }
        const result = await dataSync.sendCrossTeamMessage(
          name,
          targetTeam,
          body.content.trim(),
          body.contentType || "text"
        );
        if (!result.success) {
          reply.status(400);
          return {
            success: false,
            error: result.error || "Failed to send cross-team message"
          };
        }
        reply.status(201);
        return {
          success: true,
          data: { message: result.message }
        };
      }
      const message = await dataSync.sendMessage(
        name,
        to,
        body.content.trim(),
        body.contentType || "text"
      );
      reply.status(201);
      return {
        success: true,
        data: { message }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to send message"
      };
    }
  });
  fastify.put("/:name/messages/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    if (!body.content?.trim()) {
      reply.status(400);
      return {
        success: false,
        error: "Content is required"
      };
    }
    try {
      db.updateMessage(id, {
        content: body.content.trim(),
        editedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return {
        success: true
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to update message"
      };
    }
  });
  fastify.delete("/:name/messages/:id", async (request, reply) => {
    const { id } = request.params;
    try {
      db.updateMessage(id, {
        deletedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return {
        success: true
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to delete message"
      };
    }
  });
}
var messages_default = messageRoutes;

// src/server/routes/archive.ts
import { join as join10 } from "path";
import { existsSync as existsSync10, readdirSync as readdirSync5, rmSync as rmSync2 } from "fs";
async function archiveRoutes(fastify, options) {
  const { db, dataDir } = options;
  fastify.get("/", async (_request, reply) => {
    try {
      const teams = await db.getTeams("archived");
      return {
        success: true,
        data: { teams }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch archived teams"
      };
    }
  });
  fastify.post("/:name/restore", async (request, reply) => {
    const { name } = request.params;
    try {
      const team = await db.getTeam(name);
      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: "Team not found"
        };
      }
      if (team.status !== "archived") {
        reply.status(400);
        return {
          success: false,
          error: "Team is not archived"
        };
      }
      db.updateTeamStatus(name, "active", void 0);
      return {
        success: true
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to restore team"
      };
    }
  });
  fastify.delete("/:name", async (request, reply) => {
    const { name } = request.params;
    try {
      const team = await db.getTeam(name);
      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: "Team not found"
        };
      }
      if (team.status !== "archived") {
        reply.status(400);
        return {
          success: false,
          error: "Can only delete archived teams"
        };
      }
      db.deleteTeam(name);
      const archiveBase = join10(dataDir, "archive");
      if (existsSync10(archiveBase)) {
        const entries = readdirSync5(archiveBase, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name.startsWith(`${name}-`)) {
            const dirPath = join10(archiveBase, entry.name);
            rmSync2(dirPath, { recursive: true });
          }
        }
      }
      return {
        success: true
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to delete team"
      };
    }
  });
}
var archive_default = archiveRoutes;

// src/server/routes/settings.ts
init_log_factory();
var log9 = createLogger({ module: "Settings", shorthand: "s.r.settings" });
async function settingsRoutes(fastify, options) {
  const { configService, onRestart } = options;
  fastify.get("/", async (_request, _reply) => {
    const config = configService.getConfig();
    const safeConfig = {
      port: config.port,
      host: config.host,
      dataDir: config.dataDir,
      teamsPath: config.teamsPath,
      theme: config.theme,
      desktopNotifications: config.desktopNotifications,
      soundEnabled: config.soundEnabled,
      retentionDays: config.retentionDays,
      cleanupEnabled: config.cleanupEnabled,
      cleanupTime: config.cleanupTime
    };
    return {
      success: true,
      data: safeConfig
    };
  });
  fastify.put("/", async (request, reply) => {
    const body = request.body;
    try {
      if (body.theme && !["light", "dark", "auto"].includes(body.theme)) {
        reply.status(400);
        return {
          success: false,
          error: "Invalid theme value"
        };
      }
      if (body.retentionDays && (body.retentionDays < 1 || body.retentionDays > 365)) {
        reply.status(400);
        return {
          success: false,
          error: "Retention days must be between 1 and 365"
        };
      }
      const changes = configService.updateConfig(body);
      return {
        success: true,
        data: {
          changes,
          pendingRestart: configService.needsRestart()
        }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to save settings"
      };
    }
  });
  fastify.get("/pending", async (_request, _reply) => {
    return {
      success: true,
      data: {
        pendingRestart: configService.needsRestart(),
        changes: configService.getPendingChanges()
      }
    };
  });
  fastify.get("/restart-info", async (_request, _reply) => {
    return {
      success: true,
      data: {
        needsRestart: configService.needsRestart(),
        changes: configService.getPendingChanges()
      }
    };
  });
  fastify.post("/restart", async (_request, reply) => {
    if (!onRestart) {
      reply.status(501);
      return {
        success: false,
        error: "Restart not supported in this mode"
      };
    }
    try {
      configService.clearPendingChanges();
      reply.send({
        success: true,
        message: "Server restarting..."
      });
      setTimeout(async () => {
        try {
          await onRestart();
        } catch (err) {
          log9.error(`Restart failed: ${err}`);
        }
      }, 100);
      return reply;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to restart server"
      };
    }
  });
}
var settings_default = settingsRoutes;

// src/server/routes/permission-response.ts
init_log_factory();
import { join as join11 } from "path";
import { readFileSync as readFileSync7, existsSync as existsSync11, writeFileSync as writeFileSync3 } from "fs";
var log10 = createLogger({ module: "PermissionResponse", shorthand: "s.r.perm" });
async function permissionResponseRoutes(fastify, options) {
  const { db, claudeTeamsPath } = options;
  fastify.post("/:name/permission-response", async (request, reply) => {
    const { name } = request.params;
    const body = request.body;
    if (!body.request_id || typeof body.request_id !== "string") {
      reply.status(400);
      return {
        success: false,
        error: "request_id is required and must be a string"
      };
    }
    if (typeof body.approve !== "boolean") {
      reply.status(400);
      return {
        success: false,
        error: "approve is required and must be a boolean"
      };
    }
    if (!body.agent_id || typeof body.agent_id !== "string") {
      reply.status(400);
      return {
        success: false,
        error: "agent_id is required and must be a string"
      };
    }
    try {
      const team = await db.getTeam(name);
      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: "Team not found"
        };
      }
      const timestamp = body.timestamp || (/* @__PURE__ */ new Date()).toISOString();
      const permissionResponse = {
        type: "permission_response",
        request_id: body.request_id,
        subtype: "success",
        response: {
          approved: body.approve,
          timestamp
        }
      };
      const inboxPath = join11(claudeTeamsPath, name, "inboxes", `${body.agent_id}.json`);
      if (!existsSync11(inboxPath)) {
        reply.status(404);
        return {
          success: false,
          error: `Agent inbox not found: ${body.agent_id}`
        };
      }
      const messages = JSON.parse(readFileSync7(inboxPath, "utf8"));
      if (!Array.isArray(messages)) {
        reply.status(500);
        return {
          success: false,
          error: "Invalid inbox format"
        };
      }
      messages.push({
        from: "user",
        text: JSON.stringify(permissionResponse),
        summary: `Permission ${body.approve ? "approved" : "rejected"}: ${body.request_id}`,
        timestamp,
        read: false
      });
      writeFileSync3(inboxPath, JSON.stringify(messages, null, 2));
      log10.info(`Written to ${body.agent_id}'s inbox: ${body.approve ? "approved" : "rejected"} ${body.request_id}`);
      const newStatus = body.approve ? "approved" : "rejected";
      await db.updatePermissionRequestStatus(name, body.request_id, newStatus);
      log10.debug(`Updated database status to ${newStatus} for request ${body.request_id}`);
      reply.status(201);
      return {
        success: true,
        data: {
          request_id: body.request_id,
          approve: body.approve,
          timestamp
        }
      };
    } catch (err) {
      log10.error(`Error processing permission response: ${err}`);
      reply.status(500);
      return {
        success: false,
        error: "Failed to process permission response"
      };
    }
  });
}
var permission_response_default = permissionResponseRoutes;

// src/server/routes/tasks.ts
init_task_storage();
init_session_summary();
init_log_factory();
import { readdir as readdir2, readFile as readFile2 } from "fs/promises";
import { existsSync as existsSync12, statSync as statSync5 } from "fs";
import { join as join12 } from "path";
import { homedir as homedir7 } from "os";
var log11 = createLogger({ module: "Tasks", shorthand: "s.r.tasks" });
async function readTasksFromFiles(teamName) {
  const tasksDir = join12(homedir7(), ".claude", "tasks", teamName);
  if (!existsSync12(tasksDir)) {
    return [];
  }
  try {
    const files = await readdir2(tasksDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const tasks = [];
    for (const file of jsonFiles) {
      try {
        const filePath = join12(tasksDir, file);
        const content = await readFile2(filePath, "utf-8");
        const task = JSON.parse(content);
        if (task.id && task.subject && task.status) {
          tasks.push({
            id: task.id,
            subject: task.subject,
            description: task.description,
            status: task.status,
            owner: task.owner,
            blockedBy: task.blockedBy || [],
            activeForm: task.activeForm,
            metadata: task.metadata,
            history: task.history,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          });
        }
      } catch (parseError) {
        log11.error(`Failed to parse task file ${file}: ${parseError}`);
      }
    }
    tasks.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      return numA - numB;
    });
    return tasks;
  } catch (error) {
    log11.error(`Failed to read tasks directory: ${error}`);
    return [];
  }
}
var taskStorage = new TaskStorageService();
function calculateCounts(tasks) {
  const counts = {
    total: tasks.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    deleted: 0
  };
  for (const task of tasks) {
    switch (task.status) {
      case "pending":
        counts.pending++;
        break;
      case "in_progress":
        counts.in_progress++;
        break;
      case "completed":
        counts.completed++;
        break;
      case "deleted":
        counts.deleted++;
        break;
    }
  }
  return counts;
}
async function tasksRoutes(fastify) {
  fastify.get("/:name/tasks", async (request, reply) => {
    const { name } = request.params;
    try {
      const tasks = await readTasksFromFiles(name);
      return {
        success: true,
        data: { tasks }
      };
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch tasks"
      };
    }
  });
  fastify.post("/:name/tasks", async (request, reply) => {
    const { name } = request.params;
    const body = request.body;
    if (!body.subject) {
      reply.status(400);
      return {
        success: false,
        error: "subject is required"
      };
    }
    try {
      const taskId = body.id || Date.now().toString();
      const existingTask = await taskStorage.readTaskFile(name, taskId);
      if (existingTask) {
        reply.status(409);
        return {
          success: false,
          error: `Task ${taskId} already exists`
        };
      }
      const task = await taskStorage.createTask(name, taskId, {
        subject: body.subject,
        description: body.description,
        status: body.status,
        owner: body.owner,
        blockedBy: body.blockedBy,
        activeForm: body.activeForm,
        metadata: body.metadata
      });
      reply.status(201);
      return {
        success: true,
        data: task
      };
    } catch (err) {
      log11.error(`Error creating task: ${err}`);
      reply.status(500);
      return {
        success: false,
        error: "Failed to create task"
      };
    }
  });
  fastify.put("/:name/tasks/:id", async (request, reply) => {
    const { name, id } = request.params;
    const body = request.body;
    try {
      const task = await taskStorage.updateTaskWithHistory(
        name,
        id,
        {
          subject: body.subject,
          description: body.description,
          status: body.status,
          owner: body.owner,
          blockedBy: body.blockedBy,
          activeForm: body.activeForm,
          metadata: body.metadata
        },
        body.changedBy
      );
      if (!task) {
        reply.status(404);
        return {
          success: false,
          error: `Task ${id} not found`
        };
      }
      return {
        success: true,
        data: task
      };
    } catch (err) {
      log11.error(`Error updating task ${id}: ${err}`);
      reply.status(500);
      return {
        success: false,
        error: "Failed to update task"
      };
    }
  });
  fastify.delete("/:name/tasks/:id", async (request, reply) => {
    const { name, id } = request.params;
    const { hard } = request.query;
    try {
      const hardDelete = hard === "true";
      const success = await taskStorage.deleteTaskFile(name, id, !hardDelete);
      if (!success) {
        reply.status(404);
        return {
          success: false,
          error: `Task ${id} not found`
        };
      }
      return {
        success: true
      };
    } catch (err) {
      log11.error(`Error deleting task ${id}: ${err}`);
      reply.status(500);
      return {
        success: false,
        error: "Failed to delete task"
      };
    }
  });
  fastify.post("/:name/session-summary", async (request, reply) => {
    const { name } = request.params;
    try {
      const summaryService = new SessionSummaryService();
      const filePath = await summaryService.generateSessionSummary(name);
      return {
        success: true,
        data: { filePath }
      };
    } catch (err) {
      log11.error(`Error generating session summary for ${name}: ${err}`);
      reply.status(500);
      return {
        success: false,
        error: "Failed to generate session summary"
      };
    }
  });
}
async function globalTasksRoutes(fastify) {
  fastify.get("/tasks", async (request, reply) => {
    const { status, team } = request.query;
    try {
      const allTasks = [];
      if (team) {
        const tasks = await readTasksFromFiles(team);
        for (const task of tasks) {
          if (!status || task.status === status) {
            allTasks.push({ ...task, teamName: team });
          }
        }
      } else {
        const tasksBaseDir = join12(homedir7(), ".claude", "tasks");
        if (existsSync12(tasksBaseDir)) {
          const teamDirs = await readdir2(tasksBaseDir);
          for (const teamName of teamDirs) {
            const teamPath = join12(tasksBaseDir, teamName);
            try {
              if (statSync5(teamPath).isDirectory()) {
                const tasks = await readTasksFromFiles(teamName);
                for (const task of tasks) {
                  if (!status || task.status === status) {
                    allTasks.push({ ...task, teamName });
                  }
                }
              }
            } catch {
            }
          }
        }
      }
      const allTasksForCounts = team ? await readTasksFromFiles(team) : await getAllTasksForCounts();
      const counts = calculateCounts(allTasksForCounts);
      return {
        success: true,
        data: {
          tasks: allTasks,
          counts
        }
      };
    } catch (err) {
      log11.error(`Error fetching global tasks: ${err}`);
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch tasks"
      };
    }
  });
}
async function getAllTasksForCounts() {
  const tasksBaseDir = join12(homedir7(), ".claude", "tasks");
  const allTasks = [];
  if (!existsSync12(tasksBaseDir)) {
    return allTasks;
  }
  try {
    const teamDirs = await readdir2(tasksBaseDir);
    for (const teamName of teamDirs) {
      const teamPath = join12(tasksBaseDir, teamName);
      try {
        if (statSync5(teamPath).isDirectory()) {
          const tasks = await readTasksFromFiles(teamName);
          allTasks.push(...tasks);
        }
      } catch {
      }
    }
  } catch {
  }
  return allTasks;
}
var tasks_default = tasksRoutes;

// src/server/routes/logs.ts
import { readFile as readFile3 } from "fs/promises";
import { join as join13 } from "path";
async function logsRoutes(fastify, options) {
  const { configService } = options;
  fastify.get("/error", async (_request, reply) => {
    try {
      const config = configService.getConfig();
      const logPath = join13(config.dataDir, "logs", "error.log");
      try {
        const content = await readFile3(logPath, "utf-8");
        return {
          success: true,
          data: content
        };
      } catch (err) {
        return {
          success: true,
          data: ""
        };
      }
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to read error log"
      };
    }
  });
  fastify.get("/console", async (_request, reply) => {
    try {
      const config = configService.getConfig();
      const logPath = join13(config.dataDir, "logs", "console.log");
      try {
        const content = await readFile3(logPath, "utf-8");
        return {
          success: true,
          data: content
        };
      } catch (err) {
        return {
          success: true,
          data: ""
        };
      }
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to read console log"
      };
    }
  });
  fastify.get("/info", async (_request, reply) => {
    try {
      const config = configService.getConfig();
      const logPath = join13(config.dataDir, "logs", "info.log");
      try {
        const content = await readFile3(logPath, "utf-8");
        return {
          success: true,
          data: content
        };
      } catch (err) {
        return {
          success: true,
          data: ""
        };
      }
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: "Failed to read info log"
      };
    }
  });
}
var logs_default = logsRoutes;

// src/server/routes/hooks.ts
init_log_factory();
var log12 = createLogger({ module: "Hooks", shorthand: "s.r.hooks" });
function broadcastTaskCreated(fastify, taskData) {
  const wsServer = fastify.websocketServer;
  if (!wsServer?.clients) {
    return;
  }
  const message = JSON.stringify({
    type: "task_created",
    team: taskData.teamName,
    task: {
      id: taskData.taskId,
      subject: taskData.subject || "",
      status: taskData.status || "pending",
      owner: taskData.owner || ""
    }
  });
  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}
async function hooksRoutes(fastify, _options) {
  fastify.post(
    "/task-created",
    async (request, reply) => {
      const body = request.body;
      if (!body.taskId || !body.teamName) {
        reply.status(400);
        return {
          success: false,
          error: "Missing required fields: taskId, teamName"
        };
      }
      log12.info(`Task created: ${body.taskId} for team ${body.teamName}`);
      broadcastTaskCreated(fastify, {
        taskId: body.taskId,
        teamName: body.teamName,
        subject: body.subject,
        status: body.status,
        owner: body.owner
      });
      return {
        success: true,
        data: {
          received: true,
          taskId: body.taskId,
          teamName: body.teamName
        }
      };
    }
  );
}
var hooks_default = hooksRoutes;

// src/server/routes/member-session.ts
init_session_reader();
async function memberSessionRoutes(fastify, options) {
  const sessionReader = new SessionReaderService({ teamsPath: options.teamsPath });
  const { db } = options;
  fastify.get("/:team/members/:member/session", async (request, reply) => {
    const { team, member } = request.params;
    const session = sessionReader.getMemberSession(team, member);
    if (!session) {
      reply.status(404);
      return {
        success: false,
        error: "Session not registered"
      };
    }
    return {
      success: true,
      data: session
    };
  });
  fastify.get("/:team/members/:member/conversation", async (request, _reply) => {
    const { team, member } = request.params;
    const query = request.query;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const conversation = sessionReader.getMemberConversation(team, member, limit);
    let dbMessages = [];
    try {
      const sentToMember = await db.getMessages(team, { to: member, limit: 100 });
      for (const msg of sentToMember) {
        dbMessages.push({
          role: msg.from === "user" ? "user" : "assistant",
          type: "text",
          content: msg.content,
          timestamp: msg.timestamp,
          senderName: msg.from || "user"
        });
      }
    } catch (err) {
    }
    const existingTimestamps = new Set(
      conversation.messages.map((m) => m.timestamp)
    );
    const newDbMessages = dbMessages.filter((m) => !existingTimestamps.has(m.timestamp));
    const allMessages = [...conversation.messages, ...newDbMessages];
    allMessages.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });
    return {
      success: true,
      data: {
        ...conversation,
        messages: allMessages.slice(-limit)
      }
    };
  });
  fastify.get("/:team/members/sessions", async (request, _reply) => {
    const { team } = request.params;
    const sessions = sessionReader.listMemberSessions(team);
    return {
      success: true,
      data: { sessions }
    };
  });
}
var member_session_default = memberSessionRoutes;

// src/server/routes/commands.ts
init_log_factory();
import { readdirSync as readdirSync6, readFileSync as readFileSync8, statSync as statSync6, existsSync as existsSync13 } from "fs";
import { join as join14 } from "path";
var log13 = createLogger({ module: "Commands", shorthand: "s.r.commands" });
var cacheMap = /* @__PURE__ */ new Map();
var CACHE_TTL = 6e4;
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    fields[key] = val;
  }
  return fields;
}
function firstContentLine(content) {
  const stripped = content.replace(/^---\n[\s\S]*?\n---\n?/, "");
  for (const line of stripped.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) return trimmed;
  }
  return "";
}
function truncate(desc) {
  if (desc.length <= 50) return desc;
  return desc.slice(0, 50) + "...";
}
function getTeamProjectDir(teamsPath, teamName) {
  const configPath = join14(teamsPath, teamName, "config.json");
  try {
    if (!existsSync13(configPath)) return null;
    const config = JSON.parse(readFileSync8(configPath, "utf-8"));
    if (config.members && config.members.length > 0 && config.members[0].cwd) {
      return config.members[0].cwd;
    }
  } catch (err) {
    log13.debug(`Failed to read team config for ${teamName}: ${err}`);
  }
  return null;
}
function scanProjectDir(projectDir) {
  const commands = [];
  const skills = [];
  const claudeDir = join14(projectDir, ".claude");
  if (!existsSync13(claudeDir)) {
    return { commands, skills };
  }
  const commandsDir = join14(claudeDir, "commands");
  try {
    const groups = readdirSync6(commandsDir);
    for (const group of groups) {
      const groupPath = join14(commandsDir, group);
      if (!statSync6(groupPath).isDirectory()) continue;
      const files = readdirSync6(groupPath);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const filePath = join14(groupPath, file);
        const content = readFileSync8(filePath, "utf-8");
        const fm = parseFrontmatter(content);
        const callName = `${group}:${file.replace(/\.md$/, "")}`;
        let desc = fm.description || firstContentLine(content) || "";
        commands.push({ name: callName, description: truncate(desc), type: "command" });
      }
    }
  } catch {
    log13.debug("No commands directory found");
  }
  const skillsDir = join14(claudeDir, "skills");
  try {
    const dirs = readdirSync6(skillsDir);
    for (const dir of dirs) {
      const skillFile = join14(skillsDir, dir, "SKILL.md");
      try {
        statSync6(skillFile);
      } catch {
        continue;
      }
      const content = readFileSync8(skillFile, "utf-8");
      const fm = parseFrontmatter(content);
      let desc = fm.description || firstContentLine(content) || "";
      skills.push({ name: dir, description: truncate(desc), type: "skill" });
    }
  } catch {
    log13.debug("No skills directory found");
  }
  return { commands, skills };
}
async function commandsRoutes(fastify) {
  fastify.get("/", async (request) => {
    const { team, cwd } = request.query;
    let projectDir;
    if (cwd) {
      projectDir = cwd;
    } else if (team) {
      const teamsPath = fastify.config?.teamsPath || process.env.CLAUDE_TEAMS_PATH || join14(process.env.HOME || "/root", ".claude/teams");
      const teamCwd = getTeamProjectDir(teamsPath, team);
      projectDir = teamCwd || process.cwd();
    } else {
      projectDir = process.cwd();
    }
    const cacheKey = projectDir;
    const cached = cacheMap.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const data = scanProjectDir(projectDir);
    cacheMap.set(cacheKey, { data, timestamp: Date.now() });
    log13.debug(`Scanned commands for ${projectDir}: ${data.commands.length} commands, ${data.skills.length} skills`);
    return data;
  });
}

// src/server/server.ts
var __dirname2 = dirname(fileURLToPath(import.meta.url));
async function createServer(options) {
  const { config, dataDir } = options;
  const logDir = join15(dataDir, "logs");
  initLogFactory({
    enabled: config.logConfig?.enabled ?? true,
    level: config.logConfig?.level ?? "info",
    maxSize: config.logConfig?.maxSize ?? 10,
    maxDays: config.logConfig?.maxDays ?? 7,
    logDir,
    colorize: process.env.NODE_ENV !== "production"
  });
  const log14 = createLogger({ module: "Server", shorthand: "s.server" });
  const fastify = Fastify({
    logger: {
      level: "info"
    }
  });
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });
  await fastify.register(websocket);
  const db = new DatabaseService(dataDir);
  log14.info("Database initialized");
  const configPath = join15(dataDir, "config.json");
  const configService = new ConfigService(configPath, config);
  const dataSync = new DataSyncService({
    claudeTeamsPath: config.teamsPath,
    dataDir,
    db,
    fastify
  });
  await dataSync.init();
  log14.info("Data sync initialized");
  const memberStatusService = new MemberStatusService();
  log14.info("Member status service initialized");
  const memberStatusLog = createLogger({ module: "MemberStatus", shorthand: "s.mstatus" });
  const fileWatcher = new FileWatcherService({
    claudeTeamsPath: config.teamsPath,
    dataSync,
    fastify,
    onMemberActivity: (teamName, memberName, messageType) => {
      if (messageType === "idle_notification") {
        memberStatusLog.info(`${memberName} is now idle`);
        memberStatusService.markIdle(teamName, memberName);
      } else {
        memberStatusLog.info(`${memberName} is busy`);
        memberStatusService.markBusy(teamName, memberName);
      }
      if (fastify.websocketServer) {
        const statuses = memberStatusService.getMemberStatuses(teamName);
        fastify.websocketServer.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "member_status",
              team: teamName,
              members: statuses
            }));
          }
        });
      }
    }
  });
  await fileWatcher.start();
  log14.info("File watcher started");
  const jsonlSync = new JsonlSyncService({ db, fastify, teamsPath: config.teamsPath });
  jsonlSync.fullScan().then((result) => {
    log14.info(`JSONL sync: ${result.files} files, ${result.messages} messages scanned in ${result.elapsed}ms`);
    jsonlSync.startWatching();
    jsonlSync.startDirectoryWatch();
    log14.info("JSONL incremental watcher started");
  }).catch((err) => {
    log14.error(`JSONL full scan failed: ${err}`);
  });
  try {
    const teams = await db.getTeams();
    for (const team of teams) {
      if (team.members) {
        for (const member of team.members) {
          memberStatusService.initMemberOffline(team.name, member.name);
        }
      }
    }
    log14.info(`Initialized ${teams.length} teams with offline status`);
  } catch (err) {
    log14.error(`Error initializing team members: ${err}`);
  }
  const cleanupService = new CleanupService(db, {
    retentionDays: config.retentionDays,
    cleanupEnabled: config.cleanupEnabled,
    cleanupTime: config.cleanupTime
  });
  cleanupService.schedule();
  log14.info("Cleanup service scheduled");
  configService.startWatching((changes) => {
    if (fastify.websocketServer) {
      const pendingRestart = configService.needsRestart();
      fastify.websocketServer.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: "config_updated",
            changes,
            pendingRestart
          }));
        }
      });
    }
    const relevantChanges = changes.filter(
      (c) => ["retentionDays", "cleanupEnabled", "cleanupTime"].includes(c.key)
    );
    if (relevantChanges.length > 0) {
      const currentConfig = configService.getConfig();
      cleanupService.updateConfig({
        retentionDays: currentConfig.retentionDays,
        cleanupEnabled: currentConfig.cleanupEnabled,
        cleanupTime: currentConfig.cleanupTime
      });
    }
    const logConfigChange = changes.find((c) => c.key === "logConfig");
    if (logConfigChange) {
      updateLogConfig(logConfigChange.newValue);
    }
  });
  log14.info("Config service started");
  fastify.register(teams_default, { prefix: "/api/teams", db });
  fastify.register(messages_default, { prefix: "/api/teams", db, dataSync });
  fastify.register(permission_response_default, { prefix: "/api/teams", db, claudeTeamsPath: config.teamsPath });
  fastify.register(tasks_default, { prefix: "/api/teams" });
  fastify.register(globalTasksRoutes, { prefix: "/api" });
  fastify.register(archive_default, { prefix: "/api/archive", db, dataDir });
  fastify.register(logs_default, { prefix: "/api/logs", configService });
  fastify.register(hooks_default, { prefix: "/api/hooks", fastify });
  fastify.register(member_session_default, { prefix: "/api/teams", teamsPath: config.teamsPath, db });
  fastify.register(commandsRoutes, { prefix: "/api/commands" });
  const wsLog4 = createLogger({ module: "WebSocket", shorthand: "s.ws" });
  fastify.register(async (fastify2) => {
    fastify2.get("/ws", { websocket: true }, (socket, _req) => {
      wsLog4.info("Client connected");
      if (!socket || typeof socket.on !== "function") {
        wsLog4.error("Invalid socket object");
        return;
      }
      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          switch (data.type) {
            case "join_team":
              wsLog4.info(`Client joined team: ${data.team}`);
              (async () => {
                try {
                  const team = await db.getTeam(data.team);
                  if (team?.members) {
                    for (const member of team.members) {
                      memberStatusService.initMemberOffline(data.team, member.name);
                    }
                  }
                } catch (err) {
                  wsLog4.error(`Error initializing team members: ${err}`);
                }
                const statuses = memberStatusService.getMemberStatuses(data.team);
                if (fastify2.websocketServer) {
                  fastify2.websocketServer.clients.forEach((client) => {
                    if (client.readyState === 1) {
                      client.send(JSON.stringify({
                        type: "member_status",
                        team: data.team,
                        members: statuses
                      }));
                    }
                  });
                }
              })();
              break;
            case "leave_team":
              wsLog4.info(`Client left team: ${data.team}`);
              break;
            case "typing":
              if (fastify2.websocketServer) {
                fastify2.websocketServer.clients.forEach((client) => {
                  if (client !== socket && client.readyState === 1) {
                    client.send(JSON.stringify({
                      type: "typing",
                      team: data.team,
                      from: data.from
                    }));
                  }
                });
              }
              break;
            case "mark_read":
              wsLog4.debug(`Marked read: ${data.messageId}`);
              break;
            case "send_cross_team_message":
              wsLog4.info(`Cross-team message from ${data.fromTeam} to ${data.toTeam}`);
              (async () => {
                try {
                  const result = await dataSync.sendCrossTeamMessage(
                    data.fromTeam,
                    data.toTeam,
                    data.content,
                    data.contentType || "text"
                  );
                  if (!result.success) {
                    socket.send(JSON.stringify({
                      type: "error",
                      error: result.error
                    }));
                  }
                } catch (err) {
                  wsLog4.error(`Error sending cross-team message: ${err}`);
                  socket.send(JSON.stringify({
                    type: "error",
                    error: "Failed to send cross-team message"
                  }));
                }
              })();
              break;
          }
        } catch (err) {
          wsLog4.error(`Error handling message: ${err}`);
        }
      });
      socket.on("close", () => {
        wsLog4.info("Client disconnected");
      });
    });
  });
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const clientDistPath = pluginRoot ? join15(pluginRoot, "dist", "client") : join15(__dirname2, "../../client");
  log14.info(`Serving frontend from ${clientDistPath}${pluginRoot ? " (plugin)" : " (development)"}`);
  if (existsSync14(clientDistPath)) {
    fastify.register(staticPlugin, {
      root: clientDistPath,
      prefix: "/"
    });
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api") || request.url.startsWith("/ws")) {
        reply.status(404).send({ error: "Not found" });
      } else {
        await reply.sendFile("index.html", clientDistPath);
      }
    });
  }
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    };
  });
  const handleRestart = async () => {
    const currentConfig = configService.getConfig();
    if (fastify.websocketServer) {
      fastify.websocketServer.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: "server_restarting",
            message: "Server is restarting, please reconnect...",
            newPort: currentConfig.port,
            newHost: currentConfig.host
          }));
        }
      });
    }
    await new Promise((resolve2) => setTimeout(resolve2, 500));
    await shutdown(true);
  };
  fastify.register(settings_default, {
    prefix: "/api/settings",
    configService,
    onRestart: handleRestart
  });
  const shutdown = async (restart = false) => {
    log14.info("Shutting down...");
    fileWatcher.stop();
    jsonlSync.stop();
    configService.stopWatching();
    cleanupService.stop();
    closeLogFactory();
    db.close();
    await fastify.close();
    log14.info("Shutdown complete");
    if (restart) {
      log14.info("Restarting...");
      const nodePath = process.execPath;
      const scriptPath = process.argv[1];
      const originalArgs = process.argv.slice(2);
      const filteredArgs = originalArgs.filter((arg, index, arr) => {
        if (arg === "--port" || arg === "-p" || arg === "--host" || arg === "-h") {
          return false;
        }
        if (index > 0 && (arr[index - 1] === "--port" || arr[index - 1] === "-p" || arr[index - 1] === "--host" || arr[index - 1] === "-h")) {
          return false;
        }
        return true;
      });
      const args = [...filteredArgs, "--headless"];
      spawn(nodePath, [scriptPath, ...args], {
        detached: true,
        stdio: "inherit",
        env: { ...process.env, CLAUDE_CHAT_RESTART: "1" }
      }).unref();
    }
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown(false));
  process.on("SIGTERM", () => shutdown(false));
  return { fastify, db, dataSync, fileWatcher, cleanupService, memberStatusService, jsonlSync };
}

// src/server/cli.ts
init_constants();
var program = new Command();
program.name("claude-teams-gui").description("Visual chat interface for Claude Code Teams").version("0.3.28");
program.option("-p, --port <port>", "Port to run on").option("-h, --host <host>", "Host to bind to").option("-d, --data <path>", "Data directory").option("--teams <path>", "Claude teams directory").option("--headless", "Do not open browser", true).option("--no-sync", "Disable Claude teams sync", false).action(async (options) => {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[FATAL] Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
  process.on("uncaughtException", (error) => {
    console.error("[FATAL] Uncaught Exception:", error);
    process.exit(1);
  });
  try {
    const dataDir = options.data ? resolve(options.data) : join16(homedir8(), ".claude-chat");
    const teamsPath = options.teams ? resolve(options.teams) : join16(homedir8(), ".claude", "teams");
    if (!existsSync15(dataDir)) {
      mkdirSync4(dataDir, { recursive: true });
    }
    const configPath = join16(dataDir, "config.json");
    let config;
    if (existsSync15(configPath)) {
      const fileConfig = JSON.parse(readFileSync9(configPath, "utf8"));
      config = {
        ...DEFAULT_CONFIG,
        ...fileConfig,
        // 命令行参数优先（如果有显式指定）
        port: options.port ? parseInt(options.port) : fileConfig.port || DEFAULT_CONFIG.port,
        host: options.host || fileConfig.host || DEFAULT_CONFIG.host,
        dataDir,
        teamsPath
      };
    } else {
      config = {
        ...DEFAULT_CONFIG,
        port: options.port ? parseInt(options.port) : DEFAULT_CONFIG.port,
        host: options.host || DEFAULT_CONFIG.host,
        dataDir,
        teamsPath
      };
      writeFileSync4(configPath, JSON.stringify(config, null, 2));
    }
    console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                     Claude Agent GUI v0.1.0                       \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  Data Directory: ${dataDir.padEnd(46)}\u2551
\u2551  Teams Path:     ${teamsPath.padEnd(46)}\u2551
\u2551  Port:           ${String(config.port).padEnd(46)}\u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
      `);
    const { fastify, memberStatusService } = await createServer({ config, dataDir });
    await fastify.listen({
      port: config.port,
      host: config.host
    });
    setInterval(() => {
      const teams = memberStatusService?.getTrackedTeams() || [];
      for (const teamName of teams) {
        const statuses = memberStatusService.tick(teamName);
        if (fastify.websocketServer && statuses.length > 0) {
          fastify.websocketServer.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: "member_status",
                team: teamName,
                members: statuses
              }));
            }
          });
        }
      }
    }, 5e3);
    const url = `http://${config.host}:${config.port}`;
    console.log(`\u2713 Server running at ${url}`);
    if (!options.headless) {
      console.log("Opening browser...");
      await open(url);
    }
    console.log("\nPress Ctrl+C to stop\n");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
});
program.command("cleanup").description("Run cleanup task manually").option("-d, --data <path>", "Data directory").action(async (options) => {
  const dataDir = options.data ? resolve(options.data) : join16(homedir8(), ".claude-chat");
  console.log("Running cleanup...");
  const { DatabaseService: DatabaseService2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const { CleanupService: CleanupService2 } = await Promise.resolve().then(() => (init_services(), services_exports));
  const db = new DatabaseService2(dataDir);
  const configPath = join16(dataDir, "config.json");
  const config = existsSync15(configPath) ? JSON.parse(readFileSync9(configPath, "utf8")) : DEFAULT_CONFIG;
  const cleanupService = new CleanupService2(db, {
    retentionDays: config.retentionDays || 90,
    cleanupEnabled: true,
    cleanupTime: config.cleanupTime || "02:00"
  });
  const results = await cleanupService.runCleanup();
  console.log(`Cleanup complete: ${results.deleted} messages deleted, ${results.archived} teams archived`);
  db.close();
  process.exit(0);
});
program.parse();
//# sourceMappingURL=cli.js.map
