import React from 'react';
import { Zap, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center text-sm text-gray-400 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500/20 text-green-500">M</span>
        <div className="h-4 w-px bg-gray-800 mx-2" />
        <button className="hover:text-gray-300 transition-colors">Help Center</button>
        <div className="h-4 w-px bg-gray-800 mx-2" />
        <button className="hover:text-gray-300 transition-colors">Pricing</button>
        <div className="h-4 w-px bg-gray-800 mx-2" />
        <button className="hover:text-gray-300 transition-colors">Terms</button>
        <div className="h-4 w-px bg-gray-800 mx-2" />
        <button className="hover:text-gray-300 transition-colors">Privacy</button>
        <div className="h-4 w-px bg-gray-800 mx-2" />
        <span className="text-blue-400">•</span>
      </div>
      <div className="flex items-center gap-2">
        {/* <span>We're hiring</span> */}
        <div className="flex items-center gap-1">
          <Globe size={16} className="text-gray-500" />
          <span className="font-medium">Powered By Browserize</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 