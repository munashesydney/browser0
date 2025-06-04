import React from 'react';
import { Link } from '@remix-run/react';
import { Github, MessageSquare, Twitter } from 'lucide-react';

interface HeaderProps {
  showChat: boolean;
}

const Header: React.FC<HeaderProps> = ({ showChat }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 py-4">
      <div className="max-w-[2000px] mx-auto flex justify-between items-center">
        <Link 
          to="/" 
          className={`font-semibold text-xl ${showChat ? 'pl-16' : 'pl-6'}`}
        >
          <span className="text-white">Browser</span>
          <span className="text-blue-500">0</span>
        </Link>
        
        <div className="flex gap-4 items-center pr-6">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Github size={20} />
          </a>
          <a 
            href="https://discord.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <MessageSquare size={20} />
          </a>
          <a 
            href="https://x.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Twitter size={20} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header; 