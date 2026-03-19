import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Dynamic configuration from environment variables
const CLIENT_PORT = parseInt(process.env.CLIENT_PORT || '4559', 10);
const CLIENT_HOST = process.env.CLIENT_HOST || 'localhost';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '4558', 10);

// 读取配置文件中实际的后端端口
function getBackendPortFromConfig(): number {
  const configPath = `${process.env.HOME || '/root'}/.claude-chat/config.json`;
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.port) {
        return parseInt(String(config.port), 10);
      }
    } catch {}
  }
  return SERVER_PORT;
}

// Vite 插件：将后端端口注入到前端
function backendPortPlugin() {
  const backendPort = getBackendPortFromConfig();
  console.log(`[Vite] Backend port from config: ${backendPort}`);

  return {
    name: 'backend-port-inject',
    config() {
      return {
        define: {
          // 注入后端端口到前端代码
          'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(String(backendPort)),
          'import.meta.env.VITE_BACKEND_HOST': JSON.stringify(CLIENT_HOST)
        }
      };
    }
  };
}

export default defineConfig({
  root: 'src/client',
  plugins: [backendPortPlugin()],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'preact'`
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@client': resolve(__dirname, 'src/client'),
      '@server': resolve(__dirname, 'src/server'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/client/index.html')
      }
    }
  },
  server: {
    port: CLIENT_PORT,
    host: CLIENT_HOST
  }
});
