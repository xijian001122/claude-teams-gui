import sqlite3 from 'sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
export class DatabaseService {
    db;
    ready = false;
    constructor(dataDir) {
        // Ensure data directory exists
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }
        // Initialize database (synchronous mode for simplicity)
        const dbPath = join(dataDir, 'messages.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('[DB] Failed to open database:', err);
            }
        });
        // Initialize schema synchronously
        this.initSchemaSync();
    }
    initSchemaSync() {
        try {
            const schemaPath = join(__dirname, 'schema.sql');
            const schema = readFileSync(schemaPath, 'utf8');
            // Use exec with callback but wait for it in a blocking way
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('[DB] Failed to initialize schema:', err);
                }
                else {
                    console.log('[DB] Schema initialized');
                    this.ready = true;
                }
            });
        }
        catch (err) {
            console.error('[DB] Failed to read schema file:', err);
        }
    }
    ensureReady() {
        if (!this.ready) {
            console.warn('[DB] Database not ready, operation may fail');
        }
    }
    // Message operations
    insertMessage(message) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO messages (
          id, local_id, team, from_member, from_type, to_member,
          content, content_type, timestamp, edited_at, deleted_at,
          claude_team, claude_inbox, claude_index, claude_timestamp, metadata, original_team,
          team_instance_id, source_project
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(message.id, message.localId, message.team || 'unknown', message.from, message.fromType, message.to, message.content, message.contentType, message.timestamp, message.editedAt || null, message.deletedAt || null, message.claudeRef?.team || null, message.claudeRef?.inboxFile || null, message.claudeRef?.messageIndex || null, message.claudeRef?.timestamp || null, message.metadata ? JSON.stringify(message.metadata) : null, message.originalTeam || null, message.teamInstance || null, message.sourceProject || null, (err) => {
                stmt.finalize();
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    // Insert message and return true if it was actually inserted (new message)
    insertMessageIfNew(message) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO messages (
          id, local_id, team, from_member, from_type, to_member,
          content, content_type, timestamp, edited_at, deleted_at,
          claude_team, claude_inbox, claude_index, claude_timestamp, metadata, original_team,
          team_instance_id, source_project
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(message.id, message.localId, message.team || 'unknown', message.from, message.fromType, message.to, message.content, message.contentType, message.timestamp, message.editedAt || null, message.deletedAt || null, message.claudeRef?.team || null, message.claudeRef?.inboxFile || null, message.claudeRef?.messageIndex || null, message.claudeRef?.timestamp || null, message.metadata ? JSON.stringify(message.metadata) : null, message.originalTeam || null, message.teamInstance || null, message.sourceProject || null, function (err) {
                stmt.finalize();
                if (err)
                    reject(err);
                else
                    resolve(this.changes > 0); // Return true if a row was inserted
            });
        });
    }
    getMessages(team, options = {}) {
        return new Promise((resolve, reject) => {
            const { before, limit = 50, to, instance } = options;
            let sql = `
        SELECT * FROM messages
        WHERE team = ? AND deleted_at IS NULL
      `;
            const params = [team];
            if (before) {
                sql += ' AND timestamp < ?';
                params.push(before);
            }
            if (to !== undefined) {
                if (to === null) {
                    sql += ' AND to_member IS NULL';
                }
                else {
                    sql += ' AND to_member = ?';
                    params.push(to);
                }
            }
            if (instance !== undefined) {
                if (instance === null || instance === 'null') {
                    // Filter for messages without instance (backward compatibility)
                    sql += ' AND team_instance_id IS NULL';
                }
                else {
                    // Filter for specific instance
                    sql += ' AND team_instance_id = ?';
                    params.push(instance);
                }
            }
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            params.push(limit);
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const messages = rows.map(row => this.rowToMessage(row)).reverse();
                    resolve(messages);
                }
            });
        });
    }
    getMessageCount(team) {
        return new Promise((resolve, reject) => {
            this.db.get(`
        SELECT COUNT(*) as count FROM messages
        WHERE team = ? AND deleted_at IS NULL
      `, [team], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row?.count || 0);
            });
        });
    }
    updateMessage(id, updates) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];
            if (updates.content !== undefined) {
                fields.push('content = ?');
                values.push(updates.content);
            }
            if (updates.editedAt !== undefined) {
                fields.push('edited_at = ?');
                values.push(updates.editedAt);
            }
            if (updates.deletedAt !== undefined) {
                fields.push('deleted_at = ?');
                values.push(updates.deletedAt);
            }
            if (fields.length === 0) {
                resolve();
                return;
            }
            values.push(id);
            const sql = `UPDATE messages SET ${fields.join(', ')} WHERE id = ?`;
            this.db.run(sql, values, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    // Update permission_request message status in content JSON
    updatePermissionRequestStatus(team, requestId, status) {
        return new Promise((resolve, reject) => {
            // Find message by content containing the request_id and type permission_request
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
                    // No matching message found - permission request may have been already processed
                    resolve();
                    return;
                }
                try {
                    const content = JSON.parse(row.content);
                    if (content.type === 'permission_request' && content.request_id === requestId) {
                        content.status = status;
                        const updateSql = 'UPDATE messages SET content = ? WHERE id = ?';
                        this.db.run(updateSql, [JSON.stringify(content), row.id], (updateErr) => {
                            if (updateErr)
                                reject(updateErr);
                            else
                                resolve();
                        });
                    }
                    else {
                        resolve();
                    }
                }
                catch (parseErr) {
                    reject(parseErr);
                }
            });
        });
    }
    // Fix null teamInstance messages - update all messages with null team_instance_id
    fixNullTeamInstance(teamName) {
        return new Promise((resolve, reject) => {
            // Get the team's teamInstance
            this.db.get('SELECT team_instance_id FROM teams WHERE name = ?', [teamName], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row || !row.team_instance_id) {
                    resolve(0); // No teamInstance to set
                    return;
                }
                const teamInstance = row.team_instance_id;
                this.db.run('UPDATE messages SET team_instance_id = ? WHERE team = ? AND team_instance_id IS NULL', [teamInstance, teamName], function (updateErr) {
                    if (updateErr)
                        reject(updateErr);
                    else
                        resolve(this.changes);
                });
            });
        });
    }
    // Team operations
    upsertTeam(team) {
        return new Promise((resolve, reject) => {
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
            stmt.run(team.name, team.displayName, team.status, team.createdAt, team.archivedAt || null, team.lastActivity, team.messageCount, JSON.stringify(team.members), JSON.stringify(team.config), team.allowCrossTeamMessages ? 1 : 0, team.teamInstance || null, (err) => {
                stmt.finalize();
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    getTeams(status, acceptsCrossTeamMessages) {
        this.ensureReady();
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM teams';
            const params = [];
            const conditions = [];
            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }
            if (acceptsCrossTeamMessages !== undefined) {
                conditions.push('allow_cross_team_messages = ?');
                params.push(acceptsCrossTeamMessages ? 1 : 0);
            }
            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }
            sql += ' ORDER BY last_activity DESC';
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const teams = rows.map(row => this.rowToTeam(row));
                    resolve(teams);
                }
            });
        });
    }
    getTeam(name) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM teams WHERE name = ?', [name], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row ? this.rowToTeam(row) : null);
                }
            });
        });
    }
    updateTeamStatus(name, status, archivedAt) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        UPDATE teams SET status = ?, archived_at = ? WHERE name = ?
      `, [status, archivedAt || null, name], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    updateTeamActivity(name, lastActivity) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        UPDATE teams SET last_activity = ? WHERE name = ?
      `, [lastActivity, name], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    updateTeamCrossTeamPermission(name, allow) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        UPDATE teams SET allow_cross_team_messages = ? WHERE name = ?
      `, [allow ? 1 : 0, name], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    deleteTeam(name) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM teams WHERE name = ?', [name], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    // Cleanup operations
    deleteOldMessages(cutoffDate) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        DELETE FROM messages WHERE timestamp < ? AND deleted_at IS NOT NULL
      `, [cutoffDate], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.changes);
            });
        });
    }
    getArchivedTeams() {
        return new Promise((resolve, reject) => {
            this.db.all(`
        SELECT name, archived_at FROM teams WHERE status = 'archived'
      `, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
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
            } : undefined,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            originalTeam: row.original_team || undefined,
            teamInstance: row.team_instance_id || undefined,
            sourceProject: row.source_project || undefined
        };
    }
    rowToTeam(row) {
        const config = JSON.parse(row.config || '{}');
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
            teamInstance: row.team_instance_id || undefined
        };
    }
    close() {
        this.db.close();
    }
}
export default DatabaseService;
//# sourceMappingURL=index.js.map