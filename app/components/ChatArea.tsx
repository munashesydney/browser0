import React from 'react';
import ChatInput from './ChatInput';
import MCPStatusIndicator from './MCPStatusIndicator';
import AIProgressIndicator from './AIProgressIndicator';
import SavedProgressDisplay from './SavedProgressDisplay';
import { Bot, User } from 'lucide-react';

interface ChatAreaProps {
  chatId?: number | null;
  messages: Array<{
    content: string;
    role: string;
    progress_data?: any;
  }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{
    content: string;
    role: string;
    progress_data?: any;
  }>>>;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId, messages, setMessages }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or progress indicator appears
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSubmit = async (message: string, mode: 'ask' | 'agent') => {
    setMessages(prev => [...prev, {content: message, role: 'user'}]);

    // Persist the message and generate AI response if chatId is available
    if (chatId) {
      try {
        // Save user message
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, content: message, role: 'user' }),
        });

        // Generate AI response
        setIsGenerating(true);
        setMessages(prev => [...prev, {content: 'TYPING_INDICATOR', role: 'assistant'}]); // Show typing indicator

        const response = await fetch(`/api/chat/${chatId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
        const data = await response.json();

        if (data.response) {
          // Remove typing indicator and refresh messages from database to get progress data
          setMessages(prev => prev.slice(0, -1));
          
          // Fetch updated messages from database to get the saved progress data
          const messagesResponse = await fetch(`/api/messages?chatId=${chatId}`);
          const messagesData = await messagesResponse.json();
          if (messagesData.messages) {
            setMessages(messagesData.messages);
          }
        } else {
          setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
        }
      } catch (err) {
        console.error('Failed to process message', err);
        setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="w-[400px] flex-shrink-0 pl-8">
      <div className="h-full flex flex-col">
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
          {/* MCP Status Indicator */}
          <MCPStatusIndicator chatId={chatId || null} isVisible={!!chatId} />
          
          {messages.map((message, index) => (
            <div key={index}>
              <div className="flex gap-3 items-start animate-fadeIn">
                {message.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-purple-400" />
                  </div>
                )}
                <div className="flex-1">
                  {/* Show progress data if available for assistant messages */}
                  {message.role === 'assistant' && message.progress_data && (
                    <SavedProgressDisplay progressData={message.progress_data} />
                  )}
                  
                  <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 text-sm text-gray-200 leading-relaxed">
                    {message.content === 'TYPING_INDICATOR' ? (
                      <div className="flex items-center gap-2">
                        <span>Thinking</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* AI Progress Indicator - positioned at bottom */}
          <div ref={progressRef}>
            <AIProgressIndicator chatId={chatId || null} isVisible={isGenerating} />
          </div>
        </div>
        <div className="p-4">
          <ChatInput onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default ChatArea; 