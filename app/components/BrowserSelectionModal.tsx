import React, { useState, useEffect } from 'react';
import { X, Plus, Globe, MessageSquare, Clock, Cpu, HardDrive } from 'lucide-react';

interface Browser {
  id: number;
  browser_id: string;
  name: string;
  status: string;
  memory: number;
  cpu: number;
  uptime: string;
  vnc_url: string;
  novnc_url: string;
  debug_url: string;
  mcp_url: string;
  created_at: string;
  chat_count: number;
  last_message: string;
  last_message_time: string;
}

interface BrowserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBrowser: (browserId: number) => void;
  onCreateBrowser: (name: string) => void;
  message: string;
}

const BrowserSelectionModal: React.FC<BrowserSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectBrowser,
  onCreateBrowser,
  message
}) => {
  const [browsers, setBrowsers] = useState<Browser[]>([]);
  const [newBrowserName, setNewBrowserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBrowsers();
      // Generate a default name based on the message content
      const firstWords = message.split(' ').slice(0, 3).join(' ');
      setNewBrowserName(firstWords || 'New Browser');
    }
  }, [isOpen, message]);

  const loadBrowsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/browsers');
      const data = await response.json();
      if (data.browsers) {
        setBrowsers(data.browsers);
      }
    } catch (error) {
      console.error('Failed to load browsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrowser = async () => {
    if (!newBrowserName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateBrowser(newBrowserName.trim());
      setNewBrowserName('');
      onClose();
    } catch (error) {
      console.error('Failed to create browser:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectBrowser = (browserId: number) => {
    onSelectBrowser(browserId);
    onClose();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'text-green-400';
      case 'stopped':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Select Browser</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Message Preview */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Message to send:</h3>
            <p className="text-white text-sm line-clamp-3">{message}</p>
          </div>

          {/* Create New Browser */}
          <div className="mb-6 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
            <div className="flex items-center gap-2 mb-3">
              <Plus size={16} className="text-blue-400" />
              <h3 className="text-sm font-medium text-white">Create New Browser</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBrowserName}
                onChange={(e) => setNewBrowserName(e.target.value)}
                placeholder="Browser name"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBrowser()}
              />
              <button
                onClick={handleCreateBrowser}
                disabled={isCreating || !newBrowserName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>

          {/* Existing Browsers */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Existing Browsers ({browsers.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading browsers...
              </div>
            ) : browsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No browsers yet. Create your first one above!
              </div>
            ) : (
              <div className="space-y-3">
                {browsers.map((browser) => (
                  <div
                    key={browser.id}
                    onClick={() => handleSelectBrowser(browser.id)}
                    className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe size={16} className="text-blue-400" />
                          <h4 className="font-medium text-white">{browser.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(browser.status)}`}>
                            {browser.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>{browser.chat_count} chat{browser.chat_count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive size={12} />
                            <span>{browser.memory}MB</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Cpu size={12} />
                            <span>{browser.cpu}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatTime(browser.last_message_time)}</span>
                          </div>
                        </div>
                        
                        {browser.last_message && (
                          <p className="text-sm text-gray-300 line-clamp-2">
                            {browser.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserSelectionModal; 