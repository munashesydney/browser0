import React, { useState } from 'react';
import { Link2, Settings } from 'lucide-react';

interface TextareaCardProps {
  onSubmit?: (message: string) => void;
}

const TextareaCard: React.FC<TextareaCardProps> = ({ onSubmit }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && onSubmit) {
      onSubmit(message);
      setMessage('');
    }
  };

  return (
    <div className={`w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 transition-all duration-300 ${
      isFocused ? 'ring-1 ring-gray-700' : ''
    }`}>
      <textarea
        className="w-full h-40 bg-transparent text-gray-200 p-4 text-lg placeholder-gray-500 outline-none resize-none"
        placeholder="How can Browser0 help you today?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div className="flex items-center justify-between px-4 pt-2 border-t border-gray-800">
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors">
            <Link2 size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors">
            <Settings size={20} />
          </button>
        </div>
        <button 
          onClick={handleSubmit}
          className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Automate
        </button>
      </div>
    </div>
  );
};

export default TextareaCard; 