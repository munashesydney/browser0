import React, { useState, KeyboardEvent } from 'react';
import { Link2, Settings, Sparkles, Loader2 } from 'lucide-react';
import BrowserSelectionModal from './BrowserSelectionModal';

interface TextareaCardProps {
  onSubmit?: (message: string, mode: 'ask' | 'agent') => void;
  onBrowserSelect?: (browserId: number, message: string, mode: 'ask' | 'agent') => void;
  onCreateBrowser?: (name: string, message: string, mode: 'ask' | 'agent') => void;
  value?: string;
  onChange?: (value: string) => void;
}

const TextareaCard: React.FC<TextareaCardProps> = ({ 
  onSubmit, 
  onBrowserSelect, 
  onCreateBrowser,
  value,
  onChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalMessage, setInternalMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Use controlled value if provided, otherwise use internal state
  const message = value !== undefined ? value : internalMessage;
  const setMessage = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalMessage(newValue);
    }
  };

  const checkExistingBrowsers = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/browsers');
      const data = await response.json();
      return data.browsers && data.browsers.length > 0;
    } catch (error) {
      console.error('Failed to check existing browsers:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setIsChecking(true);
    try {
      const hasBrowsers = await checkExistingBrowsers();
      
      if (hasBrowsers) {
        // Show browser selection modal
        setPendingMessage(message);
        setIsModalOpen(true);
      } else {
        // No browsers exist, create new one directly
        if (onSubmit) {
          onSubmit(message, 'agent');
          setMessage('');
        }
      }
    } catch (error) {
      console.error('Failed to handle submit:', error);
      // Fallback to direct submission
      if (onSubmit) {
        onSubmit(message, 'agent');
        setMessage('');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleBrowserSelect = (browserId: number) => {
    if (onBrowserSelect && pendingMessage) {
      onBrowserSelect(browserId, pendingMessage, 'agent');
      setMessage('');
      setPendingMessage('');
    }
  };

  const handleCreateBrowser = async (name: string) => {
    if (onCreateBrowser && pendingMessage) {
      await onCreateBrowser(name, pendingMessage, 'agent');
      setMessage('');
      setPendingMessage('');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPendingMessage('');
  };

  const handleEnhancePrompt = async () => {
    if (!message.trim()) return;
    
    setIsEnhancing(true);
    try {
      const formData = new FormData();
      formData.append('prompt', message);
      
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success && data.enhanced_prompt) {
        setMessage(data.enhanced_prompt);
      } else {
        console.error('Failed to enhance prompt:', data.error);
        // TODO: Show error toast/notification
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = message.length;
  const maxChars = 2000;

  return (
    <>
      <div className={`relative w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 backdrop-blur-md rounded-xl border shadow-lg transition-all duration-300 hover:shadow-xl ${
        isFocused 
          ? 'border-blue-500/50 bg-gradient-to-br from-gray-900/80 to-gray-900/60 shadow-blue-500/20' 
          : 'border-gray-700/40 hover:border-gray-600/50'
      }`}>
        {/* Subtle glow effect when focused */}
        {isFocused && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm -z-10 animate-pulse" />
        )}
        
        <div className="p-6">        
          {/* Description 
          <div className="text-center mb-4">
            <p className="text-sm text-gray-400">
              AI can interact with and automate the browser
            </p>
          </div>*/}
          
          <textarea
            className="w-full h-40 bg-transparent text-gray-200 p-4 text-lg placeholder-gray-400 outline-none resize-none leading-relaxed"
            placeholder="What would you like me to automate?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyPress}
            maxLength={maxChars}
            disabled={isChecking || isEnhancing}
          />
          
          {/* Bottom section with action buttons and info */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <button className="p-2.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200 hover:scale-105">
                <Link2 size={20} />
              </button>
              <button className="p-2.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200 hover:scale-105">
                <Settings size={20} />
              </button>
              <button 
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !message.trim()}
                className="p-2.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Enhance prompt with AI suggestions"
              >
                {isEnhancing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {isEnhancing ? 'Enhancing prompt...' : 
                   isChecking ? 'Checking browsers...' : 
                   'Press Ctrl+Enter to submit'}
                </span>
              </div>
              <div className={`text-xs transition-colors duration-200 ${
                charCount > maxChars * 0.8 ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {charCount}/{maxChars}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Selection Modal */}
      <BrowserSelectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSelectBrowser={handleBrowserSelect}
        onCreateBrowser={handleCreateBrowser}
        message={pendingMessage}
      />
    </>
  );
};

export default TextareaCard; 