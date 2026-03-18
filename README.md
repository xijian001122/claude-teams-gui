# Claude Chat

Visual chat interface for Claude Code Teams - a WeChat-like messaging experience for AI agent collaboration.

## Features

- **Real-time Chat**: WebSocket-based messaging with instant updates
- **Team Management**: View and switch between multiple Claude Teams
- **Mentions**: @ mention team members with autocomplete
- **Themes**: Light and dark mode support
- **Persistent Storage**: Independent data storage that survives team deletion
- **Archive**: Access archived team conversations
- **Desktop Notifications**: Get notified of new messages

## Quick Start

### Installation

```bash
npm install -g claude-chat
```

### Usage

```bash
# Start the server
claude-chat

# Or with options
claude-chat --port 8080 --data ~/my-chat-data
```

The interface will automatically open in your browser at `http://localhost:3456`.

## Documentation

- [Requirements](./docs/requirements.md) - Feature requirements and user stories
- [Development](./docs/development.md) - Architecture and development guide
- [Quick Start](./docs/quickstart.md) - Detailed usage instructions

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Browser UI    │ ◄────────────────► │  Node.js Server │
│  (Preact + WS)  │                    │  (Fastify + WS) │
└─────────────────┘                    └────────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────┐
                    │                           │           │
                    ▼                           ▼           ▼
            ┌──────────────┐           ┌──────────────┐ ┌──────────┐
            │   SQLite DB  │           │  Claude FS   │ │  Cleanup │
            │  (messages)  │           │  (sync)      │ │  (cron)  │
            └──────────────┘           └──────────────┘ └──────────┘
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT
