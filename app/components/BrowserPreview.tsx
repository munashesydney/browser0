import React from 'react';
import { Minus, Square, X, Play, Loader2 } from 'lucide-react';

interface BrowserPreviewProps {
  vncUrl: string | null;
  browserStatus?: string;
  browserId?: number;
}

const BrowserPreview: React.FC<BrowserPreviewProps> = ({ vncUrl, browserStatus, browserId }) => {
  const [isResuming, setIsResuming] = React.useState(false);
  
  const handleResumeBrowser = async () => {
    if (!browserId) return;
    
    setIsResuming(true);
    try {
      const formData = new FormData();
      formData.append('action', 'resume');
      
      const response = await fetch(`/api/browsers/${browserId}/actions`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload the page to update the browser status
        window.location.reload();
      } else {
        console.error('Failed to resume browser:', result.error);
      }
    } catch (error) {
      console.error('Failed to resume browser:', error);
    } finally {
      setIsResuming(false);
    }
  };

  const isPaused = browserStatus?.toLowerCase() === 'paused' || browserStatus?.toLowerCase() === 'stopped';

  return (
    <div className="flex-1 px-8 pr-8">
      <div className="h-full rounded-lg border border-gray-800 bg-gray-900/30 backdrop-blur-sm overflow-hidden">
        {/* macOS-like window controls */}
        <div className="h-10 bg-gray-900/50 border-b border-gray-800 flex items-center px-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/90 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/90 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/90 hover:bg-green-500 transition-colors" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-1 bg-gray-800/50 rounded text-xs text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              browser0.app
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-[calc(100%-2.5rem)] bg-black">
          {isPaused ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <Play size={32} className="text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Browser is Paused</h3>
              <p className="text-gray-400 text-sm max-w-md">
                This browser is currently paused to save resources. Resume it to continue your session.
              </p>
              <button
                onClick={handleResumeBrowser}
                disabled={isResuming}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isResuming ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Resume Browser
                  </>
                )}
              </button>
            </div>
          ) : vncUrl ? (
            <iframe
              src={((): string => {
                let url = vncUrl.startsWith('/') ? vncUrl.slice(1) : vncUrl;
                if (!/^https?:\/\//.test(url)) {
                  url = `http://${url}`;
                }
                return url;
              })()}
              title="Browser Preview"
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 104 12z" />
              </svg>
              <p className="text-gray-500 text-sm">Launching browser...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowserPreview; 