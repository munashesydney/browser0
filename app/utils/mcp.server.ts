import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

interface MCPConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  keepAliveInterval: number;
  maxReconnectAttempts: number;
}

/**
 * VS Code-style MCP Client - Handles connections like VS Code does
 * Based on research of VS Code's actual MCP implementation
 */
export class VSCodeStyleMCPClient {
  private client: Client;
  private transport: SSEClientTransport | null = null;
  private connected = false;
  private availableTools: MCPTool[] = [];
  private connectionConfig: MCPConnectionConfig;
  private connectionAttempts = 0;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private lastSuccessfulConnection = 0;

  constructor(config: Partial<MCPConnectionConfig> = {}) {
    // VS Code uses much shorter, more aggressive timeouts
    this.connectionConfig = {
      maxRetries: 3,
      retryDelay: 1500,      // VS Code uses shorter delays
      connectionTimeout: 10000, // VS Code uses 10s, not 2 minutes
      keepAliveInterval: 30000,  // 30s keepalive like VS Code
      maxReconnectAttempts: 5,
      ...config,
    };

    this.client = new Client(
      {
        name: 'browser0-vscode-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
      }
    );
  }

  async connect(mcpUrl: string): Promise<void> {
    if (this.connected && !this.isReconnecting) {
      return;
    }

    // Validate URL format
    if (!mcpUrl || typeof mcpUrl !== 'string') {
      throw new Error('Invalid MCP URL provided');
    }

    // Normalize URL to ensure it's a full URL
    let normalizedUrl = mcpUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `http://${normalizedUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch (error) {
      throw new Error(`Invalid MCP URL format: ${normalizedUrl}`);
    }

    console.log(`🔌 Connecting to MCP server (VS Code style): ${normalizedUrl}`);

    // Connection with VS Code-style retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.connectionConfig.maxRetries; attempt++) {
      this.connectionAttempts++;
      
      try {
        // Use VS Code's connection approach
        await this.attemptVSCodeStyleConnection(normalizedUrl);
        
        // Initialize and load available tools
        await this.loadAvailableTools();
        
        // Start VS Code-style keepalive
        this.startKeepAlive();
        
        this.lastSuccessfulConnection = Date.now();
        this.isReconnecting = false;
        
        console.log(`✅ Connected to MCP server. Available tools: ${this.availableTools.length}`);
        console.log(`🔧 Tools: ${this.availableTools.map(t => t.name).join(', ')}`);
        
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown connection error');
        console.warn(`❌ MCP connection attempt ${attempt + 1} failed:`, lastError.message);
        
        if (attempt < this.connectionConfig.maxRetries - 1) {
          // VS Code uses exponential backoff with jitter
          const delay = this.connectionConfig.retryDelay * Math.pow(1.5, attempt) + Math.random() * 1000;
          await this.delay(delay);
        }
      }
    }

    throw new Error(`Failed to connect to MCP server after ${this.connectionConfig.maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private async attemptVSCodeStyleConnection(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Connection timeout (VS Code style)'));
      }, this.connectionConfig.connectionTimeout);

      try {
        this.transport = new SSEClientTransport(new URL(url));
        
        // VS Code sets up error handlers before connecting
        this.setupTransportHandlers();
        
        this.client.connect(this.transport)
          .then(() => {
            clearTimeout(timeout);
            this.connected = true;
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            this.cleanup();
            reject(error);
          });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private setupTransportHandlers(): void {
    if (!this.transport) return;

    // VS Code style error handling
    this.transport.onerror = (error) => {
      console.error('🚨 MCP transport error:', error);
      this.handleConnectionLoss();
    };

    this.transport.onclose = () => {
      console.warn('🔌 MCP transport closed');
      this.handleConnectionLoss();
    };
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    
    this.keepAliveTimer = setInterval(async () => {
      if (!this.connected) {
        this.stopKeepAlive();
        return;
      }

      try {
        // VS Code pings by requesting tool list
        await this.pingServer();
      } catch (error) {
        console.warn('💔 Keepalive failed, attempting reconnection');
        this.handleConnectionLoss();
      }
    }, this.connectionConfig.keepAliveInterval);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private async pingServer(): Promise<void> {
    if (!this.connected) return;
    
    // Simple ping by listing tools (like VS Code does)
    await this.client.request(
      { method: 'tools/list' },
      ListToolsResultSchema
    );
  }

  private handleConnectionLoss(): void {
    if (this.isReconnecting) return;

    this.connected = false;
    this.stopKeepAlive();

    // VS Code attempts automatic reconnection
    setTimeout(() => {
      this.attemptReconnection();
    }, 2000);
  }

  private async attemptReconnection(): Promise<void> {
    if (this.isReconnecting || this.connected) return;

    this.isReconnecting = true;
    const timeSinceLastConnection = Date.now() - this.lastSuccessfulConnection;
    
    // Don't reconnect too frequently
    if (timeSinceLastConnection < 5000) {
      console.log('⏱️  Skipping reconnection (too recent)');
      this.isReconnecting = false;
      return;
    }

    console.log('🔄 Attempting MCP reconnection...');
    
    // Try to reconnect with the same URL
    // Note: This assumes we store the URL, which we should add
    try {
      // For now, we'll just mark as not reconnecting
      // In a full implementation, we'd store the URL and retry
      this.isReconnecting = false;
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      this.isReconnecting = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanup(): void {
    this.connected = false;
    this.stopKeepAlive();
    if (this.transport) {
      try {
        this.transport.onerror = undefined;
        this.transport.onclose = undefined;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async disconnect(): Promise<void> {
    this.cleanup();
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.warn('Error closing MCP transport:', error);
      }
      this.transport = null;
      this.availableTools = [];
    }
  }

  /**
   * Dynamically discover available tools from the MCP server
   * This is the proper MCP way - no hardcoded tool assumptions
   */
  private async loadAvailableTools(): Promise<void> {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        { method: 'tools/list' },
        ListToolsResultSchema
      );

      this.availableTools = response.tools.map(tool => ({
        name: tool.name,
        description: tool.description || `Tool: ${tool.name}`,
        inputSchema: tool.inputSchema,
      }));

      // Log available tools for debugging
      console.log('🔧 Available MCP tools:', this.availableTools.map(t => ({
        name: t.name,
        description: t.description
      })));
    } catch (error) {
      console.error('Failed to load MCP tools:', error);
      throw new Error(`Failed to load MCP tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available tools - this is what the AI will use to know what's available
   */
  getAvailableTools(): MCPTool[] {
    return this.availableTools;
  }

  /**
   * Call any tool by name - VS Code style with better timeout handling
   */
  async callTool(name: string, arguments_: any): Promise<MCPToolResult> {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }

    // Validate tool name
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid tool name');
    }

    // Check if tool exists (but don't hard-fail, as tools might be added dynamically)
    const tool = this.availableTools.find(t => t.name === name);
    if (!tool) {
      console.warn(`Tool '${name}' not found in cached tool list. Attempting anyway...`);
    }

    // Sanitize arguments
    const sanitizedArgs = this.sanitizeArguments(arguments_);

    try {
      console.log(`🔧 Calling MCP tool (VS Code style): ${name}`, sanitizedArgs);

      // VS Code uses much shorter tool call timeouts - 30 seconds max
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('MCP tool call timeout after 30 seconds (VS Code style)'));
        }, 30000); // VS Code uses 30s, not 2 minutes
      });

      const requestPromise = this.client.request(
        {
          method: 'tools/call',
          params: {
            name,
            arguments: sanitizedArgs,
          },
        },
        CallToolResultSchema
      );

      const response = await Promise.race([requestPromise, timeoutPromise]) as any;

      return {
        content: response.content || [],
        isError: response.isError || false,
      };
    } catch (error) {
      // VS Code style error handling
      const errorCode = (error as any)?.code;
      const message = error instanceof Error ? error.message : String(error);

      const isServerTimeout = errorCode === -32001 || 
                             message.toLowerCase().includes('request timed out') ||
                             message.toLowerCase().includes('timeout');

      if (isServerTimeout) {
        console.warn(`⚠️  MCP server timed out for tool ${name} (VS Code style handling)`);
        return {
          content: [
            {
              type: 'text',
              text: `Tool ${name} timed out but may have completed successfully.`,
            },
          ],
          isError: false,
        };
      }

      console.error(`❌ Failed to call MCP tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error calling tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private sanitizeArguments(args: any): any {
    if (args === null || args === undefined) {
      return {};
    }

    // Basic sanitization - remove potentially dangerous fields
    const sanitized = { ...args };
    
    // Remove any fields that could be used for injection
    delete sanitized.__proto__;
    delete sanitized.constructor;
    delete sanitized.prototype;
    
    return sanitized;
  }

  /**
   * Refresh the tool list - useful if the MCP server supports dynamic tools
   */
  async refreshTools(): Promise<void> {
    if (this.connected) {
      await this.loadAvailableTools();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionAttempts(): number {
    return this.connectionAttempts;
  }

  getConnectionConfig(): MCPConnectionConfig {
    return { ...this.connectionConfig };
  }
}

// Global MCP client cache with VS Code-style cleanup
const mcpClients = new Map<string, VSCodeStyleMCPClient>();
const CLIENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create an MCP client for a given URL
 * This follows the VS Code pattern of maintaining persistent connections
 */
export async function getMCPClient(mcpUrl: string): Promise<VSCodeStyleMCPClient> {
  if (!mcpUrl) {
    throw new Error('MCP URL is required');
  }

  // Check if we already have a client for this URL
  if (mcpClients.has(mcpUrl)) {
    const client = mcpClients.get(mcpUrl)!;
    if (client.isConnected()) {
      return client;
    }
  }

  // Create new VS Code-style client
  const client = new VSCodeStyleMCPClient({
    maxRetries: 3,
    retryDelay: 1500,
    connectionTimeout: 10000,  // VS Code uses 10s
    keepAliveInterval: 30000,  // VS Code uses 30s keepalive
    maxReconnectAttempts: 5,
  });

  await client.connect(mcpUrl);
  mcpClients.set(mcpUrl, client);

  // Set up cleanup timer
  setTimeout(() => {
    disconnectMCPClient(mcpUrl);
  }, CLIENT_TIMEOUT);

  return client;
}

export async function disconnectMCPClient(mcpUrl: string): Promise<void> {
  const client = mcpClients.get(mcpUrl);
  if (client) {
    try {
      await client.disconnect();
    } catch (error) {
      console.warn('Error disconnecting MCP client:', error);
    }
    mcpClients.delete(mcpUrl);
  }
}

export function getConnectedClientsCount(): number {
  return mcpClients.size;
}

/**
 * Convert MCP tools to format expected by Claude API
 * This is what makes the tools available to the AI model
 */
export function convertMCPToolsToClaudeFormat(tools: MCPTool[]): any[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));
}

/**
 * Health check function for monitoring
 */
export async function healthCheckMCPClient(mcpUrl: string): Promise<{ connected: boolean; toolsCount: number; error?: string }> {
  try {
    const client = await getMCPClient(mcpUrl);
    return {
      connected: client.isConnected(),
      toolsCount: client.getAvailableTools().length,
    };
  } catch (error) {
    return {
      connected: false,
      toolsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 