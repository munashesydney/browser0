import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const BrowserPreview: React.FC = () => {
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
        
        <div className="flex items-center justify-center h-[calc(100%-2.5rem)]">
          <p className="text-gray-500">Browser preview will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default BrowserPreview; 