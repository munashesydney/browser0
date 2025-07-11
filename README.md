# Browser0 - AI Browser Automation Platform 🤖🌐

Browser0 is an advanced AI-powered browser automation platform that combines the power of large language models with real browser control through the Model Context Protocol (MCP). Built with Remix, TypeScript, and integrated with Claude AI and Microsoft Playwright.

![Browser0 Screenshot](https://via.placeholder.com/800x400?text=Browser0+AI+Browser+Automation)

## ✨ Features

### 🎯 Core Capabilities
- **AI-Powered Browser Control** - Claude AI can directly control browsers through MCP
- **Real-time Browser Sessions** - Each chat gets a dedicated browser instance
- **Accessibility-First Automation** - Uses structured page data instead of visual recognition
- **Comprehensive Tool Suite** - Full Playwright API access through MCP
- **Persistent Chat History** - All conversations and browser sessions are saved

### 🔧 Browser Automation Tools
- **Navigation**: URL navigation, back/forward, page control
- **Page Analysis**: Accessibility snapshots, screenshots, network monitoring
- **Element Interaction**: Clicking, typing, form filling, drag & drop
- **Advanced Actions**: File uploads, dialog handling, keyboard input
- **Data Extraction**: Structured data extraction from web pages

### 🛡️ Security & Reliability
- **Robust Error Handling** - Comprehensive error recovery and retry logic
- **Input Validation** - All inputs are sanitized and validated
- **Connection Management** - Automatic cleanup and resource management
- **Rate Limiting** - Built-in protections against abuse

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Browserize API key ([Get one here](https://browserize.com))
- Anthropic API key ([Get one here](https://console.anthropic.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/munashesydney/browser0
   cd browser0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```bash
   BROWSERIZE_API_KEY=your_browserize_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   DATABASE_URL=postgresql://postgres:password@db:5432/browser0
   ```

4. **Start with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```
   
   The application will be available at `http://localhost:3001`

5. **Or run locally** (coming soon)
   ```bash
   npm run dev
   ```
   
   Available at `http://localhost:3000`

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/Remix) │    │   (Node.js)     │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Chat Interface│    │ • MCP Client    │    │ • Browserize    │
│ • Browser View  │    │ • Claude API    │    │ • Playwright    │
│ • Sidebar       │    │ • Database      │    │ • PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### MCP Integration Flow
1. User sends message → Chat API
2. System retrieves MCP URL from database
3. Connects to Playwright MCP server
4. Loads available browser automation tools
5. Sends tools to Claude AI
6. Claude executes browser actions as needed
7. Results are processed and returned to user

## 📖 Usage Examples

### Basic Website Navigation
```
User: "Go to google.com and search for 'artificial intelligence'"

AI Response: I'll help you navigate to Google and search for that term.
[Executes: browser_navigate, browser_snapshot, browser_type, browser_click]
✅ Successfully searched for "artificial intelligence" on Google.
```

### Form Automation
```
User: "Fill out the contact form on example.com with name 'John Doe' and email 'john@example.com'"

AI Response: I'll navigate to the site and fill out the contact form for you.
[Executes: browser_navigate, browser_snapshot, browser_type, browser_click]
✅ Contact form submitted successfully.
```

### Data Extraction
```
User: "Get me the top 5 headlines from Hacker News"

AI Response: I'll extract the latest headlines from Hacker News.
[Executes: browser_navigate, browser_snapshot]
✅ Here are the top 5 headlines: [structured data follows]
```

## 🛠️ Development

### Project Structure
```
browser0/
├── app/
│   ├── components/        # React components
│   ├── routes/           # Remix routes & API endpoints
│   ├── utils/           # Utility functions
│   │   ├── mcp.server.ts       # MCP client implementation
│   │   ├── anthropic.server.ts # Claude AI integration
│   │   ├── browserize.server.ts # Browser provisioning
│   │   └── db.server.ts        # Database utilities
│   └── styles/          # CSS styles
├── docker-compose.yml   # Docker configuration
├── MCP-INTEGRATION.md   # Detailed MCP documentation
└── README.md           # This file
```

### Key Technologies
- **Frontend**: React, Remix, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL, Docker
- **AI Integration**: Anthropic Claude, Model Context Protocol (MCP)
- **Browser Automation**: Microsoft Playwright MCP Server
- **Infrastructure**: Browserize (managed browser instances)

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
BROWSERIZE_API_KEY=your_browserize_api_key    # Browser provisioning
ANTHROPIC_API_KEY=your_anthropic_api_key      # Claude AI
DATABASE_URL=postgresql://user:pass@host:port/db  # PostgreSQL

# Optional
NODE_ENV=production                           # Environment
PORT=3000                                    # Server port
```

### MCP Configuration
The MCP client is automatically configured with:
- **Connection Retries**: 3 attempts with exponential backoff
- **Timeout**: 15 seconds per connection attempt
- **Auto-cleanup**: 30-minute session timeout
- **Security**: Input validation and sanitization

## 🚨 Troubleshooting

### Common Issues

**"Failed to connect to MCP server"**
- Wait 10-30 seconds after creating a chat (browser provisioning time)
- Check your BROWSERIZE_API_KEY
- Verify internet connectivity

**"Tool not found" errors**
- Ensure browser is fully started
- Check browser status in database
- Review server logs for connection details

**Connection timeouts**
- Network connectivity issues
- Try refreshing the chat
- Check Browserize service status

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=mcp:* npm run dev
```

## 📚 Documentation

- **[MCP Integration Guide](./MCP-INTEGRATION.md)** - Comprehensive MCP documentation
- **[API Reference](./docs/api.md)** - Backend API documentation
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Include comprehensive logging
- Write clear commit messages
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) - Browser automation tools
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI tool integration standard
- [Anthropic Claude](https://www.anthropic.com/) - AI language model
- [Browserize](https://browserize.com/) - Managed browser infrastructure
- [Remix](https://remix.run/) - Full-stack web framework

## 📞 Support

- **Documentation**: Check the [MCP Integration Guide](./MCP-INTEGRATION.md)
- **Issues**: Open an issue on GitHub
- **Discussions**: Join our community discussions

---

**Built with ❤️ for the future of AI-powered web automation**
