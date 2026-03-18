import { useState, useEffect } from 'preact/hooks';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPage } from './components/SettingsPage';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import type { Team, Message, ConfigChange } from '@shared/types';
import { api } from './utils/api';

export function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [crossTeamTargets, setCrossTeamTargets] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Config hot-reload state
  const [pendingConfigRestart, setPendingConfigRestart] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ConfigChange[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { lastMessage, connected } = useWebSocket();

  // Load teams on mount
  useEffect(() => {
    loadTeams();
    loadCrossTeamTargets();
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

    // Handle server restarting event
    if (lastMessage.type === 'server_restarting') {
      console.log('[App] Server restarting with new port:', lastMessage.newPort);
      if (lastMessage.newPort) {
        // Store new port for reconnection
        localStorage.setItem('serverPort', String(lastMessage.newPort));
      }
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

  // Load messages when team changes
  useEffect(() => {
    if (currentTeam) {
      loadMessages(currentTeam);
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
    // This will be handled by the InputBox component
    console.log('Avatar clicked:', memberName);
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
          team={teams.find(t => t.name === currentTeam) || null}
          messages={messages.get(currentTeam || '') || []}
          crossTeamTargets={crossTeamTargets.filter(t => t.name !== currentTeam)}
          onSendMessage={handleSendMessage}
          onAvatarClick={handleAvatarClick}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}
