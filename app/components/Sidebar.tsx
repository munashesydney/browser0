import React from 'react';
import { PanelTop as Panel, X, Settings, User, Globe, MessageSquare, ArrowLeft, Clock, Cpu, HardDrive, Play, Pause, Trash2, Loader2 } from 'lucide-react';

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

interface Chat {
  id: number;
  title: string | null;
  created_at: string;
  last_message: string;
  last_message_time: string;
  browser_name?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectChat: (chatId: number) => void;
  onSelectBrowser?: (browserId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  onSelectChat, 
  onSelectBrowser 
}) => {
  const [browsers, setBrowsers] = React.useState<Browser[]>([]);
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [recentChats, setRecentChats] = React.useState<Chat[]>([]);
  const [selectedBrowser, setSelectedBrowser] = React.useState<Browser | null>(null);
  const [view, setView] = React.useState<'browsers' | 'chats'>('browsers');
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && view === 'browsers') {
      loadBrowsers();
      loadRecentChats();
    }
  }, [isOpen, view]);

  const loadBrowsers = async () => {
    try {
      const response = await fetch('/api/browsers');
      const data = await response.json();
      if (data?.browsers) {
        setBrowsers(data.browsers);
      }
    } catch (error) {
      console.error('Failed to load browsers:', error);
    }
  };

  const loadChatsForBrowser = async (browserId: number) => {
    try {
      const response = await fetch(`/api/browsers/${browserId}/chats`);
      const data = await response.json();
      if (data?.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadRecentChats = async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      if (data?.chats) {
        // Get recent chats with browser names
        const chatsWithBrowserNames = await Promise.all(
          data.chats.slice(0, 5).map(async (chat: Chat) => {
            try {
              const browserResponse = await fetch(`/api/chat/${chat.id}`);
              const browserData = await browserResponse.json();
              return {
                ...chat,
                browser_name: browserData?.browser?.name || 'Unknown Browser'
              };
            } catch {
              return { ...chat, browser_name: 'Unknown Browser' };
            }
          })
        );
        setRecentChats(chatsWithBrowserNames);
      }
    } catch (error) {
      console.error('Failed to load recent chats:', error);
    }
  };

  const handleBrowserSelect = async (browser: Browser) => {
    setSelectedBrowser(browser);
    setView('chats');
    await loadChatsForBrowser(browser.id);
    
    // Notify parent component if callback is provided
    if (onSelectBrowser) {
      onSelectBrowser(browser.id);
    }
  };

  const handleChatSelect = (chatId: number) => {
    setBrowsers([]); // clear list to indicate reload next time
    setChats([]); // clear chats list too
    onToggle();
    onSelectChat(chatId);
  };

  const handleBackToBrowsers = () => {
    setView('browsers');
    setSelectedBrowser(null);
    setChats([]);
  };

  const handleBrowserAction = async (browserId: number, action: 'pause' | 'resume' | 'delete', event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent browser selection
    
    const actionKey = `${browserId}-${action}`;
    setLoadingAction(actionKey);
    
    try {
      const formData = new FormData();
      formData.append('action', action);
      
      const response = await fetch(`/api/browsers/${browserId}/actions`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        if (action === 'delete') {
          // Remove browser from list
          setBrowsers(prev => prev.filter(b => b.id !== browserId));
        } else {
          // Reload browsers to get updated status
          await loadBrowsers();
        }
      } else {
        console.error('Browser action failed:', result.error);
        // TODO: Show error toast/notification
      }
    } catch (error) {
      console.error('Failed to perform browser action:', error);
      // TODO: Show error toast/notification
    } finally {
      setLoadingAction(null);
    }
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

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed top-4 left-6 z-50 p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Toggle Sidebar"
      >
        <Panel size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onToggle} />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-sm z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex-1 overflow-hidden">
            <button
              onClick={onToggle}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mt-12 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                {view === 'chats' && (
                  <button
                    onClick={handleBackToBrowsers}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h2 className="text-xl font-semibold text-white">
                  {view === 'browsers' ? 'Browsers' : selectedBrowser?.name || 'Chats'}
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {view === 'browsers' ? (
                  <>
                    {/* Browser List */}
                    <div className="space-y-3">
                      {browsers.map((browser) => (
                      <div
                        key={browser.id}
                        onClick={() => handleBrowserSelect(browser)}
                        className="p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-gray-800"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Globe size={16} className="text-blue-400" />
                          <p className="text-sm font-medium text-white truncate flex-1">
                            {browser.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(browser.status)}`}>
                              {browser.status}
                            </span>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1 ml-1">
                              {browser.status.toLowerCase() === 'running' ? (
                                <button
                                  onClick={(e) => handleBrowserAction(browser.id, 'pause', e)}
                                  className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors rounded disabled:opacity-50"
                                  title="Pause browser"
                                  disabled={loadingAction === `${browser.id}-pause`}
                                >
                                  {loadingAction === `${browser.id}-pause` ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Pause size={12} />
                                  )}
                                </button>
                              ) : browser.status.toLowerCase() === 'paused' || browser.status.toLowerCase() === 'stopped' ? (
                                <button
                                  onClick={(e) => handleBrowserAction(browser.id, 'resume', e)}
                                  className="p-1 text-green-400 hover:text-green-300 transition-colors rounded disabled:opacity-50"
                                  title="Resume browser"
                                  disabled={loadingAction === `${browser.id}-resume`}
                                >
                                  {loadingAction === `${browser.id}-resume` ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Play size={12} />
                                  )}
                                </button>
                              ) : null}
                              
                              <button
                                onClick={(e) => handleBrowserAction(browser.id, 'delete', e)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors rounded disabled:opacity-50"
                                title="Delete browser"
                                disabled={loadingAction === `${browser.id}-delete`}
                              >
                                {loadingAction === `${browser.id}-delete` ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <MessageSquare size={10} />
                            <span>{browser.chat_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive size={10} />
                            <span>{browser.memory}MB</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Cpu size={10} />
                            <span>{browser.cpu}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{formatTime(browser.last_message_time)}</span>
                          </div>
                        </div>
                        
                        {browser.last_message && (
                          <p className="text-xs text-gray-500 truncate">
                            {browser.last_message}
                          </p>
                        )}
                      </div>
                    ))}
                    {browsers.length === 0 && (
                      <p className="text-gray-500 text-sm">No browsers yet.</p>
                    )}
                    </div>
                    
                    {/* Recent Chats Section */}
                    {recentChats.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-400 mb-3 px-1">Recent Chats</h3>
                        <div className="space-y-2">
                          {recentChats.map((chat) => (
                            <div
                              key={chat.id}
                              onClick={() => handleChatSelect(chat.id)}
                              className="px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-blue-500/30"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare size={12} className="text-blue-400" />
                                <p className="text-xs text-blue-400 truncate">
                                  {chat.browser_name}
                                </p>
                              </div>
                              <p className="text-xs text-white truncate">
                                {chat.title || chat.last_message || `Chat #${chat.id}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(chat.last_message_time)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Chat List for Selected Browser
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleChatSelect(chat.id)}
                        className="px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <p className="text-sm font-medium truncate text-white">
                          {chat.title || chat.last_message || `Chat #${chat.id}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {chat.last_message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatTime(chat.last_message_time)}
                        </p>
                      </div>
                    ))}
                    {chats.length === 0 && (
                      <p className="text-gray-500 text-sm">No chats in this browser yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-gray-800">
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <User size={18} />
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 