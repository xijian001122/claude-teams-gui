import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { api } from '../utils/api';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolUseCard } from './ToolUseCard';
import { ThinkingBlock } from './ThinkingBlock';
import { useWebSocket } from '../hooks/useWebSocket';

type ConversationMessageType = 'text' | 'tool_use' | 'tool_result' | 'thinking';

interface ConversationMessage {
  role: 'user' | 'assistant';
  type: ConversationMessageType;
  content: string;
  toolName?: string;
  toolInput?: object;
  timestamp: string;
  senderName?: string;
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
  const [sendLoading, setSendLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const { lastMessage } = useWebSocket();
  const contentRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const next = new Set(expandedRef.current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    expandedRef.current = next;
    // Trigger re-render
    setConversation(prev => prev ? { ...prev } : prev);
  };

  // Scroll to bottom of content
  const scrollToBottom = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, []);

  const loadConversation = useCallback(async () => {
    try {
      const response = await api.get<MemberConversation>(
        `/teams/${teamName}/members/${memberName}/conversation?limit=50`
      );
      if (response.success && response.data) {
        // Default expand all collapsible items
        const allKeys = new Set<string>();
        response.data.messages.forEach((msg, i) => {
          if (msg.type === 'tool_use' || msg.type === 'tool_result' || msg.type === 'thinking') {
            allKeys.add(`${msg.type}-${i}`);
          }
        });
        expandedRef.current = allKeys;
        setConversation(response.data);
        setError(null);
        // Scroll to bottom after conversation loads
        setTimeout(scrollToBottom, 0);
      } else {
        setError('无法加载对话');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamName, memberName, scrollToBottom]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    loadConversation();
  }, [loadConversation]);

  // Real-time update via WebSocket
  useEffect(() => {
    if (!lastMessage) return;

    // Listen for new messages in the same team
    if (lastMessage.type === 'new_message' && lastMessage.team === teamName) {
      // Check if message is related to this member
      const msg = lastMessage.message;
      if (msg && (msg.from === memberName || msg.to === memberName)) {
        loadConversation();
        // Scroll to bottom after new message arrives
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [lastMessage, teamName, memberName, loadConversation, scrollToBottom]);

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

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    setSendLoading(true);
    setSendError(null);

    try {
      const response = await api.post(`/teams/${teamName}/messages`, {
        content: messageInput.trim(),
        to: memberName,
        contentType: 'text'
      });

      if (response.success) {
        setMessageInput('');
        // Refresh conversation after sending (WebSocket will also trigger update)
        await loadConversation();
      } else {
        setSendError(response.error || '发送失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送失败';
      setSendError(errorMessage);
    } finally {
      setSendLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Calculate message statistics
  const getMessageStats = () => {
    if (!conversation) return { textCount: 0, toolCount: 0, thinkingCount: 0, totalCount: 0 };

    let textCount = 0;
    let toolCount = 0;
    let thinkingCount = 0;

    conversation.messages.forEach(msg => {
      if (msg.type === 'text') textCount++;
      else if (msg.type === 'tool_use') toolCount++;
      else if (msg.type === 'thinking') thinkingCount++;
    });

    return {
      textCount,
      toolCount,
      thinkingCount,
      totalCount: conversation.messages.length
    };
  };

  // Tool result card with collapsible content
  const ToolResultCard = ({ content, itemKey }: { content: string; itemKey: string }) => {
    const expanded = expandedRef.current.has(itemKey);
    return (
      <div className="my-1 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 overflow-hidden">
        <button
          onClick={() => toggleExpanded(itemKey)}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
        >
          <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium text-green-700 dark:text-green-300">工具结果</span>
          <span className="text-xs text-green-500 dark:text-green-400 ml-auto">
            {expanded ? '收起' : '展开'}
          </span>
        </button>
        {expanded && (
          <div className="px-3 pb-3 border-t border-green-200 dark:border-green-800">
            <div className="pt-2 text-sm text-green-800 dark:text-green-200 overflow-hidden">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessageContent = (msg: ConversationMessage, index: number) => {
    const key = `${msg.type}-${index}`;
    switch (msg.type) {
      case 'tool_use':
        return (
          <ToolUseCard
            toolName={msg.toolName || 'Unknown'}
            toolInput={msg.toolInput || {}}
            isExpanded={expandedRef.current.has(key)}
            onToggle={() => toggleExpanded(key)}
          />
        );
      case 'tool_result':
        return <ToolResultCard content={msg.content} itemKey={key} />;
      case 'thinking':
        return (
          <ThinkingBlock
            content={msg.content}
            isExpanded={expandedRef.current.has(key)}
            onToggle={() => toggleExpanded(key)}
          />
        );
      case 'text':
      default:
        if (msg.role === 'assistant') {
          return <MarkdownRenderer content={msg.content} />;
        }
        // Check if user text content should be rendered as markdown
        if (msg.content.includes('**') || msg.content.includes('```') || msg.content.includes('##')) {
          return <MarkdownRenderer content={msg.content} />;
        }
        return <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>;
    }
  };

  const stats = getMessageStats();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[1200px] max-h-[85vh] bg-[var(--bg-primary)] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border-color)]">
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
            {/* Real-time indicator */}
            <span className="flex items-center gap-1.5 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              实时更新
            </span>
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
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
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
            <div className="space-y-4 overflow-x-hidden">
              {conversation.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] min-w-0 overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-[var(--bg-secondary)] text-gray-900 dark:text-white rounded-2xl rounded-bl-md border border-[var(--border-color)]'
                  } px-4 py-2.5`}>
                    {/* Role indicator */}
                    <div className={`text-sm font-semibold mb-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {msg.role === 'user'
                        ? (msg.senderName || '用户')
                        : '助手'}
                      {msg.type !== 'text' && (
                        <span className="ml-1 opacity-70">
                          {msg.type === 'tool_use' ? '[工具]' : msg.type === 'thinking' ? '[思考]' : ''}
                        </span>
                      )}
                      {msg.timestamp && (
                        <span className="ml-2 opacity-70">{formatTime(msg.timestamp)}</span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 overflow-wrap-anywhere">
                      {renderMessageContent(msg, index)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Error */}
        {sendError && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">{sendError}</p>
          </div>
        )}

        {/* Message Input Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              placeholder={`发送消息给 ${memberName}...`}
              disabled={sendLoading}
              className="flex-1 px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendLoading || !messageInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              {sendLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  发送中
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  发送
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            {conversation && (
              <>
                <span>共 {stats.totalCount} 条消息</span>
                {stats.textCount > 0 && <span className="text-blue-500">{stats.textCount} 文本</span>}
                {stats.toolCount > 0 && <span className="text-purple-500">{stats.toolCount} 工具</span>}
                {stats.thinkingCount > 0 && <span className="text-gray-500">{stats.thinkingCount} 思考</span>}
              </>
            )}
          </div>
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
