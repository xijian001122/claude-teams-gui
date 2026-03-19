import { useState, useCallback } from 'preact/hooks';
import type { Message } from '@shared/types';
import { Icon } from './Icon';

interface JsonMessageCardProps {
  message: Message;
  onPermissionResponse?: (requestId: string, approve: boolean) => Promise<void>;
}

type PermissionStatus = 'pending' | 'approved' | 'rejected';

interface PermissionRequestData {
  type: 'permission_request';
  request_id: string;
  agent_id: string;
  tool?: string;
  tool_name?: string;
  description: string;
  prompt?: string;
  status?: PermissionStatus;
  response?: boolean;
}

interface TaskAssignmentData {
  type: 'task_assignment';
  task_id: string;
  agent_id: string;
  subject: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
}

interface IdleNotificationData {
  type: 'idle_notification';
  agent_id: string;
  from?: string;
  duration?: number;
}

interface TaskCompletedData {
  type: 'task_completed';
  task_id: string;
  agent_id: string;
  subject: string;
}

interface ShutdownNotificationData {
  type: 'shutdown_notification';
  agent_id: string;
  reason?: string;
}

interface PlanData {
  type: 'plan';
  title: string;
  steps: string[];
}

interface ResponseData {
  type: 'response';
  request_id: string;
  status: 'success' | 'error';
  message?: string;
}

interface ErrorData {
  type: 'error';
  message: string;
  code?: string;
}

interface ShutdownRequestData {
  type: 'shutdown_request';
  reason?: string;
}

interface ShutdownApprovedData {
  type: 'shutdown_approved';
  requestId: string;
  from: string;
  timestamp?: string;
  paneId?: string;
  backendType?: string;
}

interface PermissionResponseData {
  type: 'permission_response';
  request_id: string;
  subtype: 'success' | 'error';
  response?: {
    approved: boolean;
    timestamp?: string;
  };
  message?: string;
}

type JsonMessageData =
  | PermissionRequestData
  | TaskAssignmentData
  | IdleNotificationData
  | TaskCompletedData
  | ShutdownNotificationData
  | ShutdownRequestData
  | ShutdownApprovedData
  | PlanData
  | ResponseData
  | ErrorData
  | PermissionResponseData;

const typeIcons: Record<string, string> = {
  permission_request: 'lock',
  permission_response: 'check-circle',
  task_assignment: 'clipboard-list',
  idle_notification: 'moon',
  task_completed: 'check-circle',
  shutdown_notification: 'octagon',
  shutdown_request: 'power',
  shutdown_approved: 'power-off',
  plan: 'bar-chart-2',
  response: 'arrow-left',
  error: 'alert-circle',
};

const typeLabels: Record<string, string> = {
  permission_request: '权限请求',
  permission_response: '权限响应',
  task_assignment: '任务分配',
  idle_notification: '空闲通知',
  task_completed: '任务完成',
  shutdown_notification: '关闭通知',
  shutdown_request: '关机请求',
  shutdown_approved: '关机确认',
  plan: '计划',
  response: '响应',
  error: '错误',
};

const typeClasses: Record<string, string> = {
  permission_request: 'permission',
  permission_response: 'response',
  task_assignment: 'task',
  idle_notification: 'idle',
  task_completed: 'response',
  shutdown_notification: 'shutdown',
  shutdown_request: 'shutdown',
  shutdown_approved: 'shutdown',
  plan: 'plan',
  response: 'response',
  error: 'error',
};

// Syntax highlight for JSON
function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(?:[^"\\]|\\.)*")/g,
      '<span class="json-string">$1</span>'
    )
    .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
    .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="json-number">$1</span>')
    .replace(
      /("[^"]*")\s*:/g,
      '<span class="json-key">$1</span>:'
    );
}

interface PermissionRequestCardProps {
  prData: PermissionRequestData;
  onPermissionResponse?: (requestId: string, approve: boolean) => Promise<void>;
}

function PermissionRequestCard({ prData, onPermissionResponse }: PermissionRequestCardProps) {
  const [status, setStatus] = useState<PermissionStatus>(prData.status || 'pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = useCallback(async () => {
    if (!onPermissionResponse || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onPermissionResponse(prData.request_id, true);
      setStatus('approved');
    } catch (err) {
      console.error('Failed to approve permission:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [prData.request_id, onPermissionResponse, isSubmitting]);

  const handleReject = useCallback(async () => {
    if (!onPermissionResponse || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onPermissionResponse(prData.request_id, false);
      setStatus('rejected');
    } catch (err) {
      console.error('Failed to reject permission:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [prData.request_id, onPermissionResponse, isSubmitting]);

  return (
    <div className="permission-request-content">
      <div className="json-title">{prData.description || '权限请求'}</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">请求者:</span>
          <span className="json-field-value">{prData.agent_id || 'Unknown'}</span>
        </div>
        <div className="json-field">
          <span className="json-field-label">工具:</span>
          <span className="json-field-value mono">{prData.tool_name || prData.tool || 'N/A'}</span>
        </div>
        <div className="json-field">
          <span className="json-field-label">请求ID:</span>
          <span className="json-field-value mono">{prData.request_id || 'N/A'}</span>
        </div>
      </div>
      {prData.prompt && (
        <div className="json-description">{prData.prompt}</div>
      )}
      {status === 'pending' && (
        <div className="json-actions">
          <button
            className="json-btn json-btn-approve"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            {isSubmitting ? '处理中...' : '批准'}
          </button>
          <button
            className="json-btn json-btn-reject"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            {isSubmitting ? '处理中...' : '拒绝'}
          </button>
        </div>
      )}
      {status !== 'pending' && (
        <div className="json-status-badge-container">
          <span className={`json-status-badge ${status}`}>
            {status === 'approved' ? '已批准' : '已拒绝'}
          </span>
        </div>
      )}
    </div>
  );
}

function renderTaskAssignment(data: TaskAssignmentData) {
  return (
    <div className="task-assignment-content">
      <div className="json-title">{data.subject || '任务分配'}</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">分配给:</span>
          <span className="json-field-value">{data.agent_id || 'Unknown'}</span>
        </div>
        <div className="json-field">
          <span className="json-field-label">任务ID:</span>
          <span className="json-field-value mono">{data.task_id || 'N/A'}</span>
        </div>
        {data.priority && (
          <div className="json-field">
            <span className="json-field-label">优先级:</span>
            <span className={`json-field-value priority-${data.priority}`}>
              {data.priority === 'high' ? '高' : data.priority === 'medium' ? '中' : '低'}
            </span>
          </div>
        )}
        {data.deadline && (
          <div className="json-field">
            <span className="json-field-label">截止:</span>
            <span className="json-field-value">
              {new Date(data.deadline).toLocaleString()}
            </span>
          </div>
        )}
      </div>
      {data.description && (
        <div className="json-description">{data.description}</div>
      )}
    </div>
  );
}

function renderIdleNotification(data: IdleNotificationData) {
  return (
    <div className="idle-notification-content">
      <div className="json-title">空闲通知</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">Agent:</span>
          <span className="json-field-value">{data.agent_id || data.from || 'Unknown'}</span>
        </div>
        {data.duration && (
          <div className="json-field">
            <span className="json-field-label">空闲时长:</span>
            <span className="json-field-value">{data.duration} 分钟</span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderTaskCompleted(data: TaskCompletedData) {
  return (
    <div className="task-completed-content">
      <div className="json-title">{data.subject || '任务完成'}</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">完成者:</span>
          <span className="json-field-value">{data.agent_id || 'Unknown'}</span>
        </div>
        <div className="json-field">
          <span className="json-field-label">任务ID:</span>
          <span className="json-field-value mono">{data.task_id || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

function renderShutdownNotification(data: ShutdownNotificationData) {
  return (
    <div className="shutdown-notification-content">
      <div className="json-title">关闭通知</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">Agent:</span>
          <span className="json-field-value">{data.agent_id || 'Unknown'}</span>
        </div>
        {data.reason && (
          <div className="json-description">{data.reason}</div>
        )}
      </div>
    </div>
  );
}

function renderShutdownRequest(data: ShutdownRequestData) {
  return (
    <div className="shutdown-request-content">
      <div className="json-title">关机请求</div>
      <div className="json-fields">
        {data.reason && (
          <div className="json-description">{data.reason}</div>
        )}
      </div>
    </div>
  );
}

function renderShutdownApproved(data: ShutdownApprovedData) {
  return (
    <div className="shutdown-approved-content">
      <div className="json-title">关机确认</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">来自:</span>
          <span className="json-field-value">{data.from || 'Unknown'}</span>
        </div>
        {data.requestId && (
          <div className="json-field">
            <span className="json-field-label">请求ID:</span>
            <span className="json-field-value mono">{data.requestId}</span>
          </div>
        )}
        {data.backendType && (
          <div className="json-field">
            <span className="json-field-label">后端类型:</span>
            <span className="json-field-value">{data.backendType}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderPlan(data: PlanData) {
  return (
    <div className="plan-content">
      <div className="json-title">{data.title || '计划'}</div>
      {data.steps && data.steps.length > 0 && (
        <div className="json-tag-group">
          {data.steps.map((step, index) => (
            <span key={index} className="json-tag">{index + 1}. {step}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function renderResponse(data: ResponseData) {
  return (
    <div className="response-content">
      <div className="json-title">响应</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">请求ID:</span>
          <span className="json-field-value mono">{data.request_id || 'N/A'}</span>
        </div>
        <div className="json-field">
          <span className="json-field-label">状态:</span>
          <span className={`json-field-value status-${data.status}`}>
            {data.status === 'success' ? '成功' : '失败'}
          </span>
        </div>
      </div>
      {data.message && (
        <div className="json-description">{data.message}</div>
      )}
    </div>
  );
}

function renderPermissionResponse(data: PermissionResponseData) {
  const isApproved = data.response?.approved ?? null;
  return (
    <div className="response-content">
      <div className="json-title">权限响应</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">请求ID:</span>
          <span className="json-field-value mono">{data.request_id || 'N/A'}</span>
        </div>
        <div className="json-field">
          <span className="json-field-label">状态:</span>
          <span className={`json-field-value status-${data.subtype}`}>
            {data.subtype === 'success' ? '成功' : '失败'}
          </span>
        </div>
        {isApproved !== null && (
          <div className="json-field">
            <span className="json-field-label">结果:</span>
            <span className={`json-status-badge ${isApproved ? 'approved' : 'rejected'}`}>
              {isApproved ? '已批准' : '已拒绝'}
            </span>
          </div>
        )}
      </div>
      {data.message && (
        <div className="json-description">{data.message}</div>
      )}
    </div>
  );
}

function renderError(data: ErrorData) {
  return (
    <div className="error-content">
      <div className="json-title">错误</div>
      <div className="json-fields">
        <div className="json-field">
          <span className="json-field-label">消息:</span>
          <span className="json-field-value">{data.message || 'Unknown error'}</span>
        </div>
        {data.code && (
          <div className="json-field">
            <span className="json-field-label">代码:</span>
            <span className="json-field-value mono">{data.code}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderUnknown(data: unknown) {
  return (
    <div className="unknown-content">
      <div className="json-title">未知消息类型</div>
      <div className="json-description">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}

export function JsonMessageCard({ message, onPermissionResponse }: JsonMessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse JSON content
  let data: JsonMessageData | null = null;
  try {
    data = JSON.parse(message.content) as JsonMessageData;
  } catch {
    return (
      <div className="json-message-card error">
        <div className="json-body">
          <div className="json-title">无效的 JSON 消息</div>
          <div className="json-description">{message.content}</div>
        </div>
      </div>
    );
  }

  const type = data?.type || 'unknown';
  const typeClass = typeClasses[type] || 'error';
  const icon = typeIcons[type] || '📄';
  const label = typeLabels[type] || '未知类型';

  // Render different content based on message type
  const renderContent = () => {
    switch (type) {
      case 'permission_request':
        return <PermissionRequestCard prData={data as PermissionRequestData} onPermissionResponse={onPermissionResponse} />;
      case 'task_assignment':
        return renderTaskAssignment(data as TaskAssignmentData);
      case 'idle_notification':
        return renderIdleNotification(data as IdleNotificationData);
      case 'task_completed':
        return renderTaskCompleted(data as TaskCompletedData);
      case 'shutdown_notification':
        return renderShutdownNotification(data as ShutdownNotificationData);
      case 'shutdown_request':
        return renderShutdownRequest(data as ShutdownRequestData);
      case 'shutdown_approved':
        return renderShutdownApproved(data as ShutdownApprovedData);
      case 'plan':
        return renderPlan(data as PlanData);
      case 'response':
        return renderResponse(data as ResponseData);
      case 'permission_response':
        return renderPermissionResponse(data as PermissionResponseData);
      case 'error':
        return renderError(data as ErrorData);
      default:
        return renderUnknown(data);
    }
  };

  return (
    <div className={`json-message-card ${typeClass}`}>
      <div className="json-header">
        <div className="json-type">
          <span className="json-type-icon"><Icon icon={icon} size={18} /></span>
          <span>{label}</span>
        </div>
        {type === 'permission_request' && (
          <span className={`json-status ${(data as PermissionRequestData).status || 'pending'}`}>
            {(data as PermissionRequestData).status === 'approved'
              ? '已批准'
              : (data as PermissionRequestData).status === 'rejected'
              ? '已拒绝'
              : '待处理'}
          </span>
        )}
      </div>
      <div className="json-body">
        {renderContent()}
        <button
          className={`json-toggle ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="json-toggle-icon"><Icon icon={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} /></span>
          <span>{isExpanded ? '收起 JSON' : '查看 JSON'}</span>
        </button>
        <div className={`json-code-wrapper ${isExpanded ? 'expanded' : ''}`}>
          <div className="json-code">
            <pre
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(JSON.stringify(data, null, 2)),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default JsonMessageCard;
