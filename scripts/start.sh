#!/bin/bash
# Claude Chat 启动脚本 - 从配置文件读取端口

# 清理占用端口的进程
echo "清理占用端口的进程..."
fuser -k 4558/tcp 2>/dev/null || true
fuser -k 4559/tcp 2>/dev/null || true
sleep 1

CONFIG_PATH="${HOME}/.claude-chat/config.json"

# 读取配置（如果存在）
if [ -f "$CONFIG_PATH" ]; then
  BACKEND_PORT=$(node -e "console.log(require('$CONFIG_PATH').port || '4558')")
  CLIENT_PORT=$(node -e "console.log(require('$CONFIG_PATH').clientPort || '4559')")
  CLIENT_HOST=$(node -e "console.log(require('$CONFIG_PATH').clientHost || 'localhost')")
else
  BACKEND_PORT="4558"
  CLIENT_PORT="4559"
  CLIENT_HOST="localhost"
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                Claude Chat 配置                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  后端端口: ${BACKEND_PORT}                                          ║"
echo "║  前端端口: ${CLIENT_PORT}                                          ║"
echo "║  前端主机: ${CLIENT_HOST}                                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"

export SERVER_PORT=$BACKEND_PORT
export CLIENT_PORT=$CLIENT_PORT
export CLIENT_HOST=$CLIENT_HOST

echo ""
echo "启动服务..."
echo ""

cd /root/claude-chat

# 分别启动后端和前端
bun --hot run src/server/cli.ts &
npx vite --host $CLIENT_HOST --port $CLIENT_PORT &

# 等待
wait
