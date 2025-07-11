import React, { useState, useEffect } from 'react';
import { Bot, Wifi, WifiOff, Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface MCPStatusIndicatorProps {
  chatId: number | null;
  isVisible: boolean;
}

interface MCPStatus {
  connected: boolean;
  toolsCount: number;
  error?: string;
  loading: boolean;
}

const MCPStatusIndicator: React.FC<MCPStatusIndicatorProps> = ({ chatId, isVisible }) => {
  const [status, setStatus] = useState<MCPStatus>({
    connected: false,
    toolsCount: 0,
    loading: true,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!chatId || !isVisible) return;

    let timeoutId: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;

    const checkMCPStatus = async () => {
      try {
        const response = await fetch(`/api/mcp-status/${chatId}`);
        const data = await response.json();
        
        setStatus({
          connected: data.connected || false,
          toolsCount: data.toolsCount || 0,
          error: data.error,
          loading: false,
        });

        // If not connected, keep checking for a while
        if (!data.connected && status.loading) {
          timeoutId = setTimeout(checkMCPStatus, 2000);
        }
      } catch (error) {
        setStatus({
          connected: false,
          toolsCount: 0,
          error: 'Failed to check MCP status',
          loading: false,
        });
      }
    };

    // Initial check after a short delay
    timeoutId = setTimeout(checkMCPStatus, 1000);

    // Set up polling every 30 seconds once connected
    pollInterval = setInterval(() => {
      if (status.connected) {
        checkMCPStatus();
      }
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(pollInterval);
    };
  }, [chatId, isVisible]);

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (status.loading) return 'text-yellow-400';
    if (status.connected) return 'text-green-400';
    if (status.error) return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (status.loading) return <Activity className="animate-pulse" size={16} />;
    if (status.connected) return <CheckCircle size={16} />;
    if (status.error) return <AlertCircle size={16} />;
    return <WifiOff size={16} />;
  };

  const getStatusText = () => {
    if (status.loading) return 'Connecting to browser...';
    if (status.connected) return `Ready for automation (${status.toolsCount} tools)`;
    if (status.error) return 'Connection failed';
    return 'Not connected';
  };

  return (
    <div className="mb-4">
      {/* Main Status Card */}
      <div 
        className={`
          relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer
          ${status.connected 
            ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 shadow-lg shadow-green-500/20' 
            : status.loading
            ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
            : 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 border-gray-500/30'
          }
          hover:scale-[1.02] hover:shadow-xl
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Animated Background Pulse */}
        {status.connected && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-blue-400/5 animate-pulse" />
        )}
        
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            
            {/* Status Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-purple-400" />
                <span className="font-semibold text-white text-sm">AI Browser Control</span>
                {status.connected && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                    <div className="w-2 h-2 bg-green-400 rounded-full absolute" />
                  </div>
                )}
              </div>
              <p className={`text-sm ${getStatusColor()} mt-1`}>
                {getStatusText()}
              </p>
            </div>

            {/* Expand Icon */}
            <div className={`transform transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 p-4 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-700/50 animate-slideDown">
          <div className="space-y-3">
            <h4 className="font-medium text-white text-sm flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              Browser Automation Capabilities
            </h4>
            
            {status.connected ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-green-400 font-medium">✓ Navigation & Control</div>
                  <div className="text-gray-400">• URL navigation</div>
                  <div className="text-gray-400">• Page history</div>
                  <div className="text-gray-400">• Window control</div>
                </div>
                <div className="space-y-1">
                  <div className="text-green-400 font-medium">✓ Page Interaction</div>
                  <div className="text-gray-400">• Click elements</div>
                  <div className="text-gray-400">• Fill forms</div>
                  <div className="text-gray-400">• Extract data</div>
                </div>
                <div className="space-y-1">
                  <div className="text-green-400 font-medium">✓ Advanced Tools</div>
                  <div className="text-gray-400">• Screenshots</div>
                  <div className="text-gray-400">• File uploads</div>
                  <div className="text-gray-400">• Network monitoring</div>
                </div>
                <div className="space-y-1">
                  <div className="text-green-400 font-medium">✓ Smart Analysis</div>
                  <div className="text-gray-400">• Page structure</div>
                  <div className="text-gray-400">• Element detection</div>
                  <div className="text-gray-400">• Content extraction</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 text-sm">
                  {status.loading ? (
                    <>
                      <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2" />
                      Setting up browser automation...
                    </>
                  ) : status.error ? (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      {status.error}
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      Browser automation not available
                    </>
                  )}
                </div>
              </div>
            )}

            {status.connected && (
              <div className="mt-3 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                <div className="text-center">
                  <div className="text-green-400 font-medium text-sm mb-1">🚀 Ready for Commands!</div>
                  <div className="text-gray-300 text-xs">
                    Ask me to navigate websites, fill forms, extract data, and more!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPStatusIndicator; 