import React from 'react';
import TextareaCard from './TextareaCard';
import { Bot, User } from 'lucide-react';

interface ChatAreaProps {
  messages: string[];
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, setMessages }) => {
  const handleSubmit = (message: string) => {
    setMessages([...messages, message]);
  };

  return (
    <div className="w-[400px] flex-shrink-0 pl-8">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className="flex gap-3 items-start animate-fadeIn"
            >
              {index % 2 === 0 ? (
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-blue-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-purple-400" />
                </div>
              )}
              <div className="flex-1 bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 text-sm text-gray-200 leading-relaxed">
                {message}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4">
          <TextareaCard onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default ChatArea; 