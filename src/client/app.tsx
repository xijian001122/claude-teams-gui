import { useState, useEffect } from 'preact/hooks';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPage } from './components/SettingsPage';
import { TaskPanel } from './components/TaskPanel';
import { MemberConversationPanel } from './components/MemberConversationPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import type { Team, Message, ConfigChange, MemberStatusInfo, Task, CommandsResponse } from '@shared/types';
import { api } from './utils/api';

export function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [archivedTeams, setArchivedTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [memberStatuses, setMemberStatuses] = useState<Map<string, MemberStatusInfo[]>>(new Map());
  const [crossTeamTargets, setCrossTeamTargets] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Config hot-reload state
  const [pendingConfigRestart, setPendingConfigRestart] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ConfigChange[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Tasks state for real-time updates
  const [tasks, setTasks] = useState<Map<string, Task[]>>(new Map());

  // Member context panel state
  const [viewingMemberContext, setViewingMemberContext] = useState<string | null>(null);

  // Commands state for slash command picker
  const [commands, setCommands] = useState<CommandsResponse>({ commands: [], skills: [] });

  const { theme, toggleTheme } = useTheme();
  const { lastMessage, connected } = useWebSocket();

  // Load teams and commands on mount
  useEffect(() => {
    loadTeams();
    loadArchivedTeams();
    loadCrossTeamTargets();
    loadCommands();
  }, []);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    // Handle regular messages
    if (lastMessage.team && lastMessage.message) {
      console.log('[App] Adding message from WebSocket:', lastMessage.message.id);
      addMessage(lastMessage.team, lastMessage.message);
    }

    // Handle cross-team messages
    if (lastMessage.type === 'cross_team_message' && lastMessage.team && lastMessage.message) {
      console.log('[App] Adding cross-team message:', lastMessage.message.id);
      addMessage(lastMessage.team, lastMessage.message);

      // Show notification for incoming cross-team message
      if (lastMessage.originalTeam && lastMessage.originalTeam !== currentTeam) {
        const notification = new Notification('跨团队消息', {
          body: `来自 ${lastMessage.originalTeam}: ${lastMessage.message.content.substring(0, 50)}...`,
          icon: '/favicon.ico'
        });
        notification.onclick = () => {
          setCurrentTeam(lastMessage.team);
        };
      }
    }

    // Handle cross-team message sent confirmation
    if (lastMessage.type === 'cross_team_message_sent' && lastMessage.message && lastMessage.team) {
      console.log('[App] Cross-team message sent confirmation:', lastMessage.message.id);
      addMessage(lastMessage.team, lastMessage.message);
    }

    // Handle config updated event
    if (lastMessage.type === 'config_updated') {
      console.log('[App] Config updated:', lastMessage.changes);
      setPendingChanges(lastMessage.changes || []);
      setPendingConfigRestart(lastMessage.pendingRestart || false);

      // Show notification for config changes requiring restart
      if (lastMessage.pendingRestart) {
        const restartKeys = lastMessage.changes
          ?.filter((c: ConfigChange) => c.requiresRestart)
          .map((c: ConfigChange) => c.key)
          .join(', ');
        if (restartKeys) {
          console.log(`[App] Config changes require restart: ${restartKeys}`);
        }
      }
    }

    // Handle member status updates
    if (lastMessage.type === 'member_status' && lastMessage.team && lastMessage.members) {
      console.log('[App] Member status update for team:', lastMessage.team, lastMessage.members);
      setMemberStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(lastMessage.team, lastMessage.members);
        return newMap;
      });
    }

    // Handle server restarting event
    if (lastMessage.type === 'server_restarting') {
      console.log('[App] Server restarting with new port:', lastMessage.newPort);
      if (lastMessage.newPort) {
        // Store new port for reconnection
        localStorage.setItem('serverPort', String(lastMessage.newPort));
      }
    }

    // Handle team instance changed event
    if (lastMessage.type === 'team_instance_changed' && lastMessage.team) {
      console.log('[App] Team instance changed:', lastMessage.team, 'new instance:', lastMessage.newInstance);
      // Clear cached messages for this team so the new instance starts fresh
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(lastMessage.team);
        return newMap;
      });
      // Reload messages for the team with the new instance
      loadMessages(lastMessage.team);
    }

    // Handle team archived event
    if (lastMessage.type === 'team_archived' && lastMessage.team) {
      console.log('[App] Team archived:', lastMessage.team);
      // Reload archived teams list from API to ensure consistency
      loadArchivedTeams();
      // Also reload active teams (archived team will be removed from active list)
      loadTeams();
    }

    // Handle team added event
    if (lastMessage.type === 'team_added' && lastMessage.team) {
      console.log('[App] Team added:', lastMessage.team.name);
      // Reload teams list to include the new team
      loadTeams();
      // Reload cross-team targets as new team may accept cross-team messages
      loadCrossTeamTargets();
    }

    // Handle members updated event
    if (lastMessage.type === 'members_updated' && lastMessage.team && lastMessage.members) {
      console.log('[App] Members updated for team:', lastMessage.team);
      // Update the team's members in state
      setTeams(prev => prev.map(t =>
        t.name === lastMessage.team
          ? { ...t, members: lastMessage.members }
          : t
      ));
    }

    // Handle task created event
    if (lastMessage.type === 'task_created' && lastMessage.task && lastMessage.team) {
      console.log('[App] Task created:', lastMessage.task.id, 'for team:', lastMessage.team);

      const { task, team } = lastMessage;

      // Only add task if it belongs to current team (team filtering)
      if (team !== currentTeam) {
        console.log('[App] Task created for different team, ignoring:', team);
        return;
      }

      // Add task to state with deduplication
      setTasks(prev => {
        const teamTasks = prev.get(team) || [];

        // Check for duplicate task ID
        if (teamTasks.some(t => t.id === task.id)) {
          console.log('[App] Task already exists, skipping:', task.id);
          return prev;
        }

        // Add new task to the list
        const newMap = new Map(prev);
        newMap.set(team, [...teamTasks, task]);
        console.log('[App] Added new task to team:', team, 'Total tasks:', teamTasks.length + 1);
        return newMap;
      });
    }
  }, [lastMessage?.timestamp]); // Use timestamp to ensure re-trigger

  const loadTeams = async () => {
    try {
      const response = await api.get('/teams');
      const data = response.data as { teams?: Team[] };
      if (data?.teams) {
        setTeams(data.teams);
        if (data.teams.length > 0 && !currentTeam) {
          setCurrentTeam(data.teams[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedTeams = async () => {
    try {
      const response = await api.get('/archive');
      const data = response.data as { teams?: Team[] };
      if (data?.teams) {
        setArchivedTeams(data.teams);
      }
    } catch (err) {
      console.error('Failed to load archived teams:', err);
    }
  };

  const loadCrossTeamTargets = async () => {
    try {
      const response = await api.get('/teams?acceptsCrossTeamMessages=true');
      const data = response.data as { teams?: Team[] };
      if (data?.teams) {
        setCrossTeamTargets(data.teams);
      }
    } catch (err) {
      console.error('Failed to load cross-team targets:', err);
    }
  };

  const loadCommands = async (teamName?: string) => {
    try {
      const query = teamName ? `/commands?team=${encodeURIComponent(teamName)}` : '/commands';
      const response = await api.get<CommandsResponse>(query);
      const data = (response as any).data ? (response as any).data : response;
      if (data?.commands && data?.skills) {
        setCommands(data);
      }
    } catch (err) {
      console.error('Failed to load commands:', err);
    }
  };

  const addMessage = (teamName: string, message: Message) => {
    setMessages(prev => {
      const newMap = new Map(prev);
      const teamMessages = newMap.get(teamName) || [];
      // Check for duplicates by message ID
      if (teamMessages.some(m => m.id === message.id)) {
        return prev; // Don't add duplicate
      }
      newMap.set(teamName, [...teamMessages, message]);
      return newMap;
    });
  };

  const handleSendMessage = async (content: string, to?: string) => {
    if (!currentTeam) return;

    try {
      const response = await api.post(`/teams/${currentTeam}/messages`, {
        content,
        to: to || null
      });
      const data = response.data as { message?: Message };

      // Immediately add message to local state (optimistic update)
      if (data?.message) {
        addMessage(currentTeam, data.message);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Load messages and commands when team changes
  useEffect(() => {
    if (currentTeam) {
      loadMessages(currentTeam);
      loadCommands(currentTeam);
    }
  }, [currentTeam]);

  const loadMessages = async (teamName: string) => {
    try {
      const response = await api.get(`/teams/${teamName}/messages`);
      const data = response.data as { messages?: Message[] };
      if (data?.messages) {
        setMessages(prev => {
          const newMap = new Map(prev);
          newMap.set(teamName, data.messages);
          return newMap;
        });
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleAvatarClick = (memberName: string) => {
    setViewingMemberContext(memberName);
  };

  const handleViewMemberContext = (memberName: string) => {
    setViewingMemberContext(memberName);
  };

  const handlePermissionResponse = async (requestId: string, approve: boolean, agentId: string) => {
    if (!currentTeam) return;

    try {
      // Call API to send permission response
      await api.post(`/teams/${currentTeam}/permission-response`, {
        request_id: requestId,
        approve,
        agent_id: agentId
      });

      // Update local messages state to reflect the response
      setMessages(prev => {
        const newMap = new Map(prev);
        const teamMessages = newMap.get(currentTeam) || [];
        const updatedMessages = teamMessages.map(msg => {
          try {
            const data = JSON.parse(msg.content);
            if (data.type === 'permission_request' && data.request_id === requestId) {
              // Update the permission request with the response status
              return {
                ...msg,
                content: JSON.stringify({
                  ...data,
                  status: approve ? 'approved' : 'rejected',
                  response: approve
                })
              };
            }
          } catch {
            // Not a JSON message, skip
          }
          return msg;
        });
        newMap.set(currentTeam, updatedMessages);
        return newMap;
      });
    } catch (err) {
      console.error('Failed to send permission response:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <Sidebar
        teams={teams}
        archivedTeams={archivedTeams}
        currentTeam={currentTeam}
        onSelectTeam={(team) => {
          setCurrentTeam(team);
          setShowSettings(false); // Close settings when selecting a team
        }}
        connected={connected}
        pendingConfigRestart={pendingConfigRestart}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      {showSettings ? (
        <div className="flex-1 overflow-hidden">
          <SettingsPage
            pendingConfigRestart={pendingConfigRestart}
            pendingChanges={pendingChanges}
            onRestartComplete={() => {
              setPendingConfigRestart(false);
              setPendingChanges([]);
            }}
          />
        </div>
      ) : (
        <ChatArea
          team={
            teams.find(t => t.name === currentTeam) ||
            archivedTeams.find(t => t.name === currentTeam) ||
            null
          }
          messages={messages.get(currentTeam || '') || []}
          memberStatuses={memberStatuses.get(currentTeam || '') || []}
          crossTeamTargets={crossTeamTargets.filter(t => t.name !== currentTeam)}
          archivedTeams={archivedTeams}
          commands={commands}
          onSendMessage={handleSendMessage}
          onAvatarClick={handleAvatarClick}
          theme={theme}
          onToggleTheme={toggleTheme}
          onPermissionResponse={handlePermissionResponse}
          onViewMemberContext={handleViewMemberContext}
        />
      )}

      {/* Task Panel */}
      <TaskPanel currentTeam={currentTeam} tasks={tasks.get(currentTeam || '') || []} />

      {/* Member Conversation Panel */}
      {viewingMemberContext && currentTeam && (
        <MemberConversationPanel
          teamName={currentTeam}
          memberName={viewingMemberContext}
          commands={commands}
          onClose={() => setViewingMemberContext(null)}
        />
      )}
    </div>
  );
}

// test comment for permission trigger
