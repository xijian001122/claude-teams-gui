import { useState } from 'preact/hooks';

interface ToolUseCardProps {
  toolName: string;
  toolInput: object;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function ToolUseCard({ toolName, toolInput, isExpanded, onToggle }: ToolUseCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  const input = toolInput as any;

  // Special rendering for SendMessage
  if (toolName === 'SendMessage' || toolName === 'SendMessage') {
    const summary = input?.summary || '';
    const content = input?.content || '';
    const to = input?.to || '';
    const type = input?.type || '';

    return (
      <div className="my-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
        {/* Header with summary */}
        <button
          onClick={handleToggle}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
        >
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.269a2.25 2.25 0 013.182 1.898l2.028.813a2.25 2.25 0 001.423-1.423L12 6l.259 1.035a2.25 2.25 0 002.456 2.456L15.75 9l-1.035.259a2.25 2.25 0 00-2.456 2.456L12 12z" />
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {summary || '发送消息'}
            </span>
            {to && (
              <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">
                → {to}
              </span>
            )}
          </div>
          <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto flex-shrink-0">
            {expanded ? '收起' : '展开'}
          </span>
        </button>

        {/* Content */}
        {expanded && (
          <div className="px-3 pb-3 border-t border-blue-200 dark:border-blue-800">
            {content && (
              <div className="pt-2 text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap break-words">
                {content}
              </div>
            )}
            {/* Toggle raw JSON */}
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="mt-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <svg className={`w-3 h-3 transition-transform ${showRaw ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              {showRaw ? '隐藏 JSON' : '查看原始 JSON'}
            </button>
            {showRaw && (
              <pre className="mt-1 text-xs bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto border border-blue-200 dark:border-blue-800">
                <code className="text-blue-800 dark:text-blue-200">{JSON.stringify(toolInput, null, 2)}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  // Extract description for tools that have it (Bash, etc.)
  const toolDescription = input?.description || '';
  const displayTitle = toolDescription ? `${toolName} — ${toolDescription}` : toolName;

  // Format JSON with indentation
  // Truncate large inputs to prevent UI overflow
  const formattedInput = JSON.stringify(toolInput, null, 2);
  const truncatedInput = formattedInput.length > 2000
    ? formattedInput.slice(0, 2000) + '\n... (内容已截断)'
    : formattedInput;

  // Get tool icon based on name
  const getToolIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
      'Read': 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      'Edit': 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
      'Write': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      'Bash': 'M8.25 9v6m9-6v6m-3-3V9m-9 3h18M5.25 19.5h13.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25z',
      'Glob': 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
      'Grep': 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
      'Agent': 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
      'Task': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'WebFetch': 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
      'WebSearch': 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
      'Skill': 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
    };
    return iconMap[name] || 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
  };

  return (
    <div className="my-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
      >
        <svg
          className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
        <svg
          className="w-4 h-4 text-purple-600 dark:text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getToolIcon(toolName)} />
        </svg>
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
          {displayTitle}
        </span>
        <span className="text-xs text-purple-500 dark:text-purple-400 ml-auto">
          {expanded ? '收起' : '展开'}
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-purple-200 dark:border-purple-800">
          <div className="pt-2">
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
              输入参数
            </div>
            <pre className="text-xs bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto overflow-y-auto max-h-[200px] border border-purple-200 dark:border-purple-800 whitespace-pre-wrap break-all">
              <code className="text-purple-800 dark:text-purple-200">{truncatedInput}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolUseCard;
