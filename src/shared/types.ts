/**
 * Shared types for Claude Chat
 */

export type MessageType =
  | 'text'
  | 'code'
  | 'markdown'
  | 'image'
  | 'file'
  | 'task'
  | 'system';

export type MemberType = 'agent' | 'user' | 'system';

export interface Message {
  id: string;
  localId: string;
  team: string;
  from: string;
  fromType: MemberType;
  to: string | null;
  content: string;
  contentType: MessageType;
  timestamp: string;
  editedAt?: string;
  deletedAt?: string;
  claudeRef?: ClaudeRef;
  metadata?: MessageMetadata;
  originalTeam?: string;
  teamInstance?: string;
  sourceProject?: string;
}

export interface ClaudeRef {
  team: string;
  inboxFile: string;
  messageIndex: number;
  timestamp: string;
}

export interface MessageMetadata {
  codeLanguage?: string;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  thumbPath?: string;
  imageWidth?: number;
  imageHeight?: number;
  taskId?: string;
}

export interface Team {
  name: string;
  displayName: string;
  status: 'active' | 'archived';
  createdAt: string;
  archivedAt?: string;
  lastActivity: string;
  messageCount: number;
  unreadCount: number;
  members: TeamMember[];
  config: TeamConfig;
  allowCrossTeamMessages: boolean;
  teamInstance?: string;
}

export interface TeamMember {
  name: string;
  displayName: string;
  role: string;
  color: string;
  avatarLetter: string;
  isOnline?: boolean;
}

export interface TeamConfig {
  theme?: 'light' | 'dark';
  notificationEnabled: boolean;
}

export interface AppConfig {
  port: number;
  host: string;
  dataDir: string;
  teamsPath: string;
  retentionDays: number;
  theme: 'light' | 'dark' | 'auto';
  desktopNotifications: boolean;
  soundEnabled: boolean;
  cleanupEnabled: boolean;
  cleanupTime: string;
}

// Config Update Types
export interface ConfigChange {
  key: string;
  oldValue: any;
  newValue: any;
  requiresRestart: boolean;
}

// Member Status Types
export interface MemberStatusInfo {
  memberName: string;
  status: 'busy' | 'idle' | 'occupied' | 'offline';
  lastActivityAt: number; // Unix timestamp ms
  statusChangedAt: number; // When status last changed
}

export interface MemberStatusMessage {
  type: 'member_status';
  members: MemberStatusInfo[];
}

export interface ConfigUpdateEvent {
  changes: ConfigChange[];
  pendingRestart: boolean;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GetMessagesQuery {
  before?: string;
  limit?: number;
  to?: string;
  instance?: string; // Filter by team instance ID
}

export interface SendMessageBody {
  content: string;
  /** Target for the message. Can be a member name or "team:<teamName>" for cross-team messaging */
  to?: string;
  contentType?: MessageType;
}

export interface UpdateMessageBody {
  content: string;
}

// Permission Response Types
export interface PermissionResponseBody {
  /** ID of the permission request being responded to */
  request_id: string;
  /** Whether the permission was approved */
  approve: boolean;
  /** Name of the agent that made the request (to write response to their inbox) */
  agent_id: string;
  /** Timestamp of the response */
  timestamp?: string;
}

// WebSocket Types
export interface ServerToClientEvents {
  new_message: (data: { team: string; message: Message }) => void;
  new_messages: (data: { team: string; messages: Message[] }) => void;
  message_updated: (data: { team: string; messageId: string; updates: Partial<Message> }) => void;
  member_online: (data: { team: string; member: string }) => void;
  member_offline: (data: { team: string; member: string }) => void;
  team_deleted: (data: { team: string }) => void;
  team_archived: (data: { team: string }) => void;
  /** Fired when a cross-team message is received from another team */
  cross_team_message: (data: { team: string; message: Message; originalTeam: string }) => void;
  /** Confirmation that a cross-team message was sent successfully */
  cross_team_message_sent: (data: { team: string; message: Message; targetTeam: string }) => void;
  /** Fired when configuration is updated */
  config_updated: (data: ConfigUpdateEvent) => void;
  /** Fired when member status changes */
  member_status: (data: { team: string; members: MemberStatusInfo[] }) => void;
  /** Fired when a team directory is recreated (new instance) */
  team_instance_changed: (data: { team: string; oldInstance: string | null; newInstance: string; sourceProject: string }) => void;
}

export interface ClientToServerEvents {
  join_team: (team: string) => void;
  leave_team: (team: string) => void;
  typing: (team: string, to?: string) => void;
  mark_read: (team: string, messageId: string) => void;
  /** Send a cross-team message to another team */
  send_cross_team_message: (data: { fromTeam: string; toTeam: string; content: string; contentType?: MessageType }) => void;
}
