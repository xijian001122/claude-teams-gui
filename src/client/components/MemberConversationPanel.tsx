import { useState, useEffect, useCallback } from 'preact/hooks';
import { api } from '../utils/api';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MemberConversation {
  memberName: string;
  sessionId: string;
  messages: ConversationMessage[];
}

interface MemberConversationPanelProps {
  teamName: string;
  memberName: string;
  onClose: () => void;
}

export function MemberConversationPanel({
  teamName,
  memberName,
  onClose
}: MemberConversationPanelProps) {
  const [conversation, setConversation] = useState<MemberConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadConversation = useCallback(async () => {
    try {
      const response = await api.get<MemberConversation>(
        `/teams/${teamName}/members/${memberName}/conversation?limit=50`
      );
      if (response.success && response.data) {
        setConversation(response.data);
        setError(null);
      } else {
        setError('无法加载对话');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamName, memberName]);

  useEffect(() => {
    setLoading(true);
    loadConversation();
  }, [loadConversation]);

  // Auto-refresh every 5 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadConversation, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadConversation]);

  const formatTime = (timestamp: string): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const truncateContent = (content: string, maxLength: number = 500): string => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[700px] max-h-[80vh] bg-[var(--bg-primary)] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border-color)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {memberName} 的上下文
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conversation?.sessionId
                  ? `Session: ${conversation.sessionId.slice(0, 8)}...`
                  : '未注册 session'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                自动刷新
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh((e.target as HTMLInputElement).checked)}
                  className="sr-only"
                />
                <div className={`w-8 h-4 rounded-full transition-colors ${
                  autoRefresh ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    autoRefresh ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            </label>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                加载中...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <svg className="w-10 h-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              <button
                onClick={loadConversation}
                className="mt-3 px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                重试
              </button>
            </div>
          ) : !conversation || conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                暂无对话历史
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                成员尚未开始对话或 session 未注册
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversation.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-[var(--bg-secondary)] text-gray-900 dark:text-white rounded-2xl rounded-bl-md border border-[var(--border-color)]'
                  } px-4 py-2.5`}>
                    {/* Role indicator */}
                    <div className={`text-[10px] font-medium mb-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {msg.role === 'user' ? '用户' : '助手'}
                      {msg.timestamp && (
                        <span className="ml-2 opacity-70">{formatTime(msg.timestamp)}</span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {truncateContent(msg.content)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {conversation ? `共 ${conversation.messages.length} 条消息` : ''}
          </span>
          <button
            onClick={loadConversation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberConversationPanel;
