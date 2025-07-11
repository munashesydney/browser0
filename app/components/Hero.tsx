import React, { useState } from 'react';
import TextareaCard from './TextareaCard';

interface HeroProps {
  onSubmit: (message: string, mode: 'ask' | 'agent') => void;
  onBrowserSelect?: (browserId: number, message: string, mode: 'ask' | 'agent') => void;
  onCreateBrowser?: (name: string, message: string, mode: 'ask' | 'agent') => void;
}

const Hero: React.FC<HeroProps> = ({ 
  onSubmit, 
  onBrowserSelect, 
  onCreateBrowser 
}) => {
  const [textareaValue, setTextareaValue] = useState('');

  const handleButtonClick = (buttonText: string) => {
    const newValue = textareaValue ? `${textareaValue}\n${buttonText}` : buttonText;
    setTextareaValue(newValue);
  };

  return (
    <section className="min-h-screen pt-32 pb-16 px-6 flex flex-col items-center justify-center max-w-4xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
        What do you want to automate?
      </h1>
      
      <p className="text-gray-400 text-lg mb-12">
        Prompt, run, and automate browser tasks with AI
      </p>

      <div className="w-full max-w-3xl">
        <TextareaCard 
          onSubmit={onSubmit}
          onBrowserSelect={onBrowserSelect}
          onCreateBrowser={onCreateBrowser}
          value={textareaValue}
          onChange={setTextareaValue}
        />
      </div>
      
      <div className="mt-8 text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => handleButtonClick('Visit YouTube')}
            className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Visit YouTube
          </button>
          <button 
            onClick={() => handleButtonClick('Search "Michael Jackson" on Wikipedia')}
            className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Search "Michael Jackson" on Wikipedia
          </button>
          <button 
            onClick={() => handleButtonClick('Check weather on Google')}
            className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Check weather on Google
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => handleButtonClick('Browse Reddit')}
            className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Browse Reddit
          </button>
          <button 
            onClick={() => handleButtonClick('Search for recipes on Pinterest')}
            className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Search for recipes on Pinterest
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero; 