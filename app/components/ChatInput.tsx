import React, { useState, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile, MessageSquare, Zap } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: string, mode: 'ask' | 'agent') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<'ask' | 'agent'>('agent');

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message, mode);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = message.length;
  const maxChars = 500;

  return (
    <div className={`relative bg-gradient-to-br from-gray-900/60 to-gray-900/40 backdrop-blur-md rounded-xl border shadow-lg transition-all duration-300 hover:shadow-xl ${
      isFocused 
        ? 'border-blue-500/50 bg-gradient-to-br from-gray-900/80 to-gray-900/60 shadow-blue-500/20' 
        : 'border-gray-700/40 hover:border-gray-600/50'
    }`}>
      {/* Subtle glow effect when focused */}
      {isFocused && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm -z-10 animate-pulse" />
      )}
      
      <div className="p-4">
        {/* First row - Textarea and attachment icon */}
        <div className="flex items-end gap-3 mb-3">
          {/* Action buttons */}
          <div className="flex gap-1 pb-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200">
              <Paperclip size={16} />
            </button>
          </div>

          {/* Main textarea */}
          <textarea
            className="flex-1 bg-transparent text-gray-200 text-sm placeholder-gray-400 outline-none resize-none min-h-[36px] max-h-[120px] leading-5 py-2"
            placeholder={mode === 'ask' ? "Ask me anything..." : "Tell me what to do in the browser..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyPress}
            rows={1}
            maxLength={maxChars}
            style={{
              height: 'auto',
              minHeight: '36px',
              maxHeight: '120px',
              overflowY: message.split('\n').length > 3 ? 'auto' : 'hidden'
            }}
          />
        </div>

        {/* Second row - Toggle left, Send button right */}
        <div className="flex items-center justify-between mb-3">
          {/* Mode Selector - Compact */}
          <div className="flex bg-gray-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setMode('ask')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                mode === 'ask'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <MessageSquare size={12} />
              Ask
            </button>
            <button
              onClick={() => setMode('agent')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                mode === 'agent'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap size={12} />
              Agent
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              message.trim()
                ? mode === 'agent'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-gray-500/25 transform hover:scale-105'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Third row - Character count and keyboard hints */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-800/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Press Enter to send</span>
            <span className="text-gray-600">•</span>
            <span>Shift+Enter for new line</span>
          </div>
          <div className={`text-xs transition-colors duration-200 ${
            charCount > maxChars * 0.8 ? 'text-yellow-400' : 'text-gray-500'
          }`}>
            {charCount}/{maxChars}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 