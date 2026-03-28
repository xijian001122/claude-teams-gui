import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import type { Message, ConfigChange, MemberStatusInfo, Task } from '@shared/types';
import { initBackendPort, getBackendPort } from '../utils/api';

export interface WebSocketMessage {
  team?: string;
  message?: Message;
  timestamp: number;
  type?: string;
  originalTeam?: string;
  targetTeam?: string;
  changes?: ConfigChange[];
  pendingRestart?: boolean;
  members?: MemberStatusInfo[];
  newPort?: number;
  newHost?: string;
  oldInstance?: string | null;
  newInstance?: string;
  sourceProject?: string;
  task?: Task;
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true);

  // Initialize port discovery on mount
  useEffect(() => {
    initBackendPort().then(() => {
      if (mountedRef.current) {
        setIsReady(true);
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    isConnectingRef.current = true;
    const BACKEND_PORT = getBackendPort();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:${BACKEND_PORT}/ws`;
    console.log('[WebSocket] Connecting to', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WebSocket] Connected');
        isConnectingRef.current = false;
        setConnected(true);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log('[WebSocket] Disconnected');
        isConnectingRef.current = false;
        setConnected(false);
        wsRef.current = null;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log('[WebSocket] Reconnecting...');
            connect();
          }
        }, 2000);
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Received:', data.type, data.team);

          if (data.type === 'new_message' && data.team && data.message) {
            setLastMessage({
              team: data.team,
              message: data.message,
              timestamp: Date.now(),
              type: data.type
            });
          }

          if (data.type === 'cross_team_message' && data.team && data.message) {
            setLastMessage({
              team: data.team,
              message: data.message,
              timestamp: Date.now(),
              type: data.type,
              originalTeam: data.originalTeam
            });
          }

          if (data.type === 'cross_team_message_sent' && data.team && data.message) {
            setLastMessage({
              team: data.team,
              message: data.message,
              timestamp: Date.now(),
              type: data.type,
              targetTeam: data.targetTeam
            });
          }

          if (data.type === 'config_updated') {
            setLastMessage({
              timestamp: Date.now(),
              type: data.type,
              changes: data.changes,
              pendingRestart: data.pendingRestart
            });
          }

          if (data.type === 'member_status' && data.team) {
            setLastMessage({
              timestamp: Date.now(),
              type: data.type,
              team: data.team,
              members: data.members
            });
          }

          if (data.type === 'server_restarting') {
            setLastMessage({
              timestamp: Date.now(),
              type: data.type,
              newPort: data.newPort,
              newHost: data.newHost
            });
          }

          if (data.type === 'task_created' && data.task) {
            setLastMessage({
              timestamp: Date.now(),
              type: data.type,
              team: data.team,
              task: data.task
            });
          }

          if (data.type === 'team_added' && data.team) {
            setLastMessage({
              timestamp: Date.now(),
              type: data.type,
              team: data.team.name
            });
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err);
      isConnectingRef.current = false;
    }
  }, []);

  // Connect when ready
  useEffect(() => {
    if (isReady) {
      connect();
    }
  }, [isReady, connect]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  return {
    connected,
    lastMessage,
    sendMessage,
    isReady
  };
}

export default useWebSocket;
