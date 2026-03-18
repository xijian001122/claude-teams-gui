import type { ApiResponse } from '@shared/types';

// 从 Vite 插件注入的后端端口（来自配置文件）
// 在构建时，Vite 会将 import.meta.env.VITE_BACKEND_PORT 替换为实际端口值
const CONFIG_BACKEND_PORT = (import.meta as any).env?.VITE_BACKEND_PORT || null;
const CONFIG_BACKEND_HOST = (import.meta as any).env?.VITE_BACKEND_HOST || 'localhost';

// 后端端口发现 - 尝试常见端口
async function discoverBackendPort(): Promise<string> {
  // 如果注入了配置端口，优先使用
  if (CONFIG_BACKEND_PORT) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 500);
      const res = await fetch(`http://${CONFIG_BACKEND_HOST}:${CONFIG_BACKEND_PORT}/api/settings`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        console.log(`[API] Using backend port from config: ${CONFIG_BACKEND_PORT}`);
        return CONFIG_BACKEND_PORT;
      }
    } catch {
      // 配置端口不可用，尝试发现
    }
  }

  // 尝试常见端口
  const ports = [4558, 8888, 8889, 9000, 9999];
  for (const port of ports) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 500);
      const res = await fetch(`http://localhost:${port}/api/settings`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        console.log(`[API] Discovered backend on port ${port}`);
        return String(port);
      }
    } catch {
      // Port not available, try next
    }
  }
  console.warn('[API] Could not discover backend, using default port 4558');
  return '4558';
}

// 存储发现的后端端口
let discoveredPort: string | null = null;

// 端口发现 Promise
let portDiscoveryPromise: Promise<string> | null = null;

// 获取后端端口（同步，用于已知端口后的调用）
export function getBackendPort(): string {
  return discoveredPort || '4558';
}

// 初始化端口发现
export async function initBackendPort(): Promise<string> {
  if (discoveredPort) {
    return discoveredPort;
  }
  if (!portDiscoveryPromise) {
    portDiscoveryPromise = discoverBackendPort().then(port => {
      discoveredPort = port;
      return port;
    });
  }
  return portDiscoveryPromise;
}

// 构建 API 基础 URL
function getApiBase(): string {
  const port = getBackendPort();
  return `http://localhost:${port}/api`;
}

async function request<T>(
  method: string,
  path: string,
  body?: any
): Promise<ApiResponse<T>> {
  const API_BASE = getApiBase();
  const url = `${API_BASE}${path}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: any) => request<T>('POST', path, body),
  put: <T>(path: string, body: any) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path)
};

export default api;
