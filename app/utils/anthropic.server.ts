import { getMCPClient, convertMCPToolsToClaudeFormat } from './mcp.server';
import { createMessage } from './db.server';

// Extend global type to include our progress senders
declare global {
  var aiProgressSenders: Map<string, (data: any) => void> | undefined;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    id?: string;
    name?: string;
    input?: any;
    tool_use_id?: string;
    content?: any;
    is_error?: boolean;
  }>;
}

interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

interface ProgressData {
  steps: ProgressStep[];
  iterations: number;
  totalTime: number;
  completedSteps: number;
  totalSteps: number;
}

// Helper function to send progress updates
function sendProgressUpdate(chatId: string, data: any) {
  if (typeof global !== 'undefined' && global.aiProgressSenders) {
    const sender = global.aiProgressSenders.get(chatId);
    if (sender) {
      sender(data);
    }
  }
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: any;
}

// Helper function to get tool description
function getToolDescription(toolName: string, params?: any): string {
  switch (toolName) {
    case 'browser_navigate':
      return `Navigating to ${params?.url || 'webpage'}`;
    case 'browser_take_screenshot':
      return 'Capturing page screenshot';
    case 'browser_click':
      return `Clicking ${params?.element || 'element'}`;
    case 'browser_type':
      return `Typing "${params?.text || 'text'}"`;
    case 'browser_snapshot':
      return 'Analyzing page structure';
    case 'browser_wait_for':
      return `Waiting ${params?.time || 3} seconds`;
    default:
      return `Executing ${toolName}`;
  }
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokenCount(content: any): number {
  if (typeof content === 'string') {
    return Math.ceil(content.length / 4);
  }
  
  if (Array.isArray(content)) {
    return content.reduce((total, item) => {
      if (item.type === 'text' && item.text) {
        return total + Math.ceil(item.text.length / 4);
      }
      if (item.type === 'tool_result' && item.content) {
        return total + estimateTokenCount(item.content);
      }
      return total + 50; // Base tokens for structure
    }, 0);
  }
  
  return 100; // Default for unknown content
}

// Compress large tool results to prevent token explosion
function compressToolResult(result: any): any {
  if (!result.content || !Array.isArray(result.content)) {
    return result;
  }
  
  const compressedContent = result.content.map((item: any) => {
    if (item.type === 'text' && item.text && item.text.length > 5000) {
      // Truncate very long text responses
      return {
        ...item,
        text: item.text.substring(0, 5000) + '... [truncated for brevity]'
      };
    }
    
    if (item.type === 'image' || item.mimeType?.startsWith('image/')) {
      // Replace image data with summary
      return {
        type: 'text',
        text: '[Screenshot taken and analyzed]'
      };
    }
    
    return item;
  });
  
  return {
    ...result,
    content: compressedContent
  };
}

// Smart history trimming based on token count
function trimConversationHistory(messages: AnthropicMessage[], maxTokens: number = 150000): AnthropicMessage[] {
  if (messages.length <= 2) return messages; // Always keep at least 2 messages
  
  let totalTokens = 0;
  const tokenCounts = messages.map(msg => {
    const count = estimateTokenCount(msg.content);
    totalTokens += count;
    return count;
  });
  
  if (totalTokens <= maxTokens) {
    return messages; // No trimming needed
  }
  
  // Strategy: Keep first message (user's original request) and recent messages
  const firstMessage = messages[0];
  const firstMessageTokens = tokenCounts[0];
  let remainingTokens = maxTokens - firstMessageTokens;
  
  // Work backwards from the end to keep recent messages
  const recentMessages: AnthropicMessage[] = [];
  for (let i = messages.length - 1; i > 0; i--) {
    if (tokenCounts[i] <= remainingTokens) {
      recentMessages.unshift(messages[i]);
      remainingTokens -= tokenCounts[i];
    } else {
      break;
    }
  }
  
  console.log(`📊 Trimmed conversation: ${messages.length} → ${recentMessages.length + 1} messages (${totalTokens} → ${maxTokens - remainingTokens} tokens)`);
  
  return [firstMessage, ...recentMessages];
}

export async function callAnthropic(
  messages: AnthropicMessage[], 
  mcpUrl?: string,
  chatId?: string,
  systemMessage?: string | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
  }

  let tools: AnthropicTool[] = [];
  let mcpClient = null;

  // Initialize progress tracking
  const progressSteps: ProgressStep[] = [];
  const startTime = Date.now();
  let iterationCount = 0;

  // Connect to MCP server if URL is provided
  if (mcpUrl) {
    try {
      mcpClient = await getMCPClient(mcpUrl);
      const mcpTools = mcpClient.getAvailableTools();
      tools = convertMCPToolsToClaudeFormat(mcpTools);
      console.log(`Connected to MCP server. Available tools: ${tools.length}`);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      // Continue without MCP tools
    }
  }

  // Optimize system message - only send once and keep it concise
  const optimizedSystemMessage = systemMessage ? 
    "You have access to external tools via MCP. Use available tools to help accomplish tasks. Wait a few seconds after actions that change page state." :
    null;

  // Iterative tool execution - keep calling until Claude stops using tools
  let conversationMessages = [...messages];
  const maxIterations = 10; // Prevent infinite loops
  
  while (iterationCount < maxIterations) {
    console.log(`🔄 AI Iteration ${iterationCount + 1}`);
    
    // Trim conversation history on EVERY iteration to prevent token explosion
    conversationMessages = trimConversationHistory(conversationMessages);
    
    // Send iteration start update
    if (chatId) {
      sendProgressUpdate(chatId, {
        type: 'iteration_start',
        iteration: iterationCount + 1,
      });
    }
    
    const requestBody: any = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: conversationMessages,
    };

    // Only add system message on first iteration to avoid repetition
    if (optimizedSystemMessage && iterationCount === 0) {
      requestBody.system = optimizedSystemMessage;
    }

    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    
    // Check if Claude wants to use tools
    if (data.content && Array.isArray(data.content)) {
      const toolUses = data.content.filter((item: any) => item.type === 'tool_use');
      
      if (toolUses.length > 0 && mcpClient) {
        console.log(`🔧 Executing ${toolUses.length} tools:`, toolUses.map((t: any) => t.name));
        
        // Execute tools and get results (with deduplication)
        const executedTools = new Set<string>();
        const toolResults = await Promise.all(
          toolUses.map(async (toolUse: any) => {
            const toolKey = `${toolUse.name}-${JSON.stringify(toolUse.input)}`;
            
            // Skip if this exact tool call was already executed
            if (executedTools.has(toolKey)) {
              console.log(`⚠️  Skipping duplicate tool call: ${toolUse.name}`);
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: [{ type: 'text', text: 'Tool call skipped (duplicate)' }],
                is_error: false,
              };
            }
            
            executedTools.add(toolKey);
            
            // Create progress step
            const progressStep: ProgressStep = {
              id: toolUse.id,
              name: toolUse.name,
              description: getToolDescription(toolUse.name, toolUse.input),
              status: 'running',
              startTime: Date.now(),
            };
            
            progressSteps.push(progressStep);
            
            // Send tool start update
            if (chatId) {
              sendProgressUpdate(chatId, {
                type: 'tool_start',
                toolId: toolUse.id,
                toolName: toolUse.name,
                params: toolUse.input,
              });
            }
            
            try {
              console.log(`🔧 Calling MCP tool: ${toolUse.name}`, toolUse.input);
              const result = await mcpClient.callTool(toolUse.name, toolUse.input);
              console.log(`✅ Tool ${toolUse.name} completed successfully`);
              
              // Update progress step
              const stepIndex = progressSteps.findIndex(s => s.id === toolUse.id);
              if (stepIndex !== -1) {
                progressSteps[stepIndex].status = 'completed';
                progressSteps[stepIndex].endTime = Date.now();
              }
              
              // Send tool complete update
              if (chatId) {
                sendProgressUpdate(chatId, {
                  type: 'tool_complete',
                  toolId: toolUse.id,
                  toolName: toolUse.name,
                });
              }
              
              // Compress tool result to prevent token explosion
              const compressedResult = compressToolResult({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result.content,
                is_error: result.isError,
              });
              
              return compressedResult;
            } catch (error) {
              console.error(`❌ Failed to call MCP tool ${toolUse.name}:`, error);
              
              // Update progress step
              const stepIndex = progressSteps.findIndex(s => s.id === toolUse.id);
              if (stepIndex !== -1) {
                progressSteps[stepIndex].status = 'error';
                progressSteps[stepIndex].endTime = Date.now();
                progressSteps[stepIndex].error = error instanceof Error ? error.message : 'Unknown error';
              }
              
              // Check if it's a timeout error but action might have succeeded
              const isTimeoutError = error instanceof Error && error.message.includes('timeout');
              
              // Send tool error update
              if (chatId) {
                sendProgressUpdate(chatId, {
                  type: 'tool_error',
                  toolId: toolUse.id,
                  toolName: toolUse.name,
                  error: error instanceof Error ? error.message : 'Unknown error',
                });
              }
              
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: [{ 
                  type: 'text', 
                  text: isTimeoutError ? 
                    `Tool ${toolUse.name} timed out, but the action may have completed successfully.` :
                    `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                is_error: !isTimeoutError, // Don't mark timeout as error since action might succeed
              };
            }
          })
        );

        // Add assistant response with tool uses and user response with tool results
        conversationMessages.push(
          { role: 'assistant' as const, content: data.content },
          { role: 'user' as const, content: toolResults }
        );

        iterationCount++;
        continue; // Continue the loop to allow Claude to use more tools
      }
    }

    // No tools used, return the final response
    console.log(`✨ AI completed after ${iterationCount + 1} iterations`);
    
    // Send completion update
    if (chatId) {
      sendProgressUpdate(chatId, {
        type: 'ai_complete',
        iterations: iterationCount + 1,
      });
    }
    
    const finalResponse = extractTextFromContent(data.content) || "I completed the actions but couldn't generate a response.";
    
    // Always save response to database (with or without progress data)
    if (chatId) {
      if (progressSteps.length > 0) {
        // Save with progress data for agent mode
        const endTime = Date.now();
        const completedSteps = progressSteps.filter(s => s.status === 'completed').length;
        
        const progressData: ProgressData = {
          steps: progressSteps,
          iterations: iterationCount + 1,
          totalTime: endTime - startTime,
          completedSteps: completedSteps,
          totalSteps: progressSteps.length,
        };
        
        await createMessage(Number(chatId), finalResponse, 'assistant', progressData);
      } else {
        // Save without progress data for ask mode
        await createMessage(Number(chatId), finalResponse, 'assistant');
      }
    }
    
    return finalResponse;
  }

  // If we hit max iterations, return the last response
  console.log(`⚠️  AI reached max iterations (${maxIterations}), returning last response`);
  
  // Send completion update
  if (chatId) {
    sendProgressUpdate(chatId, {
      type: 'ai_complete',
      iterations: maxIterations,
    });
  }
  
  const finalResponse = "I completed the available actions but reached the maximum number of iterations.";
  
  // Always save response to database (with or without progress data)
  if (chatId) {
    if (progressSteps.length > 0) {
      // Save with progress data for agent mode
      const endTime = Date.now();
      const completedSteps = progressSteps.filter(s => s.status === 'completed').length;
      
      const progressData: ProgressData = {
        steps: progressSteps,
        iterations: maxIterations,
        totalTime: endTime - startTime,
        completedSteps: completedSteps,
        totalSteps: progressSteps.length,
      };
      
      await createMessage(Number(chatId), finalResponse, 'assistant', progressData);
    } else {
      // Save without progress data for ask mode
      await createMessage(Number(chatId), finalResponse, 'assistant');
    }
  }
  
  return finalResponse;
}

function extractTextFromContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join(' ');
  }
  
  return '';
}

// Legacy function for backwards compatibility
export async function callAnthropicLegacy(messages: AnthropicMessage[]): Promise<string> {
  return callAnthropic(messages);
} 