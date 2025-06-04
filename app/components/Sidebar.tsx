import React from 'react';
import { PanelTop as Panel, X, Settings, User } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
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
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4">
            <button
              onClick={onToggle}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-white mb-4">Chats</h2>
              <div className="space-y-2">
                <div className="px-2 py-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <p className="text-sm text-white font-medium">Build a mobile app with Expo</p>
                  <p className="text-xs text-gray-400 mt-1">Started 2 hours ago</p>
                </div>
                <div className="px-2 py-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <p className="text-sm text-gray-300 font-medium">Create a docs site</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
                <div className="px-2 py-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <p className="text-sm text-gray-300 font-medium">Draft presentation</p>
                  <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                </div>
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